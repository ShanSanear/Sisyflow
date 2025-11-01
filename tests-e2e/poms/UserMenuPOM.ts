import { type Page, type Locator } from "@playwright/test";

export class UserMenuPOM {
  readonly page: Page;
  readonly userMenuTrigger: Locator;
  readonly userMenuContent: Locator;
  readonly logoutButton: Locator;
  readonly profileButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenuTrigger = page.locator('[data-test-id="user-menu-trigger"]');
    this.userMenuContent = page.locator('[data-test-id="user-menu-content"]');
    this.logoutButton = page.locator('[data-test-id="logout-button"]');
    this.profileButton = page.locator('[data-test-id="profile-button"]');
  }

  async openUserMenu(): Promise<void> {
    // Otwiera menu użytkownika klikając na avatar
    await this.userMenuTrigger.click();
    await this.userMenuContent.waitFor({ state: "visible" });
  }

  async clickLogout(): Promise<void> {
    // Klikuje przycisk wylogowania
    await this.logoutButton.click();
  }

  async logout(): Promise<void> {
    // Pełny flow wylogowania: otwórz menu i kliknij logout
    await this.openUserMenu();
    await this.clickLogout();
  }

  async isLogoutButtonVisible(): Promise<boolean> {
    return await this.logoutButton.isVisible();
  }

  async getLogoutButtonText(): Promise<string> {
    return (await this.logoutButton.textContent()) || "";
  }
}
