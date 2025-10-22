import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UserActionsDropdown } from "./UserActionsDropdown";
import type { UserViewModel } from "@/types";

interface UsersTableProps {
  users: UserViewModel[];
  currentUserId: string;
  onDelete: (user: UserViewModel) => void;
  isLoading: boolean;
}

const TableHeaders = () => (
  <TableHeader>
    <TableRow>
      <TableHead>Username</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
      <TableHead>Created At</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
);

export function UsersTable({ users, currentUserId, onDelete, isLoading }: UsersTableProps) {
  if (isLoading) {
    return (
      <Table>
        <TableHeaders />
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No users to display.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeaders />
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className={user.isDeleting ? "opacity-50 pointer-events-none" : ""}>
            <TableCell>{user.username}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              {user.isDeleting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              ) : (
                <UserActionsDropdown user={user} currentUserId={currentUserId} onDelete={onDelete} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
