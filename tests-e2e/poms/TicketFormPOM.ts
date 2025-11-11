import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class TicketFormPOM {
  readonly page: Page;
  readonly form: Locator;
  readonly typeSelect: Locator;
  readonly typeSelectTrigger: Locator;
  readonly typeSelectContent: Locator;
  readonly reporterDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId("ticket-modal-form");
    // Note: titleInput and descriptionTextarea are already in TicketModalPOM
    this.typeSelect = page.getByTestId("ticket-modal-form-type-select");
    this.typeSelectTrigger = this.typeSelect.locator('[role="combobox"]');
    this.typeSelectContent = page.getByTestId("ticket-modal-form-type-select-content");
    this.reporterDisplay = page.getByTestId("ticket-modal-reporter-display");
  }

  async selectType(type: "BUG" | "IMPROVEMENT" | "TASK"): Promise<void> {
    await this.typeSelectTrigger.click();
    await this.typeSelectContent.waitFor({ state: "visible" });
    const typeOption = this.page.getByTestId(`ticket-modal-form-type-select-item-${type.toLowerCase()}`);
    await typeOption.click();
  }

  async getSelectedType(): Promise<string | null> {
    return await this.typeSelectTrigger.textContent();
  }

  async getReporterName(): Promise<string | null> {
    const reporterBadge = this.reporterDisplay.locator("span");
    return await reporterBadge.textContent();
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.form).toBeVisible();
  }

  async expectTitleErrorVisible(): Promise<void> {
    const titleError = this.page.getByTestId("ticket-modal-form-title-input").locator("p.text-destructive");
    await expect(titleError).toBeVisible();
  }

  async expectTitleErrorNotVisible(): Promise<void> {
    const titleError = this.page.getByTestId("ticket-modal-form-title-input").locator("p.text-destructive");
    await expect(titleError).not.toBeVisible();
  }

  async expectTypeErrorVisible(): Promise<void> {
    const typeError = this.typeSelect.locator("xpath=following-sibling::p[@class='text-sm text-destructive']");
    await expect(typeError).toBeVisible();
  }

  async expectTypeErrorNotVisible(): Promise<void> {
    const typeError = this.typeSelect.locator("xpath=following-sibling::p[@class='text-sm text-destructive']");
    await expect(typeError).not.toBeVisible();
  }

  async expectDescriptionErrorVisible(): Promise<void> {
    const descriptionError = this.page.getByTestId("ticket-modal-description-editor-error");
    await expect(descriptionError).toBeVisible();
  }

  async expectDescriptionErrorNotVisible(): Promise<void> {
    const descriptionError = this.page.getByTestId("ticket-modal-description-editor-error");
    await expect(descriptionError).not.toBeVisible();
  }

  // Note: fillTitle, fillDescription, getTitleValue, getDescriptionValue
  // are already available in TicketModalPOM - use that instead
}
