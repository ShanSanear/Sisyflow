import type { Page, Locator } from "@playwright/test";

export class TicketModalPOM {
  readonly page: Page;
  readonly modal: Locator;
  readonly titleInput: Locator;
  readonly descriptionEditor: Locator;
  readonly saveButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId("ticket-modal");
    this.titleInput = page.getByTestId("ticket-modal-form-title-input-input");
    this.descriptionEditor = page.getByTestId("ticket-modal-description-editor-textarea");
    this.saveButton = page.getByTestId("ticket-modal-action-buttons-save");
    this.editButton = page.getByTestId("ticket-modal-action-buttons-edit");
  }

  async waitForModal(): Promise<void> {
    await this.modal.waitFor({ state: "visible" });
  }

  async fillTitle(title: string): Promise<void> {
    await this.titleInput.fill(title);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionEditor.fill(description);
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  async clickEdit(): Promise<void> {
    await this.editButton.click();
  }
}
