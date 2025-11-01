import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class BoardPagePOM {
  readonly page: Page;
  readonly authenticatedMainContent: Locator;
  readonly kanbanBoardContainer: Locator;
  readonly boardLoadingState: Locator;
  readonly boardErrorState: Locator;
  readonly boardEmptyState: Locator;
  readonly boardNoTicketsState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.authenticatedMainContent = page.getByTestId("authenticated-main-content");
    this.kanbanBoardContainer = page.getByTestId("kanban-board-container");
    this.boardLoadingState = page.getByTestId("board-loading-state");
    this.boardErrorState = page.getByTestId("board-error-state");
    this.boardEmptyState = page.getByTestId("board-empty-state");
    this.boardNoTicketsState = page.getByTestId("board-no-tickets-state");
  }

  /**
   * Navigate to the board page
   * Used for testing unauthenticated access (should redirect to login)
   */
  async navigateToBoard(): Promise<void> {
    await this.page.goto("/board");
  }

  /**
   * Wait for board page to load completely
   * Verifies that authenticated content is visible
   */
  async waitForBoardToLoad(): Promise<void> {
    await this.authenticatedMainContent.waitFor({ state: "visible" });
  }

  /**
   * Check if board page is accessible (authenticated user)
   */
  async isBoardAccessible(): Promise<boolean> {
    try {
      await this.authenticatedMainContent.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if kanban board container is rendered
   */
  async isKanbanBoardVisible(): Promise<boolean> {
    try {
      await this.kanbanBoardContainer.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if board is in loading state
   */
  async isBoardLoading(): Promise<boolean> {
    try {
      await this.boardLoadingState.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if board shows error state
   */
  async isBoardErrorShowing(): Promise<boolean> {
    try {
      await this.boardErrorState.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if board shows empty state (no data)
   */
  async isBoardEmpty(): Promise<boolean> {
    try {
      await this.boardEmptyState.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if board shows no tickets state
   */
  async hasNoTickets(): Promise<boolean> {
    try {
      await this.boardNoTicketsState.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current page URL
   */
  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  /**
   * Verify that page redirected to login
   * Used in middleware protection test
   */
  async expectRedirectToLogin(): Promise<void> {
    await this.page.waitForURL("/login");
    expect(this.page.url()).toContain("/login");
  }

  /**
   * Check if we're on the board page URL
   */
  async isBoardPageURL(): Promise<boolean> {
    return this.page.url().includes("/board");
  }
}
