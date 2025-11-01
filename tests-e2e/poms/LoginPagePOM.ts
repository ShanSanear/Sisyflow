import { type Page, type Locator } from "@playwright/test";

export class LoginPagePOM {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-test-id="email-input"]');
    this.passwordInput = page.locator('[data-test-id="password-input"]');
    this.loginButton = page.locator('[data-test-id="login-button"]');
    this.errorAlert = page.locator('[data-test-id="login-error-alert"]');
    this.errorMessage = page.locator('[data-test-id="login-error-message"]');
    this.loadingSpinner = page.locator('[data-test-id="loading-spinner"]');
  }

  async navigate() {
    await this.page.goto("/login");
    await this.page.waitForURL("/login");
  }

  async login(email: string, password?: string) {
    await this.loginButton.isVisible();
    await this.loginButton.isEnabled();
    await this.page.waitForTimeout(1000);
    await this.emailInput.fill(email);
    if (password) {
      await this.passwordInput.fill(password);
    }
    await this.loginButton.click();
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  async isErrorAlertVisible(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  async isLoadingSpinnerVisible(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  async waitForErrorAlert(): Promise<void> {
    // Oczekuje na pojawienie się alertu z błędem
    await this.errorAlert.waitFor({ state: "visible" });
  }
}
