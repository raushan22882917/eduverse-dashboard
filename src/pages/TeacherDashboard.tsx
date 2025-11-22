import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap } from "lucide-react";

const TeacherDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="w-64 flex-shrink-0 bg-card border-r p-4">
        <div className="flex items-center gap-2 mb-8">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">AI Tutor</h1>
        </div>
        <Button onClick={signOut} variant="outline" className="w-full">
          Sign Out
        </Button>
      </aside>
      
      <main className="flex-1 p-8 bg-background">
        <div className="max-w-4xl mx-auto text-center py-20">
          <Users className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Teacher Dashboard</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Coming Soon! Manage your classes, track student progress, and create assignments.
          </p>
          <div className="bg-card p-8 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">Features in Development:</h2>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span>Class management and student roster</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span>Assignment creation and grading</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span>Student progress analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span>Communication tools</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
