import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagementView from "@/components/admin/UserManagementView";
import DocumentationManagementView from "@/components/admin/DocumentationManagementView";

export default function AdminPanelView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users and project documentation.</p>
      </div>

      <Tabs defaultValue="documentation" className="w-full">
        <TabsList>
          <TabsTrigger value="documentation">Project Documentation</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="documentation">
          <DocumentationManagementView />
        </TabsContent>

        <TabsContent value="users">
          <UserManagementView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
