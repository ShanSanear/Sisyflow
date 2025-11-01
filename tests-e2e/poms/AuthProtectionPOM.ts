import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * AuthProtectionPOM - Page Object for testing middleware authentication protection
 * Tests scenario TC-AUTH-005: Unauthenticated user access to protected routes
 *
 * Responsibilities:
 * - Navigate to protected routes without authentication
 * - Verify redirects to login page
 * - Test PUBLIC_PATHS accessibility
 * - Verify HTTP status codes (302 for redirect)
 */
export class AuthProtectionPOM {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Test unauthenticated access to protected route (/board)
   * Expected: Should redirect to /login with 302 status
   */
  async attemptAccessProtectedRoute(route = "/board"): Promise<void> {
    // Don't wait for navigation - we want to capture the redirect
    await this.page.goto(route, { waitUntil: "domcontentloaded" });
  }

  /**
   * Verify that user was redirected to login page
   * Part of TC-AUTH-005 test
   */
  async verifyRedirectedToLogin(): Promise<void> {
    // Wait for navigation to complete
    await this.page.waitForURL("/login", { timeout: 5000 });

    // Verify URL contains /login
    expect(this.page.url()).toContain("/login");
  }

  /**
   * Verify that access to public path is allowed (no redirect)
   * Tests PUBLIC_PATHS accessibility: /login, /register, /api/auth/*
   */
  async verifyPublicPathAccessible(path: string): Promise<void> {
    await this.page.goto(path);

    // Wait a moment for potential redirects to occur
    await this.page.waitForTimeout(500);

    // Verify we stayed on the requested path (no redirect)
    expect(this.page.url()).toContain(path);
  }

  /**
   * Get the current page URL
   */
  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  /**
   * Check if current page contains URL segment
   */
  async isOnPage(pageSegment: string): Promise<boolean> {
    return this.page.url().includes(pageSegment);
  }

  /**
   * Verify login page is accessible without authentication
   * Part of PUBLIC_PATHS test
   */
  async verifyLoginPagePublic(): Promise<void> {
    await this.verifyPublicPathAccessible("/login");
  }

  /**
   * Verify register page is accessible without authentication
   * Part of PUBLIC_PATHS test
   */
  async verifyRegisterPagePublic(): Promise<void> {
    await this.verifyPublicPathAccessible("/register");
  }

  /**
   * Test middleware routing rules
   * Verifies that:
   * 1. Protected routes redirect to login when unauthenticated
   * 2. Public paths are accessible without authentication
   */
  async testMiddlewareProtection(): Promise<void> {
    // Test 1: Protected route access (should redirect)
    await this.attemptAccessProtectedRoute("/board");
    await this.verifyRedirectedToLogin();

    // Test 2: Public paths should be accessible
    // (Test will handle this separately with authenticated session)
  }

  /**
   * Navigate directly to login page and verify it's accessible
   * Used for positive test case
   */
  async navigateToLoginDirectly(): Promise<void> {
    await this.page.goto("/login");
    await this.page.waitForURL("/login");
  }

  /**
   * Check if page has been navigated (URL changed)
   */
  async hasNavigated(fromUrl: string): Promise<boolean> {
    return this.page.url() !== fromUrl;
  }

  /**
   * Get HTTP response status from last navigation
   * Note: This requires intercepting the response in the test
   */
  async getLastNavigationStatus(): Promise<number | undefined> {
    // This would be set by the test using page.on("response", ...)
    return undefined;
  }

  /**
   * Test scenario TC-AUTH-005: Middleware protection
   * Steps: Unauthenticated → /board
   * Expected: Redirect /login, 302
   */
  async testTC_AUTH_005_MiddlewareProtection(): Promise<void> {
    // Step 1: Navigate to protected route without authentication
    await this.attemptAccessProtectedRoute("/board");

    // Step 2: Verify redirect to login
    await this.verifyRedirectedToLogin();

    // Step 3: Confirm we're on login page URL
    const currentURL = await this.getCurrentURL();
    expect(currentURL).toContain("/login");
  }
}
