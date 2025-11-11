import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class AssigneeSectionPOM {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Admin select components (also available in TicketModalPOM but kept here for comprehensive role-based handling)
  getAdminSelect(): Locator {
    return this.page.getByTestId("assignee-section-admin-select");
  }

  getAdminSelectTrigger(): Locator {
    return this.page.getByTestId("assignee-section-admin-select-trigger");
  }

  getAdminSelectContent(): Locator {
    return this.page.getByTestId("assignee-section-admin-select-content");
  }

  // User actions components
  getUserActions(): Locator {
    return this.page.getByTestId("assignee-section-user-actions");
  }

  getUserAssignButton(): Locator {
    return this.page.getByTestId("assignee-section-user-actions-assign-button");
  }

  getUserUnassignButton(): Locator {
    return this.page.getByTestId("assignee-section-user-actions-unassign-button");
  }

  getUserAssigneeBadge(): Locator {
    return this.page.getByTestId("assignee-section-user-actions-badge");
  }

  // View mode components
  getViewMode(): Locator {
    return this.page.getByTestId("assignee-section-view");
  }

  getViewAssignButton(): Locator {
    return this.page.getByTestId("assignee-section-view-assign-button");
  }

  getViewUnassignButton(): Locator {
    return this.page.getByTestId("assignee-section-view-unassign-button");
  }

  getViewAssigneeBadge(): Locator {
    return this.page.getByTestId("assignee-section-view-badge");
  }

  // Edit mode components
  getEditMode(): Locator {
    return this.page.getByTestId("assignee-section-edit");
  }

  // Admin methods
  async selectAssigneeAdmin(username: string): Promise<void> {
    await this.getAdminSelectTrigger().click();
    await this.getAdminSelectContent().waitFor({ state: "visible" });
    const userOption = this.page.getByTestId("assignee-section-admin-select-item").filter({ hasText: username });
    await userOption.click();
  }

  async selectUnassignedAdmin(): Promise<void> {
    await this.getAdminSelectTrigger().click();
    await this.getAdminSelectContent().waitFor({ state: "visible" });
    const unassignedOption = this.getAdminSelectContent().getByText("Unassigned");
    await unassignedOption.click();
  }

  async getSelectedAssigneeAdmin(): Promise<string | null> {
    return await this.getAdminSelectTrigger().textContent();
  }

  // User methods
  async clickAssignToMeUser(): Promise<void> {
    await this.getUserAssignButton().click();
  }

  async clickUnassignUser(): Promise<void> {
    await this.getUserUnassignButton().click();
  }

  async getAssigneeUsernameUser(): Promise<string | null> {
    return await this.getUserAssigneeBadge().textContent();
  }

  // View mode methods
  async clickAssignToMeView(): Promise<void> {
    await this.getViewAssignButton().click();
  }

  async clickUnassignView(): Promise<void> {
    await this.getViewUnassignButton().click();
  }

  async getAssigneeUsernameView(): Promise<string | null> {
    return await this.getViewAssigneeBadge().textContent();
  }

  // Expectations
  async expectAdminSelectVisible(): Promise<void> {
    await expect(this.getAdminSelect()).toBeVisible();
  }

  async expectAdminSelectNotVisible(): Promise<void> {
    await expect(this.getAdminSelect()).not.toBeVisible();
  }

  async expectUserActionsVisible(): Promise<void> {
    await expect(this.getUserActions()).toBeVisible();
  }

  async expectUserActionsNotVisible(): Promise<void> {
    await expect(this.getUserActions()).not.toBeVisible();
  }

  async expectViewModeVisible(): Promise<void> {
    await expect(this.getViewMode()).toBeVisible();
  }

  async expectViewModeNotVisible(): Promise<void> {
    await expect(this.getViewMode()).not.toBeVisible();
  }

  async expectEditModeVisible(): Promise<void> {
    await expect(this.getEditMode()).toBeVisible();
  }

  async expectEditModeNotVisible(): Promise<void> {
    await expect(this.getEditMode()).not.toBeVisible();
  }

  async expectAssignButtonVisible(): Promise<void> {
    // Check either admin or user assign button
    const adminButton = this.getAdminSelectTrigger();
    const userButton = this.getUserAssignButton();
    const viewButton = this.getViewAssignButton();

    const isAdminVisible = await adminButton.isVisible().catch(() => false);
    const isUserVisible = await userButton.isVisible().catch(() => false);
    const isViewVisible = await viewButton.isVisible().catch(() => false);

    expect(isAdminVisible || isUserVisible || isViewVisible).toBe(true);
  }

  async expectUnassignButtonVisible(): Promise<void> {
    // Check either admin unassign option or user unassign button
    const userButton = this.getUserUnassignButton();
    const viewButton = this.getViewUnassignButton();

    const isUserVisible = await userButton.isVisible().catch(() => false);
    const isViewVisible = await viewButton.isVisible().catch(() => false);

    expect(isUserVisible || isViewVisible).toBe(true);
  }

  // Note: This POM provides specialized assignee functionality beyond TicketModalPOM:
  // - Role-based interface handling (admin vs user vs view modes)
  // - User action buttons (assign/unassign for non-admin users)
  // - View mode assignee management
  // - Comprehensive expectations for different user permissions
}
