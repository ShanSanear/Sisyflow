import { type Page, type Locator } from "@playwright/test";

export class LoginPagePOM {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-test-id="email-input"]');
    this.passwordInput = page.locator('[data-test-id="password-input"]');
    this.loginButton = page.locator('[data-test-id="login-button"]');
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
}
