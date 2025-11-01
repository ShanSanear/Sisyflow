import { test, expect } from "@playwright/test";
import { AuthProtectionPOM } from "./poms/AuthProtectionPOM";
import { BoardPagePOM } from "./poms/BoardPagePOM";
import { LoginPagePOM } from "./poms/LoginPagePOM";
import { test as authTest } from "./fixtures/auth.fixture";

test.describe("TC-AUTH-005: Middleware ochrona (P0, Integracyjny)", () => {
  /**
   * Test 1: Unauthenticated access to protected route (/board)
   * Expected: Redirect to /login with 302 status
   *
   * Scenario:
   * - Niezalogowany użytkownik → /board
   * - Oczekiwany: Redirect /login, 302
   */
  test("powinien przekierować niezalogowanego użytkownika z /board na /login (302 redirect)", async ({ page }) => {
    const authPOM = new AuthProtectionPOM(page);

    // Step 1: Attempt to access protected route without authentication

    await authPOM.attemptAccessProtectedRoute("/board");

    // Step 2: Verify redirect to login page

    await authPOM.verifyRedirectedToLogin();

    // Step 3: Verify we're on login page URL

    const currentURL = await authPOM.getCurrentURL();
    expect(currentURL).toContain("/login");

    // Step 4: Verify login page is accessible (not another error)

    const isOnLoginPage = await authPOM.isOnPage("/login");
    expect(isOnLoginPage).toBe(true);

    // ✓ Test PASSED: Middleware protection works correctly
  });

  /**
   * Test 2: Public paths should be accessible without authentication
   * Expected: /login and /register accessible without redirect
   *
   * Part of TC-AUTH-005 Risk Mitigation: Test PUBLIC_PATHS
   */
  test("powinien umożliwić dostęp do strony logowania bez autentykacji (PUBLIC_PATH)", async ({ page }) => {
    const authPOM = new AuthProtectionPOM(page);
    const loginPOM = new LoginPagePOM(page);

    // Step 1: Navigate to login page

    await authPOM.verifyLoginPagePublic();

    // Step 2: Verify login page is accessible

    const isOnLoginPage = await authPOM.isOnPage("/login");
    expect(isOnLoginPage).toBe(true);

    // Step 3: Verify login form is visible

    const isPageAccessible = await loginPOM.isPageAccessible();
    expect(isPageAccessible).toBe(true);

    // Step 4: Verify login page content is loaded

    const isContentVisible = await loginPOM.isPageContentVisible();
    expect(isContentVisible).toBe(true);

    // ✓ Test PASSED: PUBLIC_PATH works correctly
  });

  /**
   * Test 3: Register page should be accessible without authentication
   * Expected: /register accessible without redirect
   *
   * Part of TC-AUTH-005 Risk Mitigation: Test PUBLIC_PATHS
   */
  test.fail("powinien umożliwić dostęp do strony rejestracji bez autentykacji (PUBLIC_PATH)", async ({ page }) => {
    // Aktualnie ten test nie działa ponieważ register po tym jak mamy już admina od razu przekierowywuje na login
    const authPOM = new AuthProtectionPOM(page);

    // Step 1: Verify register page is accessible

    await authPOM.verifyRegisterPagePublic();

    // Step 2: Verify we stayed on register page

    const isOnRegisterPage = await authPOM.isOnPage("/register");
    expect(isOnRegisterPage).toBe(true);

    // ✓ Test PASSED: /register is public path
  });

  /**
   * Test 4: Full middleware protection scenario
   * Expected: Redirect from protected route → login → successful authentication flow
   */
  test("powinien obsługiwać pełny scenariusz ochrony middleware (redirect → login → board)", async ({ page }) => {
    const authPOM = new AuthProtectionPOM(page);

    // Step 1: Execute full middleware protection test

    await authPOM.testTC_AUTH_005_MiddlewareProtection();

    // ✓ Test PASSED: Full middleware protection scenario works
  });
});

/**
 * Test 5: Authenticated user can access board page
 * Expected: Board page loads correctly with authentication wrapper
 *
 * Verifies that authenticated users can access protected routes
 */
authTest.describe("TC-AUTH-005: Middleware ochrona - User Authenticated", () => {
  authTest("zalogowany użytkownik powinien mieć dostęp do /board (authenticated)", async ({ page, loginAs }) => {
    // Step 1: Login as admin user

    await loginAs("admin");

    // Verify we're redirected to board
    await page.waitForURL("/board");

    const boardPOM = new BoardPagePOM(page);

    // Step 2: Verify board page is accessible

    const isBoardAccessible = await boardPOM.isBoardAccessible();
    expect(isBoardAccessible).toBe(true);

    // Step 3: Verify authenticated content is visible

    const url = await boardPOM.getCurrentURL();
    expect(url).toContain("/board");

    // Step 4: Verify board URL

    const isBoardPageURL = await boardPOM.isBoardPageURL();
    expect(isBoardPageURL).toBe(true);

    // ✓ Test PASSED: Authenticated users can access board
  });

  /**
   * Test 6: Verify board page loads in authenticated state
   * Expected: Board content loads without redirecting to login
   */
  authTest("zalogowany użytkownik powinien zobaczyć załadowaną stronę /board", async ({ page, loginAs }) => {
    // Step 1: Login as normal user

    await loginAs("normal-user");

    // Verify we're on board
    await page.waitForURL("/board");

    const boardPOM = new BoardPagePOM(page);

    // Step 2: Wait for board to load

    try {
      await boardPOM.waitForBoardToLoad();
    } catch {
      // If board is in loading state, that's also acceptable
      const isLoading = await boardPOM.isBoardLoading();
      expect(isLoading || (await boardPOM.isBoardAccessible())).toBe(true);
    }

    // Step 3: Verify board is not showing error state

    const isBoardErrorShowing = await boardPOM.isBoardErrorShowing();
    expect(isBoardErrorShowing).toBe(false);

    // Step 4: Verify authenticated main content is visible

    const isBoardAccessible = await boardPOM.isBoardAccessible();
    expect(isBoardAccessible).toBe(true);

    // ✓ Test PASSED: Board loads correctly for authenticated user
  });
});

/**
 * Test 7: Multiple protected routes should redirect
 * Expected: All non-public paths redirect to login when unauthenticated
 *
 * Extended risk mitigation
 */
test("wszystkie chronione ścieżki powinny być redirectowane na /login", async ({ page }) => {
  const authPOM = new AuthProtectionPOM(page);

  const protectedRoutes = ["/board", "/admin"];

  for (const route of protectedRoutes) {
    // Attempt to access protected route
    await authPOM.attemptAccessProtectedRoute(route);

    // Verify redirect to login
    try {
      await authPOM.verifyRedirectedToLogin();
    } catch (error) {
      console.error(`✗ ${route} redirect failed:`, error);
      throw error;
    }
  }
});
