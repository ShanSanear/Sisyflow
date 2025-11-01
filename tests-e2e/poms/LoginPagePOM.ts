import { type Page, type Locator } from "@playwright/test";

export class LoginPagePOM {
  readonly page: Page;
  readonly formContainer: Locator;
  readonly pageContainer: Locator;
  readonly loginTitle: Locator;
  readonly loginDescription: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageContainer = page.getByTestId("login-page");
    this.formContainer = page.getByTestId("login-form-container");
    this.loginTitle = page.getByTestId("login-title");
    this.loginDescription = page.getByTestId("login-description");
    this.emailInput = page.getByTestId("email-input");
    this.passwordInput = page.getByTestId("password-input");
    this.loginButton = page.getByTestId("login-button");
    this.errorAlert = page.getByTestId("login-error-alert");
    this.errorMessage = page.getByTestId("login-error-message");
    this.loadingSpinner = page.getByTestId("loading-spinner");
    this.emailError = page.getByTestId("email-error");
    this.passwordError = page.getByTestId("password-error");
  }

  /**
   * Navigate to the login page
   * Used in middleware protection tests (TC-AUTH-005)
   */
  async navigate() {
    await this.page.goto("/login");
    await this.page.waitForURL("/login");
  }

  /**
   * Verify login page is accessible and fully loaded
   * Part of PUBLIC_PATHS test
   */
  async isPageAccessible(): Promise<boolean> {
    try {
      await this.formContainer.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify login page content is visible
   */
  async isPageContentVisible(): Promise<boolean> {
    return (await this.loginTitle.isVisible()) && (await this.loginDescription.isVisible());
  }

  /**
   * Login with email and password
   */
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

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Check if error alert is visible
   */
  async isErrorAlertVisible(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoadingSpinnerVisible(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Wait for error alert to appear
   */
  async waitForErrorAlert(): Promise<void> {
    await this.errorAlert.waitFor({ state: "visible" });
  }

  /**
   * Get email validation error
   */
  async getEmailErrorText(): Promise<string> {
    return (await this.emailError.textContent()) || "";
  }

  /**
   * Get password validation error
   */
  async getPasswordErrorText(): Promise<string> {
    return (await this.passwordError.textContent()) || "";
  }

  /**
   * Check if email validation error is visible
   */
  async isEmailErrorVisible(): Promise<boolean> {
    return await this.emailError.isVisible();
  }

  /**
   * Check if password validation error is visible
   */
  async isPasswordErrorVisible(): Promise<boolean> {
    return await this.passwordError.isVisible();
  }
}
