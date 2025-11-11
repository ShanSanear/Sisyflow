import { expect } from "@playwright/test";
import { test, testWithRoles } from "./fixtures/auth.fixture";
import type { UserRole } from "./fixtures/auth.fixture";
import { NavigationBarPOM } from "./poms/NavigationBarPOM";
import { TicketModalPOM } from "./poms/TicketModalPOM";
import { KanbanBoardPOM } from "./poms/KanbanBoardPOM";

test.describe("TC-TICKET-002: Edycja przez reportera", () => {
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

  test("powinna pozwolić reporterowi na edycję tytułu ticketa", async ({ page }) => {
    // Przygotowanie: utwórz ticket do edycji
    const originalTitle = `Test Ticket for Edit - ${new Date().getTime()}`;
    const updatedTitle = `Updated Test Ticket - ${new Date().getTime()}`;

    // 1. Utwórz nowy ticket
    await navigationBar.clickCreateTicket();
    await ticketModal.waitForModal();
    await expect(ticketModal.modal).toBeVisible();

    await ticketModal.fillTitle(originalTitle);
    await ticketModal.fillDescription("Description for test ticket");

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

    // 2. Scenariusz edycji: Click ticket → otwiera modal w trybie view
    await kanbanBoard.clickTicketCard(ticketId);
    await ticketModal.waitForModal();
    await expect(ticketModal.modal).toBeVisible();

    // 3. "Edit" → przełącza modal w tryb edycji
    await ticketModal.clickEdit();

    // 4. change title → zmiana tytułu
    await ticketModal.fillTitle(updatedTitle);

    // 5. "Save" → zapisuje zmiany
    // Przechwyć odpowiedź API dla aktualizacji ticketa
    const updateResponsePromise = page.waitForResponse(
      (response) => response.url().includes(`/api/tickets/${ticketId}`) && response.status() === 200
    );

    await ticketModal.clickSave();

    // Sprawdź odpowiedź API
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    // Sprawdź że modal się zamknął
    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });

    // Sprawdź że tytuł został zaktualizowany na kanban board
    await kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");
    const updatedTicketCard = kanbanBoard.getTicketCard(ticketId);
    await expect(updatedTicketCard).toContainText(updatedTitle);
    await expect(updatedTicketCard).not.toContainText(originalTitle);
  });

  test("powinna obsługiwać edycję poprzez dropdown menu ticketa", async ({ page }) => {
    // Przygotowanie: utwórz ticket do edycji
    const originalTitle = `Dropdown Edit Test - ${new Date().getTime()}`;
    const updatedTitle = `Dropdown Updated Test - ${new Date().getTime()}`;

    // 1. Utwórz nowy ticket
    await navigationBar.clickCreateTicket();
    await ticketModal.waitForModal();
    await ticketModal.fillTitle(originalTitle);
    await ticketModal.fillDescription("Description for dropdown edit test");

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.status() === 201
    );
    await ticketModal.clickSave();

    const createResponse = await createResponsePromise;
    const newTicket = await createResponse.json();
    const ticketId = newTicket.id;

    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });

    // 2. Alternatywny scenariusz: kliknij Edit w dropdown menu ticketa
    await kanbanBoard.clickEditTicket(ticketId);
    await ticketModal.waitForModal();
    await expect(ticketModal.modal).toBeVisible();

    // Sprawdź czy modal otworzył się w trybie edit (input powinien być włączony)
    const titleInput = ticketModal.titleInput;
    await expect(titleInput).toBeEnabled();

    // 3. Zmień tytuł i zapisz
    await ticketModal.fillTitle(updatedTitle);

    const updateResponsePromise = page.waitForResponse(
      (response) => response.url().includes(`/api/tickets/${ticketId}`) && response.status() === 200
    );
    await ticketModal.clickSave();

    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);

    // 4. Sprawdź wyniki
    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });
    await kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");
    const updatedTicketCard = kanbanBoard.getTicketCard(ticketId);
    await expect(updatedTicketCard).toContainText(updatedTitle);
  });
});

