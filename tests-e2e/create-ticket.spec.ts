import { test, expect } from "@playwright/test";
import { NavigationBarPOM } from "./poms/NavigationBarPOM";
import { TicketModalPOM } from "./poms/TicketModalPOM";

test.describe("Ticket Creation Flow", () => {
  let navigationBar: NavigationBarPOM;
  let ticketModal: TicketModalPOM;

  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto("/");
    navigationBar = new NavigationBarPOM(page);
    ticketModal = new TicketModalPOM(page);
  });

  test("should allow a user to create a new ticket", async () => {
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

    // 4. Save the ticket.
    await ticketModal.clickSave();

    // Verify the modal is closed after saving
    await expect(ticketModal.modal).not.toBeVisible();

    // Optional: Verify a success toast message is shown
    // This requires the toast to have a data-testid or a specific role/text
    // For example:
    // const successToast = page.locator('[data-testid="toast-success"]');
    // await expect(successToast).toContainText("Ticket created");
  });
});
