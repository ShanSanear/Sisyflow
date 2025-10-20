export const TICKET_MODAL_EVENT = "sisyflow:ticket-modal" as const;

export type TicketModalEventDetail =
  | {
      type: "create";
    }
  | {
      type: "edit";
      ticketId: string;
    };

type TicketModalEvent = CustomEvent<TicketModalEventDetail>;

export const emitTicketModalEvent = (detail: TicketModalEventDetail): void => {
  if (typeof window === "undefined") {
    return;
  }

  const event: TicketModalEvent = new CustomEvent(TICKET_MODAL_EVENT, {
    detail,
  });

  window.dispatchEvent(event);
};

export const addTicketModalEventListener = (listener: (event: TicketModalEvent) => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => {
      return;
    };
  }

  const wrappedListener: EventListener = (event: Event) => {
    listener(event as TicketModalEvent);
  };

  window.addEventListener(TICKET_MODAL_EVENT, wrappedListener as EventListener);

  return () => {
    window.removeEventListener(TICKET_MODAL_EVENT, wrappedListener as EventListener);
  };
};
