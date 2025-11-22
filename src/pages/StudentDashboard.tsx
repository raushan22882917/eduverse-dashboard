import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Clock, TrendingUp, Calculator, Microscope } from "lucide-react";

const StudentDashboard = () => {
  const { user, loading } = useAuth();
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

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Good morning, {userName}!</h1>
            <p className="text-muted-foreground">Ready to continue your learning journey?</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Up Next Card */}
              <div className="flex items-stretch justify-between gap-6 rounded-lg bg-card p-6 border">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-primary text-sm font-medium">UP NEXT</p>
                    <p className="text-xl font-bold">Algebra - Chapter 3</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dive into solving linear equations and master the basics.
                    </p>
                  </div>
                  <Button className="w-fit gap-2">
                    <span>Start Lesson</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="hidden sm:flex items-center justify-center w-48 bg-primary/10 rounded-lg">
                  <Calculator className="h-20 w-20 text-primary" />
                </div>
              </div>

              {/* Progress Overview */}
              <h2 className="text-xl font-bold">Progress Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border">
                  <div className="flex justify-between items-center">
                    <p className="text-base font-medium">Math Progress</p>
                    <p className="text-primary text-sm font-semibold">75%</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border">
                  <div className="flex justify-between items-center">
                    <p className="text-base font-medium">Science Progress</p>
                    <p className="text-chart-1 text-sm font-semibold">60%</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-chart-1 h-2.5 rounded-full" style={{ width: "60%" }}></div>
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-card p-4 rounded-lg border flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">42</p>
                    <p className="text-sm text-muted-foreground">Lessons Done</p>
                  </div>
                </div>
                <div className="bg-card p-4 rounded-lg border flex items-center gap-4">
                  <div className="bg-chart-1/20 p-3 rounded-full">
                    <Clock className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">12h</p>
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                  </div>
                </div>
                <div className="bg-card p-4 rounded-lg border flex items-center gap-4">
                  <div className="bg-chart-2/20 p-3 rounded-full">
                    <TrendingUp className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">89%</p>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                </div>
              </div>

              {/* Lesson Plan */}
              <h2 className="text-xl font-bold pt-4">Personalized Lesson Plan</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Calculator className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Geometry - Angles</p>
                      <p className="text-sm text-muted-foreground">Math</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <span>Start</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="bg-chart-1/10 p-3 rounded-lg">
                      <Microscope className="h-5 w-5 text-chart-1" />
                    </div>
                    <div>
                      <p className="font-semibold">Biology - Cell Structure</p>
                      <p className="text-sm text-muted-foreground">Science</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <span>Start</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">History - Ancient Civilizations</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Done</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-bold mb-4">Recent Achievements</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-chart-2">
                      <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Math Whiz</p>
                      <p className="text-sm text-muted-foreground">Completed 10 math lessons</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-chart-1">
                      <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13.13 22.19L11.5 18.36C13.07 17.78 14.54 17 15.9 16.09L13.13 22.19M5.64 12.5L1.81 10.87L7.91 8.1C7 9.46 6.22 10.93 5.64 12.5M19.22 4C19.5 4 19.75 4 19.96 4.05C20.13 5.44 19.94 8.3 16.66 11.58C14.96 13.29 12.93 14.6 10.65 15.47L8.5 13.37C9.42 11.06 10.73 9.03 12.42 7.34C15.18 4.58 17.64 4 19.22 4M19.22 2C17.24 2 14.24 2.69 11 5.93C8.81 8.12 7.5 10.53 6.65 12.64C6.37 13.39 6.56 14.21 7.11 14.77L9.24 16.89C9.62 17.27 10.13 17.5 10.66 17.5C10.89 17.5 11.13 17.44 11.36 17.35C13.5 16.53 15.88 15.19 18.07 13C23.73 7.34 21.61 2.39 21.61 2.39S20.7 2 19.22 2M14.54 9.46C13.76 8.68 13.76 7.41 14.54 6.63S16.59 5.85 17.37 6.63C18.14 7.41 18.15 8.68 17.37 9.46C16.59 10.24 15.32 10.24 14.54 9.46M8.88 16.53L7.47 15.12L8.88 16.53M6.24 22L9.88 18.36C9.54 18.27 9.21 18.12 8.91 17.91L4.83 22H6.24M2 22H3.41L8.18 17.24L6.76 15.83L2 20.59V22M2 19.17L6.09 15.09C5.88 14.79 5.73 14.47 5.64 14.12L2 17.76V19.17Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Science Explorer</p>
                      <p className="text-sm text-muted-foreground">Mastered biology basics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-primary">
                      <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5H14.5Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Perfect Week</p>
                      <p className="text-sm text-muted-foreground">7-day learning streak</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
