import { expect } from "@playwright/test";
import { test } from "./fixtures/auth.fixture";
import { NavigationBarPOM } from "./poms/NavigationBarPOM";
import { TicketModalPOM } from "./poms/TicketModalPOM";
import { KanbanBoardPOM } from "./poms/KanbanBoardPOM";

test.describe("TC-TICKET-007: Admin assign (P1, Integracyjny)", () => {
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

  test("powinien pozwolić adminowi na przypisanie ticketa do innego użytkownika", async ({ page, loginAs, logout }) => {
    const ticketTitle = `Admin Assign Test - ${new Date().getTime()}`;
    const ticketDescription = "Test ticket for admin assignment functionality";

    // Krok 1: Stworz ticket
    await navigationBar.clickCreateTicket();
    await ticketModal.waitForModal();
    await expect(ticketModal.modal).toBeVisible();

    await ticketModal.fillTitle(ticketTitle);
    await ticketModal.fillDescription(ticketDescription);

    // Przechwyć odpowiedź API dla utworzenia ticketa
    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.status() === 201
    );

    await ticketModal.clickSave();

    const createResponse = await createResponsePromise;
    const newTicket = await createResponse.json();
    const ticketId = newTicket.id;

    // Sprawdź że modal się zamknął i ticket jest widoczny na kanban board
    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });
    await kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");

    // Krok 2: Po utworzeniu go, edytuj
    await kanbanBoard.clickEditTicket(ticketId);
    await ticketModal.waitForModal();
    await expect(ticketModal.modal).toBeVisible();

    // Sprawdź czy modal otworzył się w trybie edit
    const titleInput = ticketModal.titleInput;
    await expect(titleInput).toBeEnabled();

    // Krok 3: Zmien assignee na zwyklego uzytkownika
    // (Na ten moment jest to "Overlord5866" - ale chodzi o innego uzytkownika niz ten, ktory jest zalogowany)
    // W testach używamy normal-user z fixtures
    await ticketModal.selectAssignee("Overlord5866");

    // Krok 4: Zapisz ticket
    const updateResponsePromise = page.waitForResponse(
      (response) => response.url().includes(`/api/tickets/${ticketId}`) && response.status() === 200
    );

    await ticketModal.clickSave();

    // Sprawdź odpowiedź API
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    // Sprawdź że modal się zamknął
    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });

    // Krok 5: Zweryfikuj ze ten drugi uzytkownik ma przypisany ticket
    // Wyloguj się jako admin
    await logout();

    // Zaloguj się jako normal-user
    await loginAs("normal-user");
    await page.goto("/");

    // Sprawdź czy ticket jest widoczny i przypisany do normal-user
    await kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");

    // Sprawdź czy ticket pokazuje assignee jako "Overlord5866"
    const ticketCard = kanbanBoard.getTicketCard(ticketId);
    await expect(ticketCard).toContainText("Overlord5866");

    // Dodatkowo można sprawdzić szczegóły ticketa
    await kanbanBoard.clickTicketCard(ticketId);
    await ticketModal.waitForModal();
    await expect(ticketModal.modal).toBeVisible();

    // W trybie view sprawdź czy assignee jest widoczny
    const assigneeBadge = page.getByTestId("assignee-section-view-badge");
    await expect(assigneeBadge).toContainText("Overlord5866");

    // Zamknij modal
    const closeButton = page.getByTestId("ticket-modal-action-buttons-close-cancel");
    await closeButton.click();
    await expect(ticketModal.modal).not.toBeVisible();
  });

  test("powinien pozwolić adminowi na ustawienie ticketa jako nieprzypisanego", async ({ page }) => {
    const ticketTitle = `Admin Unassign Test - ${new Date().getTime()}`;
    const ticketDescription = "Test ticket for admin unassignment functionality";

    // Krok 1: Stworz ticket i przypisz do użytkownika
    await navigationBar.clickCreateTicket();
    await ticketModal.waitForModal();
    await ticketModal.fillTitle(ticketTitle);
    await ticketModal.fillDescription(ticketDescription);

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.status() === 201
    );

    await ticketModal.clickSave();

    const createResponse = await createResponsePromise;
    const newTicket = await createResponse.json();
    const ticketId = newTicket.id;

    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });
    await kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");

    // Krok 2: Edytuj ticket i przypisz do użytkownika
    await kanbanBoard.clickEditTicket(ticketId);
    await ticketModal.waitForModal();
    await ticketModal.selectAssignee("Overlord5866");

    const firstUpdateResponsePromise = page.waitForResponse(
      (response) => response.url().includes(`/api/tickets/${ticketId}`) && response.status() === 200
    );

    await ticketModal.clickSave();
    await firstUpdateResponsePromise;
    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });

    // Krok 3: Edytuj ponownie i ustaw jako nieprzypisany
    await kanbanBoard.clickEditTicket(ticketId);
    await ticketModal.waitForModal();
    await ticketModal.selectUnassigned();

    const secondUpdateResponsePromise = page.waitForResponse(
      (response) => response.url().includes(`/api/tickets/${ticketId}`) && response.status() === 200
    );

    await ticketModal.clickSave();
    await secondUpdateResponsePromise;
    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });

    // Krok 4: Sprawdź czy ticket jest nieprzypisany
    const ticketCard = kanbanBoard.getTicketCard(ticketId);
    await expect(ticketCard).not.toContainText("Overlord5866");

    // Sprawdź szczegóły
    await kanbanBoard.clickTicketCard(ticketId);
    await ticketModal.waitForModal();

    // W trybie view powinien pokazać "Unassigned"
    const assigneeSection = page.getByTestId("assignee-section-view");
    await expect(assigneeSection).toContainText("Unassigned");
  });
});
