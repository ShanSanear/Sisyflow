import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React, { type ReactNode, type ComponentPropsWithoutRef } from "react";
import { KanbanBoardView } from "../KanbanBoardView";
import { TicketModalProvider } from "@/lib/contexts/TicketModalContext";
import { TicketModal } from "../../TicketModal";
import { useKanbanBoard } from "@/lib/hooks/useKanbanBoard";
import { useUserContext } from "@/components/layout/useUserContext";
import type { ProfileDTO } from "@/types";

// Mock dependencies
vi.mock("@/lib/hooks/useKanbanBoard");
vi.mock("@/components/layout/useUserContext");

// Mock child components
vi.mock("../../kanban/BoardContainer", () => ({
  BoardContainer: () => <div data-testid="board-container">Board Container</div>,
}));

vi.mock("../../ui/empty-state", () => ({
  EmptyState: () => <div data-testid="empty-state">Empty State</div>,
}));

vi.mock("../../ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton">Skeleton</div>,
}));

vi.mock("@/lib/hooks/useTicketModalState", () => ({
  useTicketModalState: () => ({
    formData: { title: "", description: "", type: "TASK", assignee: null, ai_enhanced: false },
    errors: {},
    isFormValid: false,
    handleFormChange: vi.fn(),
    resetForm: vi.fn(),
  }),
}));

vi.mock("@/lib/hooks/useTicketData", () => ({
  useTicketData: () => ({
    ticket: undefined,
    loading: false,
  }),
}));

vi.mock("@/lib/hooks/useTicketPermissions", () => ({
  useTicketPermissions: () => ({
    canEditTicket: vi.fn(() => false),
  }),
}));

vi.mock("@/lib/hooks/useTicketActions", () => ({
  useTicketActions: () => ({
    handleSave: vi.fn(),
    handleEditMode: vi.fn(),
    onAssigneeChange: vi.fn(),
  }),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children?: ReactNode; open?: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, ...props }: ComponentPropsWithoutRef<"div">) => (
    <div data-testid="ticket-modal" {...props}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: { children?: ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children?: ReactNode }) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: { children?: ReactNode }) => <div data-testid="dialog-description">{children}</div>,
  DialogTrigger: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ticket/DescriptionEditor", () => ({
  DescriptionEditor: () => <div data-testid="description-editor">Description Editor</div>,
}));

vi.mock("@/components/ui/resizable", () => {
  interface ResizablePanelRef {
    collapse: () => void;
    expand: () => void;
    resize: (size: number) => void;
  }

  const ResizablePanel = React.forwardRef<
    ResizablePanelRef,
    ComponentPropsWithoutRef<"div"> & { children?: ReactNode }
  >(({ children, ...props }, ref) => {
    React.useImperativeHandle(
      ref,
      () => ({
        collapse: vi.fn(),
        expand: vi.fn(),
        resize: vi.fn(),
      }),
      []
    );
    return (
      <div data-testid="resizable-panel" {...props}>
        {children}
      </div>
    );
  });
  ResizablePanel.displayName = "ResizablePanel";

  return {
    ResizablePanelGroup: ({ children, ...props }: ComponentPropsWithoutRef<"div">) => (
      <div data-testid="resizable-panel-group" {...props}>
        {children}
      </div>
    ),
    ResizablePanel,
    ResizableHandle: () => <div data-testid="resizable-handle" />,
  };
});

const mockUseKanbanBoard = vi.mocked(useKanbanBoard);
const mockUseUserContext = vi.mocked(useUserContext);

describe("KanbanBoardView - Keyboard Shortcuts", () => {
  const mockBoardState = {
    OPEN: {
      title: "Open",
      tickets: [
        {
          id: "ticket-1",
          title: "Test Ticket",
          assigneeName: "user",
          type: "TASK" as const,
          isAiEnhanced: false,
          reporterId: "user-1",
          assigneeId: "user-1",
        },
      ],
    },
    IN_PROGRESS: { title: "In Progress", tickets: [] },
    CLOSED: { title: "Closed", tickets: [] },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mockUserValue = {
      user: {
        id: "user-1",
        username: "testuser",
        role: "USER" as const,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      } satisfies ProfileDTO,
      currentUser: { id: "user-1", role: "USER" as const },
      isAdmin: false,
      isLoading: false,
      error: null,
      retry: vi.fn(() => Promise.resolve()),
    };

    mockUseUserContext.mockReturnValue(mockUserValue);

    mockUseKanbanBoard.mockReturnValue({
      boardState: mockBoardState,
      isLoading: false,
      error: null,
      savingTicketId: null,
      handleDragEnd: vi.fn(),
      handleStatusChangeViaMenu: vi.fn(),
      handleTicketDelete: vi.fn(),
      canMoveTicket: vi.fn(() => true),
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <TicketModalProvider>
        <KanbanBoardView />
        <TicketModal />
      </TicketModalProvider>
    );
  };

  describe("'C' key shortcut", () => {
    it("should open ticket creation modal when 'C' key is pressed", async () => {
      renderComponent();

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByTestId("kanban-board-container")).toBeInTheDocument();
      });

      // Simulate pressing 'C' key
      await act(async () => {
        const event = new KeyboardEvent("keydown", {
          key: "c",
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(event);
      });

      // The modal should be rendered
      await waitFor(
        () => {
          const modal = screen.queryByTestId("ticket-modal");
          expect(modal).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should not open modal when 'C' is pressed while typing in input", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("kanban-board-container")).toBeInTheDocument();
      });

      // Create and focus an input element
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      // Simulate pressing 'C' key
      const event = new KeyboardEvent("keydown", {
        key: "c",
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      // Modal should not open
      await waitFor(() => {
        const modal = screen.queryByTestId("ticket-modal");
        expect(modal).not.toBeInTheDocument();
      });

      document.body.removeChild(input);
    });

    it("should not open modal when 'C' is pressed with Ctrl key (Ctrl+C)", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("kanban-board-container")).toBeInTheDocument();
      });

      // Simulate pressing Ctrl+C
      const event = new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      // Modal should not open
      await waitFor(() => {
        const modal = screen.queryByTestId("ticket-modal");
        expect(modal).not.toBeInTheDocument();
      });
    });

    it("should not open modal when text is selected", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("kanban-board-container")).toBeInTheDocument();
      });

      // Simulate text selection
      const range = document.createRange();
      const textNode = document.createTextNode("Selected text");
      document.body.appendChild(textNode);
      range.selectNodeContents(textNode);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Simulate pressing 'C' key
      const event = new KeyboardEvent("keydown", {
        key: "c",
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      // Modal should not open
      await waitFor(() => {
        const modal = screen.queryByTestId("ticket-modal");
        expect(modal).not.toBeInTheDocument();
      });

      // Cleanup
      selection?.removeAllRanges();
      document.body.removeChild(textNode);
    });

    it("should not open modal when modal is already open", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("kanban-board-container")).toBeInTheDocument();
      });

      // Open modal first
      await act(async () => {
        const firstEvent = new KeyboardEvent("keydown", {
          key: "c",
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(firstEvent);
      });

      await waitFor(
        () => {
          const modal = screen.queryByTestId("ticket-modal");
          expect(modal).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Try to open modal again with 'C' key
      await act(async () => {
        const secondEvent = new KeyboardEvent("keydown", {
          key: "c",
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(secondEvent);
      });

      // Should still have only one modal
      const modals = screen.queryAllByTestId("ticket-modal");
      expect(modals).toHaveLength(1);
    });
  });
});
