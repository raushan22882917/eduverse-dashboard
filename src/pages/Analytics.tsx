import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Users, 
  BookOpen,
  Activity,
  BarChart3,
  Calendar,
  GraduationCap
} from "lucide-react";

const Analytics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    activeUsers: 0,
    profileCompletionRate: 0,
    studentsByGrade: {} as Record<number, number>,
    signupsOverTime: [] as { date: string; count: number }[]
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all profiles
      const { data: profiles } = await supabase.from("profiles").select("*");
      // Fetch all roles
      const { data: roles } = await supabase.from("user_roles").select("*");
      // Fetch student profiles
      const { data: studentProfiles } = await supabase
        .from("student_profiles")
        .select("class_grade, created_at");

      if (profiles && roles && studentProfiles) {
        const totalUsers = profiles.length;
        const completedProfiles = profiles.filter(p => p.profile_completed).length;
        const profileCompletionRate = totalUsers > 0 
          ? Math.round((completedProfiles / totalUsers) * 100) 
          : 0;

        // Calculate new users this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newUsersThisMonth = profiles.filter(
          p => new Date(p.created_at) >= startOfMonth
        ).length;

        // Students by grade
        const studentsByGrade: Record<number, number> = {};
        studentProfiles.forEach(sp => {
          studentsByGrade[sp.class_grade] = (studentsByGrade[sp.class_grade] || 0) + 1;
        });

        // Signups over time (last 7 days)
        const signupsOverTime: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const count = profiles.filter(
            p => p.created_at.startsWith(dateStr)
          ).length;
          signupsOverTime.push({ date: dateStr, count });
        }

        setAnalytics({
          totalUsers,
          newUsersThisMonth,
          activeUsers: completedProfiles,
          profileCompletionRate,
          studentsByGrade,
          signupsOverTime
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">Platform insights and performance metrics</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.newUsersThisMonth} new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.profileCompletionRate}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.profileCompletionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalUsers - analytics.activeUsers} incomplete
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Signups</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.newUsersThisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Students by Grade */}
            <Card>
              <CardHeader>
                <CardTitle>Students by Grade</CardTitle>
                <CardDescription>Distribution of students across grades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.studentsByGrade)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([grade, count]) => {
                      const maxCount = Math.max(...Object.values(analytics.studentsByGrade));
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={grade} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Grade {grade}</span>
                            <span className="text-muted-foreground">{count} students</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {Object.keys(analytics.studentsByGrade).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No student data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Signups Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Signups Over Time</CardTitle>
                <CardDescription>New user registrations (last 7 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.signupsOverTime.map((item, index) => {
                    const maxCount = Math.max(...analytics.signupsOverTime.map(s => s.count), 1);
                    const percentage = (item.count / maxCount) * 100;
                    const date = new Date(item.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{dayName}</span>
                          <span className="text-muted-foreground">{item.count} signups</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-chart-1 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>Summary of platform activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <GraduationCap className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{analytics.activeUsers}</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{analytics.profileCompletionRate}%</p>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;

