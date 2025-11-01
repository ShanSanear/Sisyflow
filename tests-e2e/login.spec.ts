import { test, expect } from "@playwright/test";
import { LoginPagePOM } from "./poms/LoginPagePOM";

test.describe("Autentykacja - TC-AUTH-003: Błędne logowanie", () => {
  test("powinien wyświetlić alert błędu przy logowaniu z nieprawidłowym hasłem", async ({ page }) => {
    // Logujemy się z nowym context, aby uniknąć sesji
    const loginPage = new LoginPagePOM(page);

    // 1. Przejście na stronę logowania
    await loginPage.navigate();
    await expect(page).toHaveURL("/login");

    // Czekamy 1 sekundę na załadowanie strony
    await page.waitForTimeout(1000);

    // 2. Wpisanie prawidłowego emaila i NIEPRAWIDŁOWEGO hasła
    await loginPage.emailInput.fill("test@example.com");
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
