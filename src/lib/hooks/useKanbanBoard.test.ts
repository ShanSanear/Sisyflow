import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useKanbanBoard } from "./useKanbanBoard";
import { useUserContext } from "../../components/layout/useUserContext";
import { useToast } from "./useToast";
import type { TicketDTO } from "../../types";
import type { CurrentUser } from "../../components/views/KanbanBoardView.types";
import type { DragEndEvent } from "@dnd-kit/core";

// Mock external dependencies
vi.mock("../../components/layout/useUserContext");
vi.mock("./useToast");

const mockUseUserContext = vi.mocked(useUserContext);
const mockUseToast = vi.mocked(useToast);

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useKanbanBoard", () => {
  const mockCurrentUser: CurrentUser = {
    id: "user-1",
    role: "USER",
  };

  const mockAdminUser: CurrentUser = {
    id: "admin-1",
    role: "ADMIN",
  };

  const mockTicketDTO: TicketDTO = {
    id: "ticket-1",
    title: "Test Ticket",
    description: "Test description",
    type: "TASK",
    status: "OPEN",
    reporter_id: "user-1",
    assignee_id: "user-2",
    ai_enhanced: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    reporter: { username: "reporter" },
    assignee: { username: "assignee" },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseUserContext.mockReturnValue({
      user: {
        id: mockCurrentUser.id,
        username: "testuser",
        role: mockCurrentUser.role,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      currentUser: mockCurrentUser,
      isAdmin: mockCurrentUser.role === "ADMIN",
      isLoading: false,
      error: null,
      retry: vi.fn(),
    });

    mockUseToast.mockReturnValue({
      showError: vi.fn(),
      showSuccess: vi.fn(),
      showInfo: vi.fn(),
      showWarning: vi.fn(),
    });

    // Reset fetch mock to default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        tickets: [mockTicketDTO],
        pagination: {
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        },
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("transformTicketsToKanbanView", () => {
    it("should transform tickets to kanban view correctly", async () => {
      const ticketsWithVariousStates: TicketDTO[] = [
        { ...mockTicketDTO, id: "1", status: "OPEN" },
        { ...mockTicketDTO, id: "2", status: "IN_PROGRESS" },
        { ...mockTicketDTO, id: "3", status: "CLOSED" },
      ];

      // Mock fetch to return our test data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          tickets: ticketsWithVariousStates,
          pagination: { page: 1, limit: 100, total: 3, totalPages: 1 },
        }),
      });

      const { result } = renderHook(() => useKanbanBoard());

      await waitFor(() => {
        expect(result.current.boardState).not.toBeNull();
      });

      const boardState = result.current.boardState;
      expect(boardState?.OPEN.tickets).toHaveLength(1); // id: "1"
      expect(boardState?.IN_PROGRESS.tickets).toHaveLength(1); // id: "2"
      expect(boardState?.CLOSED.tickets).toHaveLength(1); // id: "3"

      // Check ticket transformation
      const openTicket = boardState?.OPEN.tickets.find((t) => t.id === "1");
      expect(openTicket?.title).toBe(mockTicketDTO.title);

      expect(openTicket?.assigneeName).toBe(mockTicketDTO.assignee?.username);
      expect(openTicket?.type).toBe(mockTicketDTO.type);
      expect(openTicket?.isAiEnhanced).toBe(mockTicketDTO.ai_enhanced);
      expect(openTicket?.reporterId).toBe(mockTicketDTO.reporter_id);
      expect(openTicket?.assigneeId).toBe(mockTicketDTO.assignee_id);
    });

    it("should handle tickets with null assignee", async () => {
      const ticketWithoutAssignee: TicketDTO = {
        ...mockTicketDTO,
        assignee_id: null,
        assignee: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          tickets: [ticketWithoutAssignee],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        }),
      });

      const { result } = renderHook(() => useKanbanBoard());

      await waitFor(() => {
        expect(result.current.boardState).not.toBeNull();
      });

      const boardState = result.current.boardState;

      const ticket = boardState?.OPEN.tickets[0];
      if (!ticket) {
        throw new Error("Ticket not found");
      }
      expect(ticket.assigneeName).toBeUndefined();
      expect(ticket.assigneeId).toBeNull();
    });

    it("should handle tickets with deleted reporter accounts", async () => {
      const ticketWithDeletedReporter: TicketDTO = {
        ...mockTicketDTO,
        reporter_id: null,
        reporter: { username: "deleted-user" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          tickets: [ticketWithDeletedReporter],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        }),
      });

      const { result } = renderHook(() => useKanbanBoard());

      await waitFor(() => {
        expect(result.current.boardState).not.toBeNull();
      });

      const boardState = result.current.boardState;

      const ticket = boardState?.OPEN.tickets[0];
      expect(ticket?.reporterId).toBeUndefined();
    });
  });

  describe("canMoveTicket", () => {
    it("should allow admin to move any ticket", () => {
      mockUseUserContext.mockReturnValue({
        user: {
          id: mockAdminUser.id,
          username: "adminuser",
          role: mockAdminUser.role,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        currentUser: mockAdminUser,
        isAdmin: true,
        isLoading: false,
        error: null,
        retry: vi.fn(),
      });

      const { result } = renderHook(() => useKanbanBoard());

      const ticket = {
        id: "ticket-1",
        title: "Test Ticket",
        assigneeName: "other-user",
        type: "TASK" as const,
        isAiEnhanced: false,
        reporterId: "other-user",
        assigneeId: "other-user",
      };

      expect(result.current.canMoveTicket(ticket)).toBe(true);
    });

    it("should allow user to move ticket if they are the reporter", () => {
      const { result } = renderHook(() => useKanbanBoard());

      const ticket = {
        id: "ticket-1",
        title: "Test Ticket",
        assigneeName: "assignee",
        type: "TASK" as const,
        isAiEnhanced: false,
        reporterId: "user-1",
        assigneeId: "user-2",
      };

      expect(result.current.canMoveTicket(ticket)).toBe(true);
    });

    it("should allow user to move ticket if they are the assignee", () => {
      const { result } = renderHook(() => useKanbanBoard());

      const ticket = {
        id: "ticket-1",
        title: "Test Ticket",
        assigneeName: "assignee",
        type: "TASK" as const,
        isAiEnhanced: false,
        reporterId: "user-2",
        assigneeId: "user-1",
      };

      expect(result.current.canMoveTicket(ticket)).toBe(true);
    });

    it("should deny user to move ticket if they are neither reporter nor assignee", () => {
      const { result } = renderHook(() => useKanbanBoard());

      const ticket = {
        id: "ticket-1",
        title: "Test Ticket",
        assigneeName: "other-assignee",
        type: "TASK" as const,
        isAiEnhanced: false,
        reporterId: "user-2",
        assigneeId: "user-2",
      };

      expect(result.current.canMoveTicket(ticket)).toBe(false);
    });

    it("should deny moving ticket when no user is logged in", () => {
      mockUseUserContext.mockReturnValue({
        user: null,
        currentUser: null,
        isAdmin: false,
        isLoading: false,
        error: null,
        retry: vi.fn(),
      });

      const { result } = renderHook(() => useKanbanBoard());

      const ticket = {
        id: "ticket-1",
        title: "Test Ticket",
        assigneeName: "assignee",
        type: "TASK" as const,
        isAiEnhanced: false,
        reporterId: "user-1",
        assigneeId: "user-2",
      };

      expect(result.current.canMoveTicket(ticket)).toBe(false);
    });
  });

  describe("initial data loading", () => {
    it("should load tickets on mount", async () => {
      renderHook(() => useKanbanBoard());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/tickets?limit=100", {
          headers: {
            "Content-Type": "application/json",
          },
          method: "GET",
        });
      });
    });

    it("should set loading state initially", () => {
      const { result } = renderHook(() => useKanbanBoard());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.boardState).toBeNull();
    });

    it("should handle successful data loading", async () => {
      const { result } = renderHook(() => useKanbanBoard());

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBeNull();
          expect(result.current.boardState).not.toBeNull();
        },
        { timeout: 2000 }
      );

      expect(result.current.boardState?.OPEN.tickets).toHaveLength(1);
      expect(result.current.boardState?.OPEN.tickets[0].id).toBe("ticket-1");
    });

    it("should handle fetch errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useKanbanBoard());

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBeInstanceOf(Error);
          expect(result.current.boardState).toBeNull();
        },
        {
          timeout: 2000,
        }
      );
    });

    it("should handle invalid API response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          // Missing tickets array
          pagination: { total: 0 },
        }),
      });

      const { result } = renderHook(() => useKanbanBoard());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
      });
    });
  });

  describe("handleDragEnd", () => {
    it("should ignore drag end without drop target", async () => {
      const { result } = renderHook(() => useKanbanBoard());

      // Wait for initial load
      await waitFor(
        () => {
          expect(result.current.boardState).not.toBeNull();
        },
        {
          timeout: 2000,
        }
      );

      const mockEvent = {
        active: { id: "ticket-1" },
        over: null, // No drop target
      };

      act(() => {
        result.current.handleDragEnd(mockEvent as DragEndEvent);
      });

      // Should not make any API calls or change state
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
    });

    it("should ignore drag when ticket not found", async () => {
      const { result } = renderHook(() => useKanbanBoard());

      await waitFor(
        () => {
          expect(result.current.boardState).not.toBeNull();
        },
        {
          timeout: 2000,
        }
      );

      const mockEvent = {
        active: { id: "non-existent-ticket" },
        over: { id: "IN_PROGRESS" },
      };

      act(() => {
        result.current.handleDragEnd(mockEvent as DragEndEvent);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
    });

    it("should ignore drag when status hasn't changed", async () => {
      const { result } = renderHook(() => useKanbanBoard());

      await waitFor(
        () => {
          expect(result.current.boardState).not.toBeNull();
        },
        {
          timeout: 2000,
        }
      );

      const mockEvent = {
        active: { id: "ticket-1" },
        over: { id: "OPEN" }, // Same status as current
      };

      act(() => {
        result.current.handleDragEnd(mockEvent as DragEndEvent);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
    });

    it("should deny drag when user lacks permission", async () => {
      // Setup user without permission BEFORE rendering
      mockUseUserContext.mockReturnValue({
        user: {
          id: "user-3", // Different user, no permission
          username: "regularuser",
          role: "USER",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        currentUser: {
          id: "user-3", // Different user, no permission
          role: "USER",
        },
        isAdmin: false,
        isLoading: false,
        error: null,
        retry: vi.fn(),
      });

      // Setup fresh mocks
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          tickets: [mockTicketDTO], // ticket has reporter_id: "user-1"
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        }),
      });

      const { result } = renderHook(() => useKanbanBoard());

      // Wait for initial data load
      await waitFor(
        () => {
          expect(result.current.boardState).not.toBeNull();
        },
        {
          timeout: 2000,
        }
      );

      const initialBoardState = result.current.boardState;

      const mockEvent = {
        active: { id: "ticket-1" },
        over: { id: "IN_PROGRESS" },
      };

      act(() => {
        result.current.handleDragEnd(mockEvent as DragEndEvent);
      });

      // Board state should remain unchanged (no optimistic update)
      expect(result.current.boardState).toBe(initialBoardState);

      // Should show error message
      expect(mockUseToast().showError).toHaveBeenCalledWith("You don't have permission to move this ticket.");

      // Should not make additional API call
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
    });

    it("should handle successful drag and drop", async () => {
      // Override global fetch mock for this test
      const originalFetch = global.fetch;

      try {
        global.fetch = vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({
              tickets: [mockTicketDTO],
              pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({}),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({
              tickets: [
                {
                  ...mockTicketDTO,
                  status: "IN_PROGRESS",
                },
              ],
              pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
            }),
          });

        const mockToast = mockUseToast();

        const { result } = renderHook(() => useKanbanBoard());

        await waitFor(() => {
          expect(result.current.boardState).not.toBeNull();
        });

        const initialBoardState = result.current.boardState;
        if (!initialBoardState) {
          throw new Error("Initial board state is null");
        }
        expect(initialBoardState.OPEN.tickets).toHaveLength(1);

        const mockEndEvent = {
          active: { id: "ticket-1" },
          over: { id: "IN_PROGRESS" },
        };

        act(() => {
          result.current.handleDragEnd(mockEndEvent as DragEndEvent);
        });

        // Check optimistic update
        expect(result.current.boardState?.OPEN.tickets).toHaveLength(0);
        expect(result.current.boardState?.IN_PROGRESS.tickets).toHaveLength(1);

        // Wait for API call and success handling
        await waitFor(
          () => {
            expect(mockToast.showSuccess).toHaveBeenCalledWith("Ticket moved to In Progress");
          },
          { timeout: 2000 }
        );
      } finally {
        // Always restore original fetch, even if test fails
        global.fetch = originalFetch;
      }
    });

    it("should revert optimistic update on API error", async () => {
      // Override global fetch mock for this test
      const originalFetch = global.fetch;

      try {
        global.fetch = vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({
              tickets: [mockTicketDTO],
              pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
            }),
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
          });

        const mockToast = mockUseToast();

        const { result } = renderHook(() => useKanbanBoard());

        await waitFor(
          () => {
            expect(result.current.boardState).not.toBeNull();
          },
          { timeout: 2000 }
        );

        const mockEvent = {
          active: { id: "ticket-1" },
          over: { id: "IN_PROGRESS" },
        };

        act(() => {
          result.current.handleDragEnd(mockEvent as DragEndEvent);
        });

        // Check optimistic update happened
        expect(result.current.boardState?.OPEN.tickets).toHaveLength(0);
        expect(result.current.boardState?.IN_PROGRESS.tickets).toHaveLength(1);

        // Wait for error handling and revert
        await waitFor(
          () => {
            expect(mockToast.showError).toHaveBeenCalledWith("Failed to move ticket. Please try again.");
          },
          {
            timeout: 2000,
          }
        );

        // Check state was reverted
        expect(result.current.boardState?.OPEN.tickets).toHaveLength(1);
        expect(result.current.boardState?.IN_PROGRESS.tickets).toHaveLength(0);
      } finally {
        // Always restore original fetch, even if test fails
        global.fetch = originalFetch;
      }
    });
  });

  describe("handleStatusChangeViaMenu", () => {
    it("should handle status change via menu successfully", async () => {
      // Override global fetch mock for this test
      const originalFetch = global.fetch;

      try {
        global.fetch = vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({
              tickets: [mockTicketDTO],
              pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({}),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({
              tickets: [
                {
                  ...mockTicketDTO,
                  status: "CLOSED",
                },
              ],
              pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
            }),
          });

        const mockToast = mockUseToast();

        const { result } = renderHook(() => useKanbanBoard());

        await waitFor(() => {
          expect(result.current.boardState).not.toBeNull();
        });

        act(() => {
          result.current.handleStatusChangeViaMenu("ticket-1", "CLOSED");
        });

        await waitFor(
          () => {
            expect(mockToast.showSuccess).toHaveBeenCalledWith("Ticket moved to Closed");
          },
          { timeout: 2000 }
        );
      } finally {
        // Always restore original fetch, even if test fails
        global.fetch = originalFetch;
      }
    });

    it("should deny status change when user lacks permission", async () => {
      // Setup user without permission BEFORE rendering
      mockUseUserContext.mockReturnValue({
        user: {
          id: "user-3", // Different user, no permission
          username: "regularuser",
          role: "USER",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        currentUser: {
          id: "user-3", // Different user, no permission
          role: "USER",
        },
        isAdmin: false,
        isLoading: false,
        error: null,
        retry: vi.fn(),
      });

      // Setup fresh mocks
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          tickets: [mockTicketDTO], // ticket has reporter_id: "user-1"
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        }),
      });

      const { result } = renderHook(() => useKanbanBoard());

      // Wait for initial data load
      await waitFor(() => {
        expect(result.current.boardState).not.toBeNull();
      });

      const initialBoardState = result.current.boardState;

      act(() => {
        result.current.handleStatusChangeViaMenu("ticket-1", "IN_PROGRESS");
      });

      // Board state should remain unchanged (no optimistic update)
      expect(result.current.boardState).toBe(initialBoardState);

      // Should show error message
      expect(mockUseToast().showError).toHaveBeenCalledWith("You don't have permission to move this ticket.");

      // Should not make API call
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe("refetch", () => {
    it("should refetch data when called", async () => {
      const { result } = renderHook(() => useKanbanBoard());

      await waitFor(() => {
        expect(result.current.boardState).not.toBeNull();
      });

      // Reset fetch mock call count
      mockFetch.mockClear();

      act(() => {
        result.current.refetch();
      });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith("/api/tickets?limit=100", {
            headers: {
              "Content-Type": "application/json",
            },
            method: "GET",
          });
        },
        { timeout: 2000 }
      );
    });
  });
});
