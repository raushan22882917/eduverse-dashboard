import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Bell,
  Settings,
  GraduationCap,
  HelpCircle,
  LogOut,
  User,
  FileText,
  Target,
  Bot,
  Upload,
  Sparkles,
  FileDown,
  FileQuestion
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const StudentSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [classGrade, setClassGrade] = useState<number | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) return;

      try {
        const { data: studentProfile, error } = await supabase
          .from("student_profiles")
          .select("class_grade")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          // Handle 406 error specifically
          if (error.code === 'PGRST406' || error.message?.includes('406')) {
            // Fallback: try without .maybeSingle()
            const { data: fallbackData } = await supabase
              .from("student_profiles")
              .select("class_grade")
              .eq("user_id", user.id)
              .limit(1);
            
            if (fallbackData && fallbackData.length > 0 && fallbackData[0].class_grade) {
              setClassGrade(fallbackData[0].class_grade);
            }
            return;
          }
          
          if (error.code !== "PGRST116") {
            console.error("Error fetching student profile:", error);
            return;
          }
        }

        if (studentProfile?.class_grade) {
          setClassGrade(studentProfile.class_grade);
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
      }
    };

    fetchStudentProfile();
  }, [user]);

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
            <p className="text-sm text-muted-foreground">
              {classGrade ? `Grade ${classGrade}` : "Student"}
            </p>
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
            to="/dashboard/student/ai-tutor"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Bot className="h-5 w-5" />
            <span className="text-sm font-medium">AI Tutor & Chat</span>
          </NavLink>
          <NavLink
            to="/dashboard/student/classroom"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-medium">Classroom</span>
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
            to="/dashboard/student/content/downloads"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <FileDown className="h-5 w-5" />
            <span className="text-sm font-medium">Download Content</span>
          </NavLink>
          <NavLink
            to="/dashboard/student/upload-content"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Practice PYQ</span>
          </NavLink>
          <NavLink
            to="/dashboard/student/exams"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">Practice Exams</span>
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
            to="/dashboard/student/microplan"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <Target className="h-5 w-5" />
            <span className="text-sm font-medium">Microplan</span>
          </NavLink>
          <NavLink
            to="/dashboard/student/homework"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            activeClassName="bg-primary/20 text-primary hover:bg-primary/30"
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-sm font-medium">Homework</span>
          </NavLink>
          <NavLink
            to="/dashboard/student/notifications"
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
            <span className="text-sm font-medium">Profile Setup</span>
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
          <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/student/chat')}>
            Start Chat
          </Button>
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
