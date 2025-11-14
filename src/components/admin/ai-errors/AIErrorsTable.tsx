import type { AIErrorViewModel } from "@/components/views/AIErrorsView";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AIErrorsTableProps {
  errors: AIErrorViewModel[];
  isLoading: boolean;
  onShowDetails: (error: AIErrorViewModel) => void;
}

const getStatusVariant = (status: number | null) => {
  if (status === null) return "secondary";
  if (status >= 500) return "destructive";
  if (status >= 400) return "default"; // Typically yellow, but using default shadcn color for now
  return "secondary";
};

export function AIErrorsTable({ errors, isLoading, onShowDetails }: AIErrorsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (errors.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">No AI errors found.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Created At</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Ticket ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Error Message</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.map((error) => (
            <TableRow key={error.id}>
              <TableCell>{error.created_at}</TableCell>
              <TableCell>{error.user?.username || "N/A"}</TableCell>
              <TableCell>{error.ticket_id || "N/A"}</TableCell>
              <TableCell>
                {error.http_status ? (
                  <Badge variant={getStatusVariant(error.http_status)}>{error.http_status}</Badge>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate">{error.error_message}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDetails(error);
                  }}
                >
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
