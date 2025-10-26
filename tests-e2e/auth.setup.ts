import { test as setup } from "@playwright/test";
import { LoginPagePOM } from "./poms/LoginPagePOM";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Perform authentication steps. Replace with your actual login page and credentials.
  const loginPage = new LoginPagePOM(page);
  await loginPage.navigate();
  if (!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
  }
  await loginPage.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL("/board");

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});
