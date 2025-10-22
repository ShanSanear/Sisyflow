import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagementView from "@/components/admin/UserManagementView";

export default function AdminPanelView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users and other system aspects.</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          {/* Future tabs */}
          {/* <TabsTrigger value="documentation">Project Documentation</TabsTrigger> */}
        </TabsList>

        <TabsContent value="users">
          <UserManagementView />
        </TabsContent>

        {/* Future TabsContent */}
      </Tabs>
    </div>
  );
}
