import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  MessageSquare,
  Settings,
  GraduationCap,
  HelpCircle,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const StudentSidebar = () => {
  const { user, signOut } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-card border-r flex flex-col justify-between">
      <div className="flex flex-col gap-8 p-4">
        <div className="flex items-center gap-2 p-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">AI Tutor</h1>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.user_metadata?.full_name ? getInitials(user.user_metadata.full_name) : "ST"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="text-base font-semibold">{user?.user_metadata?.full_name || "Student"}</h2>
            <p className="text-sm text-muted-foreground">Grade 8</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <NavLink
            to="/dashboard/student"
            end
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </NavLink>
          <NavLink
            to="/dashboard/student/subjects"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-medium">All Subjects</span>
          </NavLink>
          <NavLink
            to="/dashboard/student/achievements"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-medium">Achievements</span>
          </NavLink>
          <NavLink
            to="/dashboard/student/messages"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">Messages</span>
          </NavLink>
          <NavLink
            to="/dashboard/student/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
        </nav>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="bg-primary/10 p-4 rounded-lg text-center">
          <HelpCircle className="h-10 w-10 text-primary mx-auto mb-2" />
          <h3 className="font-semibold mb-1">Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-3">Our AI Tutor is here 24/7</p>
          <Button size="sm" className="w-full">Start Chat</Button>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default StudentSidebar;
