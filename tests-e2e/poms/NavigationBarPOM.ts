import type { Page, Locator } from "@playwright/test";

export class NavigationBarPOM {
  readonly page: Page;
  readonly createTicketButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createTicketButton = page.getByTestId("navigation-bar-create-ticket");
  }

  async clickCreateTicket(): Promise<void> {
    await this.createTicketButton.click();
  }
}
