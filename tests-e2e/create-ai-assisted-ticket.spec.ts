import { test } from "./fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { NavigationBarPOM } from "./poms/NavigationBarPOM";
import { TicketModalPOM } from "./poms/TicketModalPOM";
import { KanbanBoardPOM } from "./poms/KanbanBoardPOM";

test.describe("TC-AI-TICKET-001: Tworzenie ticketa z wykorzystaniem AI", () => {
  let navigationBar: NavigationBarPOM;
  let ticketModal: TicketModalPOM;
  let kanbanBoard: KanbanBoardPOM;

  test.beforeEach(async ({ page, loginAs }) => {
    // Clean up any existing route mocks first
    await page.unroute("**/api/ai-suggestion-sessions/analyze");
    // Login as admin for these tests
    await loginAs("admin");
    // Navigate to the homepage before each test
    await page.goto("/");
    navigationBar = new NavigationBarPOM(page);
    ticketModal = new TicketModalPOM(page);
    kanbanBoard = new KanbanBoardPOM(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up route mocks to prevent interference between tests
    await page.unroute("**/api/ai-suggestion-sessions/analyze");
    // Close modal if it's still open
    if (await ticketModal.modal.isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await ticketModal.modal.waitFor({ state: "hidden", timeout: 2000 }).catch(() => {
        /* empty catch */
      });
    }
  });

  test("TC-TICKET-AI-001: should create ticket with AI assistance and save both ticket and AI session", async ({
    page,
  }) => {
    // 1. Użytkownik tworzy ticket - Click the "Create a new ticket" button
    await navigationBar.clickCreateTicket();

    // 2. Użytkownik wypełnia tytuł i opis - Wait for the modal to open and fill ticket data
    await ticketModal.waitForModal();
    await expect(ticketModal.modal).toBeVisible();

    const ticketTitle = `AI Assisted Ticket - ${new Date().getTime()}`;
    const ticketDescription = "This is a test ticket created with AI assistance.";
    await ticketModal.fillTitle(ticketTitle);
    await ticketModal.fillDescription(ticketDescription);
    await page.route("**/api/ai-suggestion-sessions/analyze", async (route) => {
      const json = {
        suggestions: [
          {
            type: "INSERT",
            content: "This is a test suggestion",
            applied: false,
          },
          {
            type: "QUESTION",
            content: "This is a test question",
            applied: false,
          },
        ],
      };
      return route.fulfill({ json });
    });
    // 3. Użytkownik klika przycisk "Ask AI" i oczekuje odpowiedzi - Click AI analysis button
    await ticketModal.clickAIAnalysis();

    // 4. System zwraca odpowiedzi - Wait for AI suggestions to appear
    // Note: In a real scenario, we would wait for AI response, but for testing we'll simulate the flow
    await ticketModal.waitForAIAnalysisButtonToBeEnabled();
    // 5. Użytkownik używa podpowiedzi by dodać lepszy kontekst w swoim tickecie
    // Simulate using AI suggestions - click first INSERT button and first QUESTION checkbox
    await ticketModal.clickAISuggestionInsertButton(0);
    await ticketModal.clickAISuggestionQuestionCheckbox(1);

    // 6. Użytkownik ocenia odpowiedzi - Rate AI suggestions with 4 stars
    await ticketModal.rateAI(4);

    // 7-8. Odpowiedzi są zapisywane, Frontend dokonuje dwóch zapytań POST
    // Prepare to intercept both API responses before saving
    const ticketResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.status() === 201
    );

    const aiSessionResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/ai-suggestion-sessions") &&
        response.status() === 201 &&
        response.request().method() === "POST"
    );

    // Save the ticket
    await ticketModal.clickSave();

    // Wait for both API responses
    const ticketResponse = await ticketResponsePromise;

    // Verify ticket creation response
    const newTicket = await ticketResponse.json();
    const newTicketId = newTicket.id;
    expect(newTicketId).toBeDefined();
    expect(newTicket.title).toBe(ticketTitle);

    const aiSessionResponse = await aiSessionResponsePromise;
    // Verify AI session was saved
    const aiSession = await aiSessionResponse.json();

    expect(aiSession).toBeDefined();
    expect(aiSession.rating).toBe(4); // Verify the rating was saved
    expect(aiSession.ticket_id).toBe(newTicketId);
    expect(aiSession.suggestions).toBeDefined();
    expect(aiSession.suggestions).toEqual([
      {
        type: "INSERT",
        content: "This is a test suggestion",
        applied: true,
      },
      {
        type: "QUESTION",
        content: "This is a test question",
        applied: true,
      },
    ]);

    // Verify the modal is closed after saving
    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });

    // Verify the ticket appears on the kanban board
    await kanbanBoard.expectTicketToBeInColumn(newTicketId, "OPEN");
    const ticketCard = kanbanBoard.getTicketCard(newTicketId);
    await expect(ticketCard).toContainText(ticketTitle);
  });

  test("TC-TICKET-AI-005: should support all rating values (1-5 stars) for AI suggestions", async () => {
    // This test would verify that all star rating options work correctly
    await navigationBar.clickCreateTicket();
    await ticketModal.waitForModal();

    await ticketModal.fillTitle("Rating Test Ticket");
    await ticketModal.fillDescription("Testing AI rating functionality");
    await ticketModal.clickAIAnalysis();

    await ticketModal.waitForAIAnalysisButtonToBeEnabled();
    await ticketModal.clickAISuggestionInsertButton(0);

    // Test different ratings
    for (let rating = 1; rating <= 5; rating++) {
      await ticketModal.rateAI(rating as 1 | 2 | 3 | 4 | 5);
    }
  });

  test("TC-TICKET-AI-002: should show loading state on AI analysis button while waiting for response", async ({
    page,
  }) => {
    await navigationBar.clickCreateTicket();
    await ticketModal.waitForModal();

    await ticketModal.fillTitle("Loading Test Ticket");
    await ticketModal.fillDescription("Testing loading state of AI button");

    // Mock delayed AI response to simulate real API call
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/ai-suggestion-sessions/analyze") && response.request().method() === "POST"
    );

    await page.route("**/api/ai-suggestion-sessions/analyze", async (route) => {
      // Delay response by 2 seconds to show loading state
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const json = {
        suggestions: [
          {
            type: "INSERT",
            content: "This is a test suggestion",
            applied: false,
          },
        ],
      };
      return route.fulfill({ json });
    });

    // Click AI analysis button - should show loading state immediately
    await ticketModal.clickAIAnalysis();

    // Verify button shows loading state (spinner visible)
    await ticketModal.expectAIAnalysisButtonToShowLoadingState();

    // Wait for the API response to complete
    await responsePromise;

    // Verify button returns to normal state
    await ticketModal.expectAIAnalysisButtonToShowNormalState();
  });

  test("TC-TICKET-AI-003: should handle AI API endpoint failure gracefully", async ({ page }) => {
    await navigationBar.clickCreateTicket();
    await ticketModal.waitForModal();

    await ticketModal.fillTitle("API Error Test Ticket");
    await ticketModal.fillDescription("Testing API error handling");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/ai-suggestion-sessions/analyze") && response.request().method() === "POST"
    );

    // Mock API failure with 500 error
    await page.route("**/api/ai-suggestion-sessions/analyze", async (route) => {
      // Add a small delay to ensure loading state is visible
      await new Promise((resolve) => setTimeout(resolve, 100));
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    // Click AI analysis button
    await ticketModal.clickAIAnalysis();

    // Verify loading state is shown initially
    await ticketModal.expectAIAnalysisButtonToShowLoadingState();

    // Wait for the response to ensure the component has processed the error
    await responsePromise;

    // Wait for error and verify button returns to normal state
    await ticketModal.expectAIAnalysisButtonToShowNormalState();

    // Verify error toast is shown
    await ticketModal.expectErrorToastToBeVisible();

    // Verify no AI suggestions are displayed
    await ticketModal.expectNoAISuggestionsVisible();
  });

  test("TC-TICKET-AI-004: should handle network failure when calling AI API", async ({ page }) => {
    await navigationBar.clickCreateTicket();
    await ticketModal.waitForModal();

    await ticketModal.fillTitle("Network Error Test Ticket");
    await ticketModal.fillDescription("Testing network error handling");

    const requestFailedPromise = page.waitForEvent("requestfailed", (request) =>
      request.url().includes("/api/ai-suggestion-sessions/analyze")
    );

    // Mock network failure
    await page.route("**/api/ai-suggestion-sessions/analyze", async (route) => {
      // Add a small delay to ensure loading state is visible
      await new Promise((resolve) => setTimeout(resolve, 100));
      return route.abort();
    });

    // Click AI analysis button
    await ticketModal.clickAIAnalysis();

    // Verify loading state is shown initially
    await ticketModal.expectAIAnalysisButtonToShowLoadingState();

    // Wait for the request to fail to ensure the component has processed the error
    await requestFailedPromise;

    // Wait for error and verify button returns to normal state
    await ticketModal.expectAIAnalysisButtonToShowNormalState();

    // Verify error toast is shown
    await ticketModal.expectErrorToastToBeVisible();

    // Verify no AI suggestions are displayed
    await ticketModal.expectNoAISuggestionsVisible();
  });
});
