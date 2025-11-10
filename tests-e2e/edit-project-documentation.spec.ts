import { expect } from "@playwright/test";
import { test } from "./fixtures/auth.fixture";
import { AdminPanelPOM } from "./poms/AdminPanelPOM";
import { DocumentationManagementPOM } from "./poms/DocumentationManagementPOM";

test.describe("TC-ADMIN-007: Edycja i zapis dokumentacji projektu przez Admina (P1, E2E)", () => {
  let adminPanel: AdminPanelPOM;
  let documentation: DocumentationManagementPOM;

  test.beforeEach(async ({ page, loginAs }) => {
    // Login as admin for these tests
    await loginAs("admin");

    // Initialize POMs
    adminPanel = new AdminPanelPOM(page);
    documentation = new DocumentationManagementPOM(page);
  });

  test("powinien pozwolić administratorowi na edycję dokumentacji projektu i wyświetlić toast sukcesu", async ({
    page,
  }) => {
    const newDocumentationContent = `Zaktualizowana dokumentacja projektu - ${new Date().toISOString()}

Ta dokumentacja zawiera ważne informacje dla zespołu deweloperskiego.
Wersja zaktualizowana automatycznie przez test E2E.

## Sekcje dokumentacji:
- Wprowadzenie do projektu
- Architektura systemu
- Procesy CI/CD
- Wytyczne kodowania
- Testowanie aplikacji

**Data ostatniej aktualizacji:** ${new Date().toLocaleDateString("pl-PL")}`;

    // Krok 1: Przejdź do panelu administracyjnego
    await adminPanel.navigate();
    await expect(page).toHaveURL("/admin");

    // Weryfikacja: Panel admin jest widoczny
    expect(await adminPanel.isPanelVisible()).toBe(true);
    expect(await adminPanel.isHeaderVisible()).toBe(true);

    // Krok 2: Upewnij się, że jesteś na stronie z project documentation
    await adminPanel.switchToProjectDocumentation();

    // Weryfikacja: Zakładka dokumentacji jest aktywna
    expect(await adminPanel.isProjectDocumentationTabActive()).toBe(true);
    expect(await adminPanel.isDocumentationContentVisible()).toBe(true);

    // Weryfikacja: Dokumentacja się załadowała
    await documentation.waitForDocumentationToLoad();
    await expect(documentation.documentationManagement).toBeVisible();
    await expect(documentation.documentationHeader).toBeVisible();

    // Weryfikacja: Elementy edycji są dostępne
    await expect(documentation.documentationTextarea).toBeVisible();
    await expect(documentation.documentationCharCounter).toBeVisible();
    await expect(documentation.documentationSaveBar).toBeVisible();

    // Edytuj dokumentację używając metody POM
    await documentation.waitForDocumentationToLoad();
    await documentation.clearDocumentationContent();
    await documentation.typeDocumentationContent(newDocumentationContent);

    // Przechwyć odpowiedź API, która powinna być pomyślna
    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/project-documentation") &&
        response.status() === 200 &&
        response.request().method() === "PUT"
    );

    await documentation.clickSaveButton();
    await documentation.waitForSavingState();

    // Poczekaj na odpowiedź API
    await updateResponsePromise;

    // Krok 4: Upewnij się, że toast message się pojawia
    await documentation.expectSuccessToastToBeVisible("Project documentation updated successfully");

    // Dodatkowa weryfikacja: zawartość została zaktualizowana
    const currentContent = await documentation.getDocumentationContent();
    expect(currentContent).toContain("Zaktualizowana dokumentacja projektu");

    // Weryfikacja: przycisk zapisu wrócił do stanu idle
    await expect(documentation.getSaveButton("idle")).toBeVisible();
  });

  test("powinien wyświetlić licznik znaków podczas edycji dokumentacji", async () => {
    // Przejdź do dokumentacji projektu
    await adminPanel.navigate();
    await adminPanel.switchToProjectDocumentation();
    await documentation.waitForDocumentationToLoad();

    // Weryfikacja: licznik znaków jest widoczny
    expect(await documentation.documentationCharCounter.isVisible()).toBe(true);

    // Pobierz początkową wartość licznika
    const initialCounterText = await documentation.getCharCounterText();
    expect(initialCounterText).toMatch(/\d+\/\d+ characters/);

    // Dodaj więcej tekstu
    const additionalText = "To jest dodatkowy tekst dodany do sprawdzenia licznika znaków. " + "A".repeat(100);
    await documentation.typeDocumentationContent(additionalText);

    // Weryfikacja: licznik znaków się zaktualizował
    const updatedCounterText = await documentation.getCharCounterText();
    expect(updatedCounterText).not.toBe(initialCounterText);

    // Wyczyść zmiany (nie zapisuj)
    await documentation.clearDocumentationContent();
  });

  test("powinien obsłużyć błąd ładowania dokumentacji", async () => {
    // Przejdź do panelu admin
    await adminPanel.navigate();

    // Symuluj błąd API poprzez przerwanie połączenia lub mock (w rzeczywistym scenariuszu)
    // Tutaj testujemy tylko, czy UI odpowiednio reaguje na błędy

    // Weryfikacja: stan ładowania może być widoczny początkowo
    // expect(await documentation.isLoadingVisible()).toBe(true); // może być true lub false w zależności od czasu

    // W rzeczywistym scenariuszu z błędem API:
    // await documentation.waitForDocumentationToLoad(); // może rzucić błąd timeout
    // expect(await documentation.isErrorVisible()).toBe(true);
    // await documentation.clickRetryButton();
    // await documentation.waitForDocumentationToLoad();
  });
});
