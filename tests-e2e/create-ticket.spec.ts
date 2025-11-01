import { test } from "./fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { NavigationBarPOM } from "./poms/NavigationBarPOM";
import { TicketModalPOM } from "./poms/TicketModalPOM";
import { KanbanBoardPOM } from "./poms/KanbanBoardPOM";

test.describe("TC-TICKET-001: Tworzenie ticketa", () => {
  let navigationBar: NavigationBarPOM;
  let ticketModal: TicketModalPOM;
  let kanbanBoard: KanbanBoardPOM;

  test.beforeEach(async ({ page, loginAs }) => {
    // Login as admin for these tests
    await loginAs("admin");
    // Navigate to the homepage before each test
    await page.goto("/");
    navigationBar = new NavigationBarPOM(page);
    ticketModal = new TicketModalPOM(page);
    kanbanBoard = new KanbanBoardPOM(page);
  });

  test("should allow a user to create a new ticket", async ({ page, logout }) => {
    // 1. Click the "Create a new ticket" button.
    await navigationBar.clickCreateTicket();

    // 2. Wait for the modal to open.
    await ticketModal.waitForModal();
    await expect(ticketModal.modal).toBeVisible();

    // 3. Fill in the ticket data.
    const ticketTitle = `Test Ticket - ${new Date().getTime()}`;
    const ticketDescription = "This is a test ticket created by an E2E test.";
    await ticketModal.fillTitle(ticketTitle);
    await ticketModal.fillDescription(ticketDescription);

    // Prepare to intercept the API response before saving.
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.status() === 201
    );

    // 4. Save the ticket.
    await ticketModal.clickSave();

    // Wait for the API response and get the new ticket's ID.
    const response = await responsePromise;
    const newTicket = await response.json();
    const newTicketId = newTicket.id;

    // Verify the modal is closed after saving
    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });

    // 5. Check if the kanban board has the new ticket in the "Open" column.
    await kanbanBoard.expectTicketToBeInColumn(newTicketId, "OPEN");
    const ticketCard = kanbanBoard.getTicketCard(newTicketId);
    await expect(ticketCard).toContainText(ticketTitle);

    await logout();
    // Optional: Verify a success toast message is shown
    // This requires the toast to have a data-testid or a specific role/text
    // For example:
    // const successToast = page.locator('[data-testid="toast-success"]');
    // await expect(successToast).toContainText("Ticket created");
  });
});