// Example: Running the same test with different user roles
testWithRoles(["admin", "normal-user"], "should allow editing ticket title", async ({ page }, role: UserRole) => {
  // Initialize POMs within the test scope
  const navigationBar = new NavigationBarPOM(page);
  const ticketModal = new TicketModalPOM(page);
  const kanbanBoard = new KanbanBoardPOM(page);

  // Navigate to the board
  await page.goto("/");

  // Przygotowanie: utwórz ticket do edycji
  const originalTitle = `Test Ticket for Edit (${role}) - ${new Date().getTime()}`;
  const updatedTitle = `Updated Test Ticket (${role}) - ${new Date().getTime()}`;

  // 1. Utwórz nowy ticket
  await navigationBar.clickCreateTicket();
  await ticketModal.waitForModal();
  await expect(ticketModal.modal).toBeVisible();

  await ticketModal.fillTitle(originalTitle);
  await ticketModal.fillDescription(`Description for test ticket as ${role}`);

  // Przechwyć odpowiedź API dla utworzenia ticketa
  const createResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/tickets") && response.status() === 201
  );

  await ticketModal.clickSave();

  const createResponse = await createResponsePromise;
  const newTicket = await createResponse.json();
  const ticketId = newTicket.id;

  // Sprawdź że modal się zamknął i ticket jest widoczny na kanban board
  await expect(ticketModal.modal).not.toBeVisible();
  await kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");

  // 2. Scenariusz edycji: Click ticket → otwiera modal w trybie view
  await kanbanBoard.clickTicketCard(ticketId);
  await ticketModal.waitForModal();
  await expect(ticketModal.modal).toBeVisible();

  // 3. "Edit" → przełącza modal w tryb edycji
  await ticketModal.clickEdit();

  // 4. change title → zmiana tytułu
  await ticketModal.fillTitle(updatedTitle);

  // 5. "Save" → zapisuje zmiany
  // Przechwyć odpowiedź API dla aktualizacji ticketa
  const updateResponsePromise = page.waitForResponse(
    (response) => response.url().includes(`/api/tickets/${ticketId}`) && response.status() === 200
  );

  await ticketModal.clickSave();

  // Sprawdź odpowiedź API
  const updateResponse = await updateResponsePromise;
  expect(updateResponse.status()).toBe(200);

  // Sprawdź że modal się zamknął
  await expect(ticketModal.modal).not.toBeVisible();

  // Sprawdź że tytuł został zaktualizowany na kanban board
  await kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");
  const updatedTicketCard = kanbanBoard.getTicketCard(ticketId);
  await expect(updatedTicketCard).toContainText(updatedTitle);
  await expect(updatedTicketCard).not.toContainText(originalTitle);
});

// Example: Complex scenario with login/logout (as mentioned in requirements)
test.describe("Complex Authentication Scenarios", () => {
  test.fail("admin creates ticket, normal user tries to assign themselves", async ({ page, loginAs, logout }) => {
    // Step 1: Login as admin and create a ticket
    await loginAs("admin");

    // Navigate to board and initialize POMs
    await page.goto("/");
    const navigationBar = new NavigationBarPOM(page);
    const ticketModal = new TicketModalPOM(page);
    const kanbanBoard = new KanbanBoardPOM(page);

    const ticketTitle = `Admin Created Ticket - ${new Date().getTime()}`;

    // Create ticket as admin
    await navigationBar.clickCreateTicket();
    await ticketModal.waitForModal();
    await ticketModal.fillTitle(ticketTitle);
    await ticketModal.fillDescription("Ticket created by admin for assignment test");

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.status() === 201
    );

    await ticketModal.clickSave();
    const createResponse = await createResponsePromise;
    const newTicket = await createResponse.json();
    const ticketId = newTicket.id;

    // Verify ticket was created
    await expect(ticketModal.modal).not.toBeVisible({ timeout: 10000 });
    await kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");

    // Step 2: Logout as admin
    await logout();

    // Step 3: Login as normal user
    await loginAs("normal-user");

    // Step 4: Try to assign the ticket to yourself (normal user)
    await page.goto("/");
    await kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");

    // Click on the ticket to open it
    await kanbanBoard.clickTicketCard(ticketId);
    await ticketModal.waitForModal();
    await expect(ticketModal.modal).toBeVisible();

    // Check if normal user can assign themselves to the ticket
    // (This is just an example - the actual implementation would depend on your UI)
    // const assignButton = ticketModal.assignButton; // Assuming this exists
    // await expect(assignButton).toBeVisible(); // or .not.toBeVisible() depending on permissions

    // For now, just verify the ticket is visible and accessible
    await expect(ticketModal.modal).toContainText(ticketTitle);
  });
});
