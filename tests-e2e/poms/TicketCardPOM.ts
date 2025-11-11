import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class TicketCardPOM {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Note: getTicketCard, clickTicketCard, getTicketDropdownTrigger, and clickEditTicket
  // are already available in KanbanBoardPOM - use that instead

  async clickDeleteTicket(ticketId: string): Promise<void> {
    // Open dropdown first (using KanbanBoardPOM method would be better)
    const dropdownTrigger = this.page
      .getByTestId(`ticket-card-${ticketId}`)
      .getByTestId("ticket-card-dropdown-trigger");
    await dropdownTrigger.click();

    // Click delete option
    const deleteButton = this.page
      .locator('[data-testid="ticket-card-dropdown-trigger"] + div')
      .getByText("Delete ticket");
    await deleteButton.click();
  }

  async expectDeleteButtonNotVisible(ticketId: string): Promise<void> {
    // For non-admin users, the delete button should not be present
    const dropdownTrigger = this.page
      .getByTestId(`ticket-card-${ticketId}`)
      .getByTestId("ticket-card-dropdown-trigger");
    await dropdownTrigger.click();

    const deleteButton = this.page
      .locator('[data-testid="ticket-card-dropdown-trigger"] + div')
      .getByText("Delete ticket");
    await expect(deleteButton).not.toBeVisible();
  }
}
