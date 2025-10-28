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

  async clickTicketCard(ticketId: string): Promise<void> {
    const ticketCard = this.getTicketCard(ticketId);
    await ticketCard.click();
  }

  getTicketDropdownTrigger(ticketId: string): Locator {
    const ticketCard = this.getTicketCard(ticketId);
    return ticketCard.getByTestId("ticket-card-dropdown-trigger");
  }

  async clickEditTicket(ticketId: string): Promise<void> {
    // Najpierw otwórz dropdown menu
    const dropdownTrigger = this.getTicketDropdownTrigger(ticketId);
    await dropdownTrigger.click();

    // Potem kliknij w opcję Edit
    const editButton = this.page.getByTestId("ticket-card-edit-button");
    await editButton.click();
  }
}
