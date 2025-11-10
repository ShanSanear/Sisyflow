import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
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
  readonly aiAnalysisButton: Locator;
  readonly aiRatingStar1: Locator;
  readonly aiRatingStar2: Locator;
  readonly aiRatingStar3: Locator;
  readonly aiRatingStar4: Locator;
  readonly aiRatingStar5: Locator;

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
    this.aiAnalysisButton = page.getByTestId("ai-analysis-button");
    this.aiRatingStar1 = page.getByTestId("ai-rating-star-1");
    this.aiRatingStar2 = page.getByTestId("ai-rating-star-2");
    this.aiRatingStar3 = page.getByTestId("ai-rating-star-3");
    this.aiRatingStar4 = page.getByTestId("ai-rating-star-4");
    this.aiRatingStar5 = page.getByTestId("ai-rating-star-5");
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

  async clickAIAnalysis(): Promise<void> {
    await this.aiAnalysisButton.click();
  }

  async rateAI(rating: 1 | 2 | 3 | 4 | 5): Promise<void> {
    const starMap = {
      1: this.aiRatingStar1,
      2: this.aiRatingStar2,
      3: this.aiRatingStar3,
      4: this.aiRatingStar4,
      5: this.aiRatingStar5,
    };
    await starMap[rating].click();
  }

  getAISuggestionInsertButton(index: number): Locator {
    return this.page.getByTestId(`ai-suggestion-insert-button-${index}`);
  }

  async clickAISuggestionInsertButton(index: number): Promise<void> {
    const button = this.getAISuggestionInsertButton(index);
    await button.click();
  }

  getAISuggestionQuestionCheckbox(index: number): Locator {
    return this.page.getByTestId(`ai-suggestion-question-checkbox-${index}`);
  }

  async clickAISuggestionQuestionCheckbox(index: number): Promise<void> {
    const checkbox = this.getAISuggestionQuestionCheckbox(index);
    await checkbox.click();
  }

  async waitForAIAnalysisButtonToBeEnabled(): Promise<void> {
    await this.aiAnalysisButton.waitFor({ state: "visible" });
    // Wait for the button to not be disabled (loading completed)
    await expect(this.aiAnalysisButton).not.toBeDisabled({ timeout: 10000 });
  }

  async expectAIAnalysisButtonToShowLoadingState(): Promise<void> {
    expect(this.aiAnalysisButton).toContainText("Ask for AI suggestions");
    // Check for loading spinner
    const spinner = this.page.getByTestId("ai-analysis-button-loading");
    expect(spinner).toBeVisible();
  }

  async expectAIAnalysisButtonToShowNormalState(): Promise<void> {
    expect(this.aiAnalysisButton).toContainText("Ask for AI suggestions");
    // Check that loading spinner is not visible
    const spinner = this.page.getByTestId("ai-analysis-button-loading");
    expect(spinner).not.toBeVisible();
  }

  async expectErrorToastToBeVisible(message?: string): Promise<void> {
    // Check for error toast - using sonner toast library
    const toast = this.page.locator('[data-sonner-toast][data-type="error"]');
    expect(toast).toBeVisible();
    if (message) {
      expect(toast).toContainText(message);
    }
  }

  async expectNoAISuggestionsVisible(): Promise<void> {
    // Check that AI suggestions list is not visible
    const suggestionsList = this.page.locator('[data-testid="ai-suggestions-list"]');
    expect(suggestionsList).not.toBeVisible();
  }
}
