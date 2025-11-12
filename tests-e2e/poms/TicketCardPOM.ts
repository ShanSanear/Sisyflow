import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class TicketCardPOM {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async clickDropdownTrigger(ticketId: string): Promise<void> {
    const dropdownTrigger = this.page
      .getByTestId(`ticket-card-${ticketId}`)
      .getByTestId("ticket-card-dropdown-trigger");
    await dropdownTrigger.click();
  }

  // Note: getTicketCard, clickTicketCard, getTicketDropdownTrigger, and clickEditTicket
  // are already available in KanbanBoardPOM - use that instead

  async clickDeleteTicket(ticketId: string): Promise<void> {
    // Open dropdown first (using KanbanBoardPOM method would be better)
    await this.clickDropdownTrigger(ticketId);

    // Wait for dropdown menu to be visible, then click delete option
    // The dropdown content is rendered in a Portal, so we find it directly on the page
    // Only one dropdown is visible at a time, so this is safe
    const deleteButton = this.page.getByTestId("ticket-card-delete-button");
    await deleteButton.waitFor({ state: "visible" });
    await deleteButton.click();
  }

  async closeDropdown(): Promise<void> {
    // Close dropdown by pressing Escape (most reliable for Radix UI dropdowns)
    await this.page.keyboard.press("Escape");
  }

  async expectDeleteButtonNotVisible(ticketId: string): Promise<void> {
    // For non-admin users, the delete button should not be present
    await this.clickDropdownTrigger(ticketId);

    // Use the same locator as clickDeleteTicket for consistency
    const deleteButton = this.page.getByTestId("ticket-card-delete-button");
    await expect(deleteButton).not.toBeVisible();
    // Close dropdown by pressing Escape (most reliable for Radix UI dropdowns)
    await this.closeDropdown();
  }
}
