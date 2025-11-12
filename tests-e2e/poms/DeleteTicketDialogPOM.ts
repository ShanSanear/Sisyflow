import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class DeleteTicketDialogPOM {
  readonly page: Page;
  readonly dialog: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("delete-ticket-dialog");
    this.cancelButton = page.getByTestId("delete-ticket-cancel");
    this.confirmButton = page.getByTestId("delete-ticket-confirm");
  }

  async waitForDialog(): Promise<void> {
    await this.dialog.waitFor({ state: "visible" });
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickConfirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async expectDialogVisible(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectDialogNotVisible(): Promise<void> {
    await expect(this.dialog).not.toBeVisible();
  }

  async expectConfirmButtonDisabled(): Promise<void> {
    await expect(this.confirmButton).toBeDisabled();
  }

  async expectConfirmButtonEnabled(): Promise<void> {
    await expect(this.confirmButton).toBeEnabled();
  }

  async expectCancelButtonDisabled(): Promise<void> {
    await expect(this.cancelButton).toBeDisabled();
  }

  async expectCancelButtonEnabled(): Promise<void> {
    await expect(this.cancelButton).toBeEnabled();
  }
}
