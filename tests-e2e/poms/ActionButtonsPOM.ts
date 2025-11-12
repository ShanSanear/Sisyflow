import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class ActionButtonsPOM {
  readonly page: Page;
  readonly actionButtonsContainer: Locator;
  readonly closeCancelButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.actionButtonsContainer = page.getByTestId("ticket-modal-action-buttons");
    this.closeCancelButton = page.getByTestId("ticket-modal-action-buttons-close-cancel");
    this.saveButton = page.getByTestId("ticket-modal-action-buttons-save");
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

  async expectSaveButtonEnabled(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
  }

  async expectSaveButtonDisabled(): Promise<void> {
    await expect(this.saveButton).toBeDisabled();
  }
}
