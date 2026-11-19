import { useAuth, DemoRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, GraduationCap, Users, Shield, LogOut, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DemoModeBanner = () => {
  const { isDemoUser, demoRole, loginAsDemo, exitDemo } = useAuth();
  const navigate = useNavigate();

  if (!isDemoUser) return null;

  const currentRole = demoRole || 'student';

  const roles: { id: DemoRole; label: string; icon: any; path: string }[] = [
    { id: 'student', label: 'Student View', icon: GraduationCap, path: '/dashboard/student' },
    { id: 'teacher', label: 'Teacher View', icon: Users, path: '/dashboard/teacher' },
    { id: 'admin', label: 'Admin View', icon: Shield, path: '/dashboard/admin' },
  ];

  const handleSwitchRole = (role: DemoRole) => {
    loginAsDemo(role);
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-primary/15 to-purple-500/15 border-b border-primary/20 px-4 py-2.5 backdrop-blur-sm sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
          <Badge className="bg-amber-500 text-white font-semibold flex items-center gap-1 shadow-sm px-2.5 py-0.5">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            DEMO ACCESS
          </Badge>
          <span className="text-foreground/90 font-medium">
            You are browsing as a <strong className="text-primary capitalize">{currentRole}</strong> without signing in. Explore all features freely!
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-muted-foreground text-xs hidden lg:inline">Switch Persona:</span>
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = currentRole === r.id;
            return (
              <Button
                key={r.id}
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs gap-1.5 transition-all ${
                  isActive ? "shadow-sm font-semibold" : "hover:bg-primary/10"
                }`}
                onClick={() => handleSwitchRole(r.id)}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{r.label}</span>
              </Button>
            );
          })}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 ml-1"
            onClick={exitDemo}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Exit Demo</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DemoModeBanner;
