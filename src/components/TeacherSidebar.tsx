import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  BookOpen,
  FileText,
  ClipboardList,
  Bell,
  Settings,
  GraduationCap,
  LogOut,
  User,
  FileQuestion,
  Plus,
  Eye,
  Award,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const TeacherSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      if (!user) return;

      try {
        // First get the teacher profile with school_id
        // Use a simple query to avoid recursion issues
        const { data: teacherProfile, error: profileError } = await supabase
          .from("teacher_profiles")
          .select("school_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          // If there's a recursion error, just skip fetching school name
          if (profileError.code === '42P17' || profileError.message?.includes('infinite recursion')) {
            console.warn("Skipping school name fetch due to policy recursion:", profileError);
            return;
          }
          console.error("Error fetching teacher profile:", profileError);
          return;
        }

        // If teacher has a school_id, try to fetch the school name
        if (teacherProfile?.school_id) {
          const { data: school, error: schoolError } = await supabase
            .from("schools")
            .select("name")
            .eq("id", teacherProfile.school_id)
            .maybeSingle();

          if (schoolError) {
            // If it's a recursion error, just skip it silently
            if (schoolError.code === '42P17' || schoolError.message?.includes('infinite recursion')) {
              console.warn("Skipping school name due to policy recursion");
              return;
            }
            console.error("Error fetching school:", schoolError);
            return;
          }

          if (school?.name) {
            setSchoolName(school.name);
          }
        }
      } catch (error: any) {
        // Handle recursion errors gracefully
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.warn("Skipping teacher profile fetch due to policy recursion");
        } else {
          console.error("Error fetching teacher profile:", error);
        }
      }
    };

    fetchTeacherProfile();
  }, [user]);

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
                {user?.user_metadata?.full_name ? getInitials(user.user_metadata.full_name) : "TE"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h2 className="text-base font-semibold">{user?.user_metadata?.full_name || "Teacher"}</h2>
              <p className="text-sm text-muted-foreground">
                {schoolName || "Teacher"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">

        <nav className="flex flex-col gap-2">
          <NavLink
            to="/dashboard/teacher"
            end
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/students"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">My Students</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/performance"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm font-medium">Performance</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/content"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Eye className="h-5 w-5" />
            <span className="text-sm font-medium">View Content</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/create"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Create Exam / Homework</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/view-content"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">View Created Content</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/quizzes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <FileQuestion className="h-5 w-5" />
            <span className="text-sm font-medium">Manage Quizzes</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/tools"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Award className="h-5 w-5" />
            <span className="text-sm font-medium">AI Tools</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/ai-tutor-monitoring"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Bot className="h-5 w-5" />
            <span className="text-sm font-medium">AI Tutor Monitoring</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Bell className="h-5 w-5" />
            <span className="text-sm font-medium">Notifications</span>
          </NavLink>
          <NavLink
            to="/profile-setup"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">Profile</span>
          </NavLink>
          <NavLink
            to="/dashboard/teacher/settings"
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

export default TeacherSidebar;

