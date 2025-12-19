import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  GraduationCap,
  User,
  LogOut,
  FileText,
  Building2,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminSidebar = () => {
  const { user, signOut } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-card border-r flex flex-col h-screen sticky top-0">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center gap-2 p-2 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">AI Tutor</h1>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.user_metadata?.full_name ? getInitials(user.user_metadata.full_name) : "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h2 className="text-base font-semibold">{user?.user_metadata?.full_name || "Admin"}</h2>
              <p className="text-sm text-muted-foreground">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <nav className="flex flex-col gap-2 p-4">
          <NavLink
            to="/dashboard/admin"
            end
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </NavLink>
          <NavLink
            to="/dashboard/admin/users"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">User Management</span>
          </NavLink>
          <NavLink
            to="/dashboard/admin/schools"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-medium">School Management</span>
          </NavLink>
          <NavLink
            to="/dashboard/admin/analytics"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm font-medium">Analytics</span>
          </NavLink>
          <NavLink
            to="/dashboard/admin/content"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">Content Management</span>
          </NavLink>
          <NavLink
            to="/dashboard/admin/content/manage"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors ml-4"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Manage All Content</span>
          </NavLink>
          <NavLink
            to="/dashboard/admin/notifications/create"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Bell className="h-5 w-5" />
            <span className="text-sm font-medium">Send Notifications</span>
          </NavLink>
          <NavLink
            to="/profile-setup"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">Profile Setup</span>
          </NavLink>
          <NavLink
            to="/dashboard/admin/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
        </nav>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

