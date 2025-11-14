import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FiltersState } from "@/components/views/AIErrorsView";
import { useState, useEffect } from "react";

interface AIErrorsFiltersProps {
  filters: FiltersState;
  onFilterChange: (filters: FiltersState) => void;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function AIErrorsFilters({ filters, onFilterChange }: AIErrorsFiltersProps) {
  const [formState, setFormState] = useState(filters);
  const [isTicketIdValid, setIsTicketIdValid] = useState(true);

  useEffect(() => {
    setFormState(filters);
  }, [filters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));

    if (name === "ticket_id") {
      setIsTicketIdValid(value === "" || UUID_REGEX.test(value));
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTicketIdValid) {
      onFilterChange(formState);
    }
  };

  return (
    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      <div className="md:col-span-1">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          Search in error message
        </label>
        <Input
          id="search"
          name="search"
          placeholder="e.g., 'rate limit'"
          value={formState.search}
          onChange={handleInputChange}
        />
      </div>
      <div className="md:col-span-1">
        <label htmlFor="ticket_id" className="block text-sm font-medium text-gray-700 mb-1">
          Ticket ID (exact match)
        </label>
        <Input
          id="ticket_id"
          name="ticket_id"
          placeholder="Enter a valid UUID"
          value={formState.ticket_id}
          onChange={handleInputChange}
          className={!isTicketIdValid ? "border-destructive" : ""}
        />
        {!isTicketIdValid && <p className="text-sm text-destructive mt-1">Please enter a valid UUID.</p>}
      </div>
      <Button type="submit" disabled={!isTicketIdValid} className="self-end">
        Filter
      </Button>
    </form>
  );
}
