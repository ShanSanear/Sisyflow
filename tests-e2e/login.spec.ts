import { test, expect } from "@playwright/test";
import { LoginPagePOM } from "./poms/LoginPagePOM";
import { UserMenuPOM } from "./poms/UserMenuPOM";
import { test as authTest } from "./fixtures/auth.fixture";

test.describe("Autentykacja - TC-AUTH-003: Błędne logowanie", () => {
  test("powinien wyświetlić alert błędu przy logowaniu z nieprawidłowym hasłem", async ({ page }) => {
    // Logujemy się z nowym context, aby uniknąć sesji
    const loginPage = new LoginPagePOM(page);

    // 1. Przejście na stronę logowania
    await loginPage.navigate();
    await expect(page).toHaveURL("/login");

    // Czekamy 1 sekundę na załadowanie strony
    await page.waitForTimeout(1000);

    // 2. Wpisanie prawidłowego identyfikatora i NIEPRAWIDŁOWEGO hasła
    await loginPage.identifierInput.fill("test@example.com");
    await loginPage.passwordInput.fill("wrongpassword123");

    // 3. Wysłanie formularza
    await loginPage.loginButton.click();

    // 4. Weryfikacja: spinner ładowania pojawia się
    await expect(loginPage.loadingSpinner).toBeVisible();

    // 5. Oczekiwanie na pojawienie się alertu błędu
    await loginPage.waitForErrorAlert();

    // 6. Weryfikacja: alert błędu jest widoczny z komunikatem
    await expect(loginPage.errorAlert).toBeVisible();
    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain("Invalid login credentials");

    // 7. Weryfikacja: użytkownik ZOSTAJE na stronie /login (brak redirectu)
    await expect(page).toHaveURL("/login");

    // 8. Weryfikacja: przycisk jest ponownie włączony do ponownej próby
    await expect(loginPage.loginButton).toBeEnabled();
    await expect(loginPage.loadingSpinner).not.toBeVisible();
  });
});

authTest.describe("Autentykacja - TC-AUTH-004: Wylogowanie", () => {
  authTest("powinien wylogować użytkownika i przekierować na stronę logowania", async ({ page, loginAs }) => {
    // 1. Zalogowanie jako użytkownik (już wykonane przez fixture)
    await loginAs("admin");
    await page.goto("/");

    // Domyślną stroną po logowaniu jest /board
    await expect(page).toHaveURL("/board");

    const userMenu = new UserMenuPOM(page);

    // 2. Weryfikacja: przycisk menu użytkownika jest widoczny
    await expect(userMenu.userMenuTrigger).toBeVisible();

    // 3. Kliknięcie na avatar aby otworzyć menu
    await userMenu.openUserMenu();
    await expect(userMenu.userMenuContent).toBeVisible();

    // 4. Weryfikacja: przycisk "Sign out" jest widoczny
    await expect(userMenu.logoutButton).toBeVisible();

    // 5. Przechwyć API request do /api/auth/sign-out
    const signOutPromise = page.waitForResponse(
      (response) => response.url().includes("/api/auth/sign-out") && response.status() === 200
    );

    // 6. Kliknięcie przycisku "Sign out"
    await userMenu.clickLogout();

    // 7. Weryfikacja: API request zwraca 200
    const signOutResponse = await signOutPromise;
    expect(signOutResponse.status()).toBe(200);

    // 8. Weryfikacja: użytkownik jest przekierowany na /login
    await page.waitForURL("/login", { timeout: 5000 });
    await expect(page).toHaveURL("/login");

    // 9. Weryfikacja: cookie sesji jest usunięta (opcjonalnie sprawdzić przez localStorage/sessionStorage)
    // W praktyce: sprawdzamy, że login page się załadowała prawidłowo
    await expect(page.getByTestId("login-form")).toBeVisible();
  });
});
