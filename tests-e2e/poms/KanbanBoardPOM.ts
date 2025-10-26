import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class KanbanBoardPOM {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getKanbanColumn(status: "OPEN" | "IN_PROGRESS" | "CLOSED"): Locator {
    return this.page.getByTestId(`kanban-column-${status}`);
  }

  getTicketCard(ticketId: string): Locator {
    return this.page.getByTestId(`ticket-card-${ticketId}`);
  }

  async expectTicketToBeInColumn(ticketId: string, status: "OPEN" | "IN_PROGRESS" | "CLOSED"): Promise<void> {
    const column = this.getKanbanColumn(status);
    const ticket = column.getByTestId(`ticket-card-${ticketId}`);
    await expect(ticket).toBeVisible();
  }
}
