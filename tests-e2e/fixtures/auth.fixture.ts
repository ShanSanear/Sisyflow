/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { LoginPagePOM } from "../poms/LoginPagePOM";

export type UserRole = "admin" | "normal-user";

export interface UserCredentials {
  email: string;
  password: string;
}

export interface AuthFixture {
  loginAs: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  currentUser: UserRole | null;
}

// User credentials configuration
const userCredentials: Record<UserRole, UserCredentials> = {
  admin: {
    email: process.env.E2E_USERNAME || "",
    password: process.env.E2E_PASSWORD || "",
  },
  "normal-user": {
    email: process.env.E2E_NORMAL_USERNAME || "",
    password: process.env.E2E_NORMAL_PASSWORD || "",
  },
};

// Extend the base test with authentication capabilities

export const test = base.extend<AuthFixture>({
  loginAs: async ({ page }, useFixture) => {
    const loginAs = async (role: UserRole) => {
      const credentials = userCredentials[role];
      if (!credentials.email || !credentials.password) {
        throw new Error(`Credentials not found for role: ${role}. Make sure environment variables are set.`);
      }

      const loginPage = new LoginPagePOM(page);
      await loginPage.navigate();
      await loginPage.login(credentials.email, credentials.password);
      await page.waitForURL("/board");
    };

    await useFixture(loginAs);
  },

  logout: async ({ page }, useFixture) => {
    const logout = async () => {
      // Click on user menu to open dropdown
      await page.locator('[data-test-id="user-menu-trigger"]').click();

      // Click logout button
      await page.locator('[data-test-id="logout-button"]').click();

      // Wait for redirect to login page
      await page.waitForURL("/login");
    };

    await useFixture(logout);
  },

  currentUser: [null, { option: true }],
});

// Helper function to create test with specific user role
export function testAs(
  role: UserRole,
  testName: string,
  testFn: (args: {
    page: import("@playwright/test").Page;
    loginAs: (role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
  }) => Promise<void>
) {
  return test.describe(`[${role.toUpperCase()}] ${testName}`, () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs(role);
    });

    test(testName, testFn);
  });
}

// Parameterized test helper for running same test with multiple roles
export function testWithRoles(
  roles: UserRole[],
  testName: string,
  testFn: (
    args: {
      page: import("@playwright/test").Page;
      loginAs: (role: UserRole) => Promise<void>;
      logout: () => Promise<void>;
    },
    role: UserRole
  ) => Promise<void>
) {
  return test.describe(testName, () => {
    for (const role of roles) {
      test.describe(`[${role.toUpperCase()}]`, () => {
        test.beforeEach(async ({ loginAs }) => {
          await loginAs(role);
        });

        test(testName, async ({ page, loginAs, logout }) => {
          await testFn({ page, loginAs, logout }, role);
        });
      });
    }
  });
}
