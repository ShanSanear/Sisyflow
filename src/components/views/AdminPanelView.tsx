import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagementView from "@/components/admin/UserManagementView";
import DocumentationManagementView from "@/components/admin/DocumentationManagementView";
import AIErrorsView from "../views/AIErrorsView";

export default function AdminPanelView() {
  return (
    <div className="space-y-6" data-testid="admin-panel">
      <div data-testid="admin-panel-header">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, project documentation and view AI errors.</p>
      </div>

      <Tabs defaultValue="documentation" className="w-full" data-testid="admin-tabs">
        <TabsList data-testid="admin-tabs-list">
          <TabsTrigger value="documentation" data-testid="tab-project-documentation">
            Project Documentation
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-user-management">
            User Management
          </TabsTrigger>
          <TabsTrigger value="ai-errors" data-testid="tab-ai-errors">
            AI Errors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentation" data-testid="tab-content-documentation">
          <DocumentationManagementView />
        </TabsContent>

        <TabsContent value="users" data-testid="tab-content-users">
          <UserManagementView />
        </TabsContent>

        <TabsContent value="ai-errors" data-testid="tab-content-ai-errors">
          <AIErrorsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
