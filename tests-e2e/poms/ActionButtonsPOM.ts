import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class ActionButtonsPOM {
  readonly page: Page;
  readonly actionButtonsContainer: Locator;
  readonly closeCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.actionButtonsContainer = page.getByTestId("ticket-modal-action-buttons");
    this.closeCancelButton = page.getByTestId("ticket-modal-action-buttons-close-cancel");
    // Note: editButton and saveButton are already in TicketModalPOM
  }

  async clickCloseCancel(): Promise<void> {
    await this.closeCancelButton.click();
  }

  async expectCloseCancelButtonText(text: string): Promise<void> {
    await expect(this.closeCancelButton).toHaveText(text);
  }

  async expectActionButtonsContainerVisible(): Promise<void> {
    await expect(this.actionButtonsContainer).toBeVisible();
  }

  // Note: clickEdit, clickSave, expectSaveButtonEnabled, expectSaveButtonDisabled,
  // expectSaveButtonText, expectEditButtonVisible, expectEditButtonNotVisible
  // are already available in TicketModalPOM - use that instead
}
