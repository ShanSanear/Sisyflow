import type { Page, Locator } from "@playwright/test";

export class TicketModalPOM {
  readonly page: Page;
  readonly modal: Locator;
  readonly titleInput: Locator;
  readonly descriptionEditor: Locator;
  readonly saveButton: Locator;
  readonly editButton: Locator;
  readonly assigneeSelect: Locator;
  readonly assigneeSelectTrigger: Locator;
  readonly assigneeSelectContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId("ticket-modal");
    this.titleInput = page.getByTestId("ticket-modal-form-title-input-input");
    this.descriptionEditor = page.getByTestId("ticket-modal-description-editor-textarea");
    this.saveButton = page.getByTestId("ticket-modal-action-buttons-save");
    this.editButton = page.getByTestId("ticket-modal-action-buttons-edit");
    this.assigneeSelect = page.getByTestId("assignee-section-admin-select");
    this.assigneeSelectTrigger = page.getByTestId("assignee-section-admin-select-trigger");
    this.assigneeSelectContent = page.getByTestId("assignee-section-admin-select-content");
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

  async selectAssignee(username: string): Promise<void> {
    await this.assigneeSelectTrigger.click();
    await this.assigneeSelectContent.waitFor({ state: "visible" });
    const userOption = this.page.getByTestId("assignee-section-admin-select-item").filter({ hasText: username });
    await userOption.click();
  }

  async selectUnassigned(): Promise<void> {
    await this.assigneeSelectTrigger.click();
    await this.assigneeSelectContent.waitFor({ state: "visible" });
    const unassignedOption = this.assigneeSelectContent.getByText("Unassigned");
    await unassignedOption.click();
  }

  async getSelectedAssignee(): Promise<string | null> {
    return await this.assigneeSelectTrigger.textContent();
  }
}
