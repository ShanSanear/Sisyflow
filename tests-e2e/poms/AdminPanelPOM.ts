import type { Page, Locator } from "@playwright/test";

export class AdminPanelPOM {
  readonly page: Page;
  readonly adminPanel: Locator;
  readonly adminPanelHeader: Locator;
  readonly adminTabs: Locator;
  readonly adminTabsList: Locator;
  readonly projectDocumentationTab: Locator;
  readonly userManagementTab: Locator;
  readonly documentationTabContent: Locator;
  readonly userManagementTabContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.adminPanel = page.getByTestId("admin-panel");
    this.adminPanelHeader = page.getByTestId("admin-panel-header");
    this.adminTabs = page.getByTestId("admin-tabs");
    this.adminTabsList = page.getByTestId("admin-tabs-list");
    this.projectDocumentationTab = page.getByTestId("tab-project-documentation");
    this.userManagementTab = page.getByTestId("tab-user-management");
    this.documentationTabContent = page.getByTestId("tab-content-documentation");
    this.userManagementTabContent = page.getByTestId("tab-content-users");
  }

  /**
   * Navigate to admin panel
   */
  async navigate(): Promise<void> {
    await this.page.goto("/admin");
    await this.page.waitForURL("/admin");
  }

  /**
   * Check if admin panel is visible
   */
  async isPanelVisible(): Promise<boolean> {
    return await this.adminPanel.isVisible();
  }

  /**
   * Check if admin panel header is visible
   */
  async isHeaderVisible(): Promise<boolean> {
    return await this.adminPanelHeader.isVisible();
  }

  /**
   * Switch to project documentation tab
   */
  async switchToProjectDocumentation(): Promise<void> {
    await this.projectDocumentationTab.click();
    await this.documentationTabContent.waitFor({ state: "visible" });
  }

  /**
   * Switch to user management tab
   */
  async switchToUserManagement(): Promise<void> {
    await this.userManagementTab.click();
    await this.userManagementTabContent.waitFor({ state: "visible" });
  }

  /**
   * Check if project documentation tab is active
   */
  async isProjectDocumentationTabActive(): Promise<boolean> {
    return (await this.projectDocumentationTab.getAttribute("data-state")) === "active";
  }

  /**
   * Check if user management tab is active
   */
  async isUserManagementTabActive(): Promise<boolean> {
    return (await this.userManagementTab.getAttribute("data-state")) === "active";
  }

  /**
   * Check if documentation content is visible
   */
  async isDocumentationContentVisible(): Promise<boolean> {
    return await this.documentationTabContent.isVisible();
  }

  /**
   * Check if user management content is visible
   */
  async isUserManagementContentVisible(): Promise<boolean> {
    return await this.userManagementTabContent.isVisible();
  }
}
