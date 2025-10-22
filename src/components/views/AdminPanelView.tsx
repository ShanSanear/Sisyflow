import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagementView from "@/components/admin/UserManagementView";

export default function AdminPanelView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel Administratora</h1>
        <p className="text-muted-foreground">Zarządzaj użytkownikami i innymi aspektami systemu.</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Zarządzanie Użytkownikami</TabsTrigger>
          {/* Przyszłe zakładki */}
          {/* <TabsTrigger value="documentation">Dokumentacja Projektu</TabsTrigger> */}
        </TabsList>

        <TabsContent value="users">
          <UserManagementView />
        </TabsContent>

        {/* Przyszłe TabsContent */}
      </Tabs>
    </div>
  );
}
