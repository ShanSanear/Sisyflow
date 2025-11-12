import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { test } from "./fixtures/auth.fixture";
import { NavigationBarPOM } from "./poms/NavigationBarPOM";
import { TicketModalPOM } from "./poms/TicketModalPOM";
import { KanbanBoardPOM } from "./poms/KanbanBoardPOM";
import { TicketCardPOM } from "./poms/TicketCardPOM";
import { DeleteTicketDialogPOM } from "./poms/DeleteTicketDialogPOM";
import { TicketFormPOM } from "./poms/TicketFormPOM";
import { ActionButtonsPOM } from "./poms/ActionButtonsPOM";
import { AssigneeSectionPOM } from "./poms/AssigneeSectionPOM";

// Shared setup for POMs
function setupPOMs(page: Page) {
  return {
    navigationBar: new NavigationBarPOM(page),
    ticketModal: new TicketModalPOM(page),
    kanbanBoard: new KanbanBoardPOM(page),
    ticketCard: new TicketCardPOM(page),
    deleteDialog: new DeleteTicketDialogPOM(page),
    ticketForm: new TicketFormPOM(page),
    actionButtons: new ActionButtonsPOM(page),
    assigneeSection: new AssigneeSectionPOM(page),
  };
}

// =====================================================
// ADMIN TESTS: Ticket creation and admin deletion
// =====================================================

test.describe("TC-TICKET-008: Admin Ticket Lifecycle", () => {
  let createdTicketId: string;

  test("admin should create and delete tickets", async ({ page, loginAs, logout }) => {
    const poms = setupPOMs(page);

    // Login as admin
    await loginAs("admin");
    await page.goto("/");

    const ticketTitle = `Admin Test - ${new Date().getTime()}`;
    const ticketDescription = "Test ticket for admin deletion";

    // Create ticket
    await poms.navigationBar.clickCreateTicket();
    await poms.ticketModal.waitForModal();
    await poms.ticketModal.fillTitle(ticketTitle);
    await poms.ticketModal.fillDescription(ticketDescription);
    await poms.ticketForm.selectType("BUG");

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.status() === 201
    );

    await poms.ticketModal.clickSave();

    const createResponse = await createResponsePromise;
    const newTicket = await createResponse.json();
    createdTicketId = newTicket.id;

    await expect(poms.ticketModal.modal).not.toBeVisible({ timeout: 10000 });
    await poms.kanbanBoard.expectTicketToBeInColumn(createdTicketId, "OPEN");

    // Test admin deletion
    await poms.ticketCard.clickDeleteTicket(createdTicketId);
    await poms.deleteDialog.waitForDialog();

    // Wait for delete API response
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tickets/${createdTicketId}`) &&
        response.request().method() === "DELETE" &&
        response.status() === 204
    );

    await poms.deleteDialog.clickConfirm();
    await deleteResponsePromise;

    // Verify ticket is deleted (should not be visible)
    await expect(poms.kanbanBoard.getTicketCard(createdTicketId)).not.toBeVisible();

    await logout();
  });

  test("admin should cancel delete operation", async ({ page, loginAs, logout }) => {
    const poms = setupPOMs(page);

    await loginAs("admin");
    await page.goto("/");

    const ticketTitle = `Cancel Test - ${new Date().getTime()}`;

    // Create ticket
    await poms.navigationBar.clickCreateTicket();
    await poms.ticketModal.waitForModal();
    await poms.ticketModal.fillTitle(ticketTitle);
    await poms.ticketModal.fillDescription("Test for cancel delete");

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.status() === 201
    );

    await poms.ticketModal.clickSave();

    const createResponse = await createResponsePromise;
    const newTicket = await createResponse.json();
    createdTicketId = newTicket.id;

    await expect(poms.ticketModal.modal).not.toBeVisible({ timeout: 10000 });

    // Start delete but cancel
    await poms.ticketCard.clickDeleteTicket(createdTicketId);
    await poms.deleteDialog.waitForDialog();
    await poms.deleteDialog.clickCancel();

    // Wait for dialog to close, then close the dropdown menu
    await poms.deleteDialog.expectDialogNotVisible();
    await poms.ticketCard.closeDropdown();

    // Verify ticket still exists
    await poms.kanbanBoard.expectTicketToBeInColumn(createdTicketId, "OPEN");

    await logout();
  });
});

// =====================================================
// NORMAL USER TESTS: Restricted deletion permissions
// =====================================================

test.describe("TC-TICKET-008: Normal User Deletion Restrictions", () => {
  test("normal user should not see delete option", async ({ page, loginAs, logout }) => {
    const poms = setupPOMs(page);

    await loginAs("normal-user");
    await page.goto("/");

    const ticketTitle = `Normal User Test - ${new Date().getTime()}`;

    // Create ticket as normal user
    await poms.navigationBar.clickCreateTicket();
    await poms.ticketModal.waitForModal();
    await poms.ticketModal.fillTitle(ticketTitle);
    await poms.ticketModal.fillDescription("Test ticket for normal user");

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.status() === 201
    );

    await poms.ticketModal.clickSave();

    const createResponse = await createResponsePromise;
    const newTicket = await createResponse.json();
    const ticketId = newTicket.id;

    await expect(poms.ticketModal.modal).not.toBeVisible({ timeout: 10000 });
    await poms.kanbanBoard.expectTicketToBeInColumn(ticketId, "OPEN");

    // Verify normal user cannot see delete option
    await poms.ticketCard.expectDeleteButtonNotVisible(ticketId);

    await logout();
  });
});

// =====================================================
// FORM VALIDATION TESTS
// =====================================================

test.describe("TC-TICKET-008: Form Validation", () => {
  test("should validate required fields", async ({ page, loginAs, logout }) => {
    const poms = setupPOMs(page);

    await loginAs("admin");
    await page.goto("/");

    await poms.navigationBar.clickCreateTicket();
    await poms.ticketModal.waitForModal();

    // Test empty title validation
    await poms.ticketModal.fillDescription("Test description");
    await poms.actionButtons.expectSaveButtonDisabled();

    // Fill title to enable save
    await poms.ticketModal.fillTitle("Valid Title");
    await poms.actionButtons.expectSaveButtonEnabled();

    // Clear title to test error display
    await poms.ticketModal.fillTitle("");
    await poms.ticketForm.expectTitleErrorVisible();

    // Close the modal before logout
    await poms.actionButtons.clickCloseCancel();
    await expect(poms.ticketModal.modal).not.toBeVisible();

    await logout();
  });
});
