import type { Page, Locator } from "@playwright/test";

export class DocumentationManagementPOM {
  readonly page: Page;
  readonly documentationManagement: Locator;
  readonly documentationHeader: Locator;
  readonly documentationLastUpdated: Locator;
  readonly documentationLoading: Locator;
  readonly documentationError: Locator;
  readonly documentationErrorRetry: Locator;
  readonly documentationTextarea: Locator;
  readonly documentationCharCounter: Locator;
  readonly documentationSaveHint: Locator;
  readonly documentationSaveBar: Locator;
  // readonly toastContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.documentationManagement = page.getByTestId("documentation-management");
    this.documentationHeader = page.getByTestId("documentation-header");
    this.documentationLastUpdated = page.getByTestId("documentation-last-updated");
    this.documentationLoading = page.getByTestId("documentation-loading");
    this.documentationError = page.getByTestId("documentation-error");
    this.documentationErrorRetry = page.getByTestId("documentation-error-retry");
    this.documentationTextarea = page.getByTestId("documentation-editor-textarea");
    this.documentationCharCounter = page.getByTestId("documentation-char-counter");
    this.documentationSaveHint = page.getByTestId("documentation-save-hint");
    this.documentationSaveBar = page.getByTestId("documentation-save-bar");
    // select based on class name: 'toaster group'
    // TODO this one is just tricky to handle, so we'll skip it for now
    // Trying to <div data-testid="toast-container"> as a wrapper also doesn't work properly
    // this.toastContainer = page.getByTestId("toast-container").first().locator(".toaster");
  }

  /**
   * Check if documentation management view is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.documentationManagement.isVisible();
  }

  /**
   * Check if documentation header is visible
   */
  async isHeaderVisible(): Promise<boolean> {
    return await this.documentationHeader.isVisible();
  }

  /**
   * Check if loading state is visible
   */
  async isLoadingVisible(): Promise<boolean> {
    return await this.documentationLoading.isVisible();
  }

  /**
   * Check if error state is visible
   */
  async isErrorVisible(): Promise<boolean> {
    return await this.documentationError.isVisible();
  }

  /**
   * Click retry button when error occurs
   */
  async clickRetryButton(): Promise<void> {
    await this.documentationErrorRetry.click();
  }

  /**
   * Wait for documentation to load
   */
  async waitForDocumentationToLoad(): Promise<void> {
    await this.documentationTextarea.waitFor({ state: "visible" });
  }

  /**
   * Get current documentation content
   */
  async getDocumentationContent(): Promise<string> {
    return (await this.documentationTextarea.textContent()) || "";
  }

  /**
   * Set documentation content
   */
  async setDocumentationContent(content: string): Promise<void> {
    await this.documentationTextarea.fill(content);
  }

  /**
   * Clear documentation content
   */
  async clearDocumentationContent(): Promise<void> {
    await this.documentationTextarea.clear();
  }

  /**
   * Type documentation content (simulate user typing)
   */
  async typeDocumentationContent(content: string): Promise<void> {
    await this.documentationTextarea.fill(content);
  }

  /**
   * Get character counter text
   */
  async getCharCounterText(): Promise<string> {
    return (await this.documentationCharCounter.textContent()) || "";
  }

  /**
   * Check if save hint is visible
   */
  async isSaveHintVisible(): Promise<boolean> {
    return await this.documentationSaveHint.isVisible();
  }

  /**
   * Get save button by status
   */
  getSaveButton(status: "idle" | "saving" | "success" | "error"): Locator {
    return this.page.getByTestId(`documentation-save-button-${status}`);
  }

  /**
   * Click save button (idle state)
   */
  async clickSaveButton(): Promise<void> {
    const saveButton = this.getSaveButton("idle");
    await saveButton.click();
  }

  /**
   * Wait for save button to be in saving state
   */
  async waitForSavingState(): Promise<void> {
    const savingButton = this.getSaveButton("saving");
    await savingButton.waitFor({ state: "visible" });
  }

  /**
   * Wait for save button to be in success state
   */
  async waitForSuccessState(): Promise<void> {
    const successButton = this.getSaveButton("success");
    await successButton.waitFor({ state: "visible" });
  }

  /**
   * Wait for save button to be in error state
   */
  async waitForErrorState(): Promise<void> {
    const errorButton = this.getSaveButton("error");
    await errorButton.waitFor({ state: "visible" });
  }

  /**
   * Check if toast container is visible
   */
  // async isToastContainerVisible(): Promise<boolean> {
  //   return await this.toastContainer.isVisible();
  // }

  /**
   * Wait for success toast to appear
   */
  // async waitForSuccessToast(): Promise<void> {
  //   await this.toastContainer.waitFor({ state: "visible" });
  //   // Wait for toast to contain success message
  //   await this.page.waitForTimeout(1000); // Allow time for toast content to load
  // }

  /**
   * Get toast content text
   */
  // async getToastText(): Promise<string> {
  //   return (await this.toastContainer.textContent()) || "";
  // }

  /**
   * Check if success toast is visible with expected text
   */
  // async isSuccessToastVisible(expectedText = "Project documentation updated successfully"): Promise<boolean> {
  //   if (!(await this.toastContainer.isVisible())) {
  //     return false;
  //   }
  //   const toastText = await this.getToastText();
  //   return toastText.includes(expectedText);
  // }
}
