import type { AIErrorWithUserDTO, PaginationDTO } from "@/types";
import type { Json } from "src/db/database.types";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { AIErrorsTable } from "@/components/admin/ai-errors/AIErrorsTable";
import { AIErrorsFilters } from "@/components/admin/ai-errors/AIErrorsFilters";
import { PaginationControls } from "@/components/admin/ai-errors/PaginationControls";
import { ErrorDetailsSheet } from "@/components/admin/ai-errors/ErrorDetailsSheet";
import { useToast } from "@/lib/hooks/useToast";

// ViewModel used directly by the React components to render data.
export interface AIErrorViewModel {
  id: string;
  ticket_id: string | null;
  error_message: string;
  created_at: string;
  user: {
    id: string;
    username: string; // Displayed username
  } | null;
  http_status: number | null; // Parsed HTTP status code
  details_json: Json; // Raw 'error_details' object
}

// State for filters
export interface FiltersState {
  ticket_id: string;
  search: string;
}

// The main state of the view, managed by a custom hook.
export interface AIErrorsViewState {
  errors: AIErrorViewModel[];
  pagination: PaginationDTO | null;
  filters: FiltersState;
  api: {
    isLoading: boolean;
    error: string | null;
  };
  selectedError: AIErrorViewModel | null; // Error selected for detail view
}

const initialState: AIErrorsViewState = {
  errors: [],
  pagination: null,
  filters: {
    ticket_id: "",
    search: "",
  },
  api: {
    isLoading: false,
    error: null,
  },
  selectedError: null,
};

// --- Action Types for Reducer ---
type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { errors: AIErrorViewModel[]; pagination: PaginationDTO } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SET_FILTERS"; payload: Partial<FiltersState> }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SELECT_ERROR"; payload: AIErrorViewModel | null };

// --- Reducer for state management ---
function aiErrorsReducer(state: AIErrorsViewState, action: Action): AIErrorsViewState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, api: { ...state.api, isLoading: true, error: null } };
    case "FETCH_SUCCESS":
      return {
        ...state,
        errors: action.payload.errors,
        pagination: action.payload.pagination,
        api: { ...state.api, isLoading: false },
      };
    case "FETCH_ERROR":
      return { ...state, api: { ...state.api, isLoading: false, error: action.payload } };
    case "SET_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        // Reset page to 1 when filters change
        pagination: state.pagination ? { ...state.pagination, page: 1 } : null,
      };
    case "SET_PAGE":
      return {
        ...state,
        pagination: state.pagination ? { ...state.pagination, page: action.payload } : null,
      };
    case "SELECT_ERROR":
      return { ...state, selectedError: action.payload };
    default:
      return state;
  }
}

// --- Data Transformation ---
// Transforms API DTO to ViewModel for the UI
const transformToViewModel = (error: AIErrorWithUserDTO): AIErrorViewModel => {
  let http_status: number | null = null;
  // Safely parse http_status from JSON details
  if (
    error.error_details &&
    typeof error.error_details === "object" &&
    "status" in error.error_details &&
    typeof error.error_details.status === "number"
  ) {
    http_status = error.error_details.status;
  }

  return {
    id: error.id,
    ticket_id: error.ticket_id,
    error_message: error.error_message,
    created_at: new Date(error.created_at).toLocaleString(),
    user: error.user
      ? {
          id: error.user.id,
          username: error.user.username || "N/A",
        }
      : null,
    http_status,
    details_json: error.error_details,
  };
};

// --- Custom Hook ---
const useAIErrors = () => {
  const [state, dispatch] = useReducer(aiErrorsReducer, initialState);
  const { showError } = useToast();
  const showErrorRef = useRef(showError);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  const { page, limit } = state.pagination || { page: 1, limit: 50 };
  const { ticket_id, search } = state.filters;

  const fetchAIErrors = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const offset = (page - 1) * limit;

      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (ticket_id) {
        queryParams.append("ticket_id", ticket_id);
      }
      if (search) {
        queryParams.append("search", search);
      }

      const response = await fetch(`/api/ai-errors?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch AI errors: ${response.statusText}`);
      }

      const data = await response.json();
      const viewModels = data.errors.map(transformToViewModel);

      dispatch({ type: "FETCH_SUCCESS", payload: { errors: viewModels, pagination: data.pagination } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      showErrorRef.current(errorMessage);
      dispatch({ type: "FETCH_ERROR", payload: errorMessage });
    }
  }, [ticket_id, search, page, limit]);

  useEffect(() => {
    fetchAIErrors();
  }, [fetchAIErrors]);

  const applyFilters = (filters: FiltersState) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  };
  const changePage = (page: number) => {
    dispatch({ type: "SET_PAGE", payload: page });
  };
  const selectError = (error: AIErrorViewModel | null) => {
    dispatch({ type: "SELECT_ERROR", payload: error });
  };

  return {
    ...state,
    applyFilters,
    changePage,
    selectError,
    fetchAIErrors, // Expose refetch function
  };
};

const AIErrorsView = () => {
  const { errors, pagination, filters, api, selectedError, applyFilters, changePage, selectError } = useAIErrors();

  // Error is now handled by a toast, so we don't need the specific error UI here.
  // The table will just show the empty/previous state.
  return (
    <div className="space-y-4">
      <AIErrorsFilters filters={filters} onFilterChange={applyFilters} />
      <AIErrorsTable errors={errors} isLoading={api.isLoading} onShowDetails={selectError} />
      {pagination && <PaginationControls pagination={pagination} onPageChange={changePage} />}
      <ErrorDetailsSheet error={selectedError} isOpen={!!selectedError} onClose={() => selectError(null)} />
    </div>
  );
};

export default AIErrorsView;
