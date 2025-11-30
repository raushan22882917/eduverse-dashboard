import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TeacherSidebar from "@/components/TeacherSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  TrendingUp,
  Clock,
  Award,
  Loader2,
  ArrowRight,
  BarChart3
} from "lucide-react";

const TeacherDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [dashboardData, setDashboardData] = useState({
    total_students: 0,
    active_students: 0,
    pending_homework: 0,
    recent_quizzes: 0
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      const data = await api.teacher.getDashboard(user?.id || "");
      setDashboardData(data || {
        total_students: 0,
        active_students: 0,
        pending_homework: 0,
        recent_quizzes: 0
      });
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
      });
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Students",
      value: dashboardData.total_students,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      link: "/dashboard/teacher/students"
    },
    {
      title: "Active Students",
      value: dashboardData.active_students,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      link: "/dashboard/teacher/students"
    },
    {
      title: "Pending Homework",
      value: dashboardData.pending_homework,
      icon: ClipboardList,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      link: "/dashboard/teacher/homework/create"
    },
    {
      title: "Recent Quizzes",
      value: dashboardData.recent_quizzes,
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      link: "/dashboard/teacher/quizzes"
    }
  ];

  const quickActions = [
    {
      title: "View Students",
      description: "Manage and view all your students",
      icon: Users,
      link: "/dashboard/teacher/students",
      color: "text-blue-500"
    },
    {
      title: "Student Performance",
      description: "Track student progress and analytics",
      icon: BarChart3,
      link: "/dashboard/teacher/performance",
      color: "text-green-500"
    },
    {
      title: "Create Exam",
      description: "Create a new exam for your students",
      icon: FileText,
      link: "/dashboard/teacher/exams/create",
      color: "text-purple-500"
    },
    {
      title: "Create Homework",
      description: "Assign homework to students",
      icon: ClipboardList,
      link: "/dashboard/teacher/homework/create",
      color: "text-orange-500"
    },
    {
      title: "View Content",
      description: "Browse and view learning content",
      icon: BookOpen,
      link: "/dashboard/teacher/content",
      color: "text-cyan-500"
    },
    {
      title: "Manage Quizzes",
      description: "Create and manage quizzes",
      icon: Award,
      link: "/dashboard/teacher/quizzes",
      color: "text-pink-500"
    }
  ];

  return (
    <div className="flex min-h-screen w-full">
      <TeacherSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <GraduationCap className="h-8 w-8" />
              Teacher Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your students, track progress, and create assignments
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(stat.link)}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      <span>View details</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(action.link)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`${action.color} bg-opacity-10 p-3 rounded-lg`}>
                          <Icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{action.title}</CardTitle>
                          <CardDescription>{action.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>Get started by exploring the features below</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-semibold">Manage Your Students</p>
                      <p className="text-sm text-muted-foreground">
                        View student profiles, track progress, and communicate with students
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/dashboard/teacher/students")}>
                    View Students
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-semibold">Track Performance</p>
                      <p className="text-sm text-muted-foreground">
                        Analyze student performance, identify struggling students, and view detailed analytics
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/dashboard/teacher/performance")}>
                    View Analytics
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="font-semibold">Create Assignments</p>
                      <p className="text-sm text-muted-foreground">
                        Create exams, homework, and quizzes for your students
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/dashboard/teacher/exams/create")}>
                    Create Exam
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
