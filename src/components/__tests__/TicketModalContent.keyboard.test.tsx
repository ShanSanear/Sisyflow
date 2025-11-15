import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React, { type ReactNode, type ComponentPropsWithoutRef } from "react";
import { TicketModalContent } from "../TicketModalContent";
import type { ProfileDTO } from "@/types";
import type { TicketFormData } from "@/lib/validation/schemas/ticket";

// Mock dependencies
vi.mock("../TicketForm", () => ({
  TicketForm: () => <div data-testid="ticket-form">Ticket Form</div>,
}));

vi.mock("../ActionButtons", () => ({
  ActionButtons: () => <div data-testid="action-buttons">Action Buttons</div>,
}));

vi.mock("../ticket/AIAnalysisButton", () => ({
  AIAnalysisButton: () => <div data-testid="ai-analysis-button">AI Analysis Button</div>,
}));

vi.mock("../ticket/AISuggestionsList", () => ({
  AISuggestionsList: () => <div data-testid="ai-suggestions-list">AI Suggestions List</div>,
}));

vi.mock("../ticket/AIRating", () => ({
  AIRating: () => <div data-testid="ai-rating">AI Rating</div>,
}));

vi.mock("../ui/resizable", () => {
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

describe("TicketModalContent - Keyboard Shortcuts", () => {
  const mockUser: ProfileDTO = {
    id: "user-1",
    username: "testuser",
    role: "USER",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockFormData: TicketFormData = {
    title: "Test Ticket",
    description: "Test description",
    type: "TASK",
    assignee: null,
    ai_enhanced: false,
  };

  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnFormChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    mode: "create" | "edit" | "view" = "create",
    formData = mockFormData,
    isFormValid = true
  ) => {
    return render(
      <TicketModalContent
        formData={formData}
        errors={{}}
        isFormValid={isFormValid}
        loading={false}
        mode={mode}
        user={mockUser}
        isAdmin={false}
        ticket={undefined}
        canEdit={true}
        onFormChange={mockOnFormChange}
        onSave={mockOnSave}
        onEdit={mockOnEdit}
        onCancel={mockOnCancel}
      />
    );
  };

  describe("Ctrl+Enter shortcut", () => {
    it("should submit form when Ctrl+Enter is pressed in create mode with valid form", async () => {
      renderComponent("create", mockFormData, true);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-modal-content")).toBeInTheDocument();
      });

      // Simulate pressing Ctrl+Enter
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });

    it("should submit form when Cmd+Enter is pressed on Mac", async () => {
      renderComponent("create", mockFormData, true);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-modal-content")).toBeInTheDocument();
      });

      // Simulate pressing Cmd+Enter (metaKey)
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });

    it("should not submit form when Ctrl+Enter is pressed with invalid form", async () => {
      const invalidFormData: TicketFormData = {
        ...mockFormData,
        title: "", // Empty title makes form invalid
      };

      renderComponent("create", invalidFormData, false);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-modal-content")).toBeInTheDocument();
      });

      // Simulate pressing Ctrl+Enter
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      // Wait a bit to ensure handler has run
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should not submit form when Ctrl+Enter is pressed in view mode", async () => {
      renderComponent("view", mockFormData, true);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-modal-content")).toBeInTheDocument();
      });

      // Simulate pressing Ctrl+Enter
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      // Wait a bit to ensure handler has run
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not call onSave in view mode
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("should not submit form when Enter is pressed without Ctrl", async () => {
      renderComponent("create", mockFormData, true);

      await waitFor(() => {
        expect(screen.getByTestId("ticket-modal-content")).toBeInTheDocument();
      });

      // Simulate pressing Enter without Ctrl
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      // Wait a bit to ensure handler has run
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});
