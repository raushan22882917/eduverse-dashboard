import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  TrendingUp,
  BookOpen,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    activeUsers: 0,
    completedProfiles: 0,
    totalLessons: 0,
    recentSignups: 0,
    averageMastery: 0,
    completionRate: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      setLoadingStats(true);
      try {
        // Fetch admin dashboard metrics from API
        try {
          const dashboardData = await api.admin.getDashboard();
          if (dashboardData) {
            setStats(prev => ({
              ...prev,
              totalStudents: dashboardData.total_students || 0,
              activeUsers: dashboardData.active_students || 0,
              averageMastery: dashboardData.average_mastery_score || 0,
              completionRate: dashboardData.completion_rate || 0,
            }));
          }
        } catch (error) {
          console.error("Error fetching dashboard metrics:", error);
        }

        // Fetch user roles counts from Supabase
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role");

        if (rolesData) {
          const students = rolesData.filter(r => r.role === 'student').length;
          const teachers = rolesData.filter(r => r.role === 'teacher').length;
          const admins = rolesData.filter(r => r.role === 'admin').length;
          
          setStats(prev => ({
            ...prev,
            totalUsers: rolesData.length,
            totalStudents: students,
            totalTeachers: teachers,
            totalAdmins: admins
          }));
        }

        // Fetch completed profiles
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("profile_completed");

        if (profilesData) {
          const completed = profilesData.filter(p => p.profile_completed).length;
          setStats(prev => ({
            ...prev,
            completedProfiles: completed,
            activeUsers: prev.activeUsers || completed
          }));
        }

        // Fetch recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentProfiles } = await supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", sevenDaysAgo.toISOString());

        if (recentProfiles) {
          setStats(prev => ({
            ...prev,
            recentSignups: recentProfiles.length
          }));
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data",
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, toast]);

  if (loading || loadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }


  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Students",
      value: stats.totalStudents,
      change: "+8%",
      trend: "up",
      icon: GraduationCap,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Teachers",
      value: stats.totalTeachers,
      change: "+3%",
      trend: "up",
      icon: UserCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      change: "+15%",
      trend: "up",
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Completed Profiles",
      value: stats.completedProfiles,
      change: "+22%",
      trend: "up",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Recent Signups",
      value: stats.recentSignups,
      change: "+5",
      trend: "up",
      icon: Clock,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    {
      title: "Avg Mastery",
      value: `${Math.round(stats.averageMastery)}%`,
      change: "+2%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Completion Rate",
      value: `${Math.round(stats.completionRate)}%`,
      change: "+5%",
      trend: "up",
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    }
  ];

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of platform activity and user management</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                        {stat.change}
                      </span>
                      <span className="ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown of users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Students</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.totalUsers > 0 
                            ? Math.round((stats.totalStudents / stats.totalUsers) * 100) 
                            : 0}% of total users
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/10 p-2 rounded-lg">
                        <UserCheck className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-semibold">Teachers</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.totalUsers > 0 
                            ? Math.round((stats.totalTeachers / stats.totalUsers) * 100) 
                            : 0}% of total users
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold">Admins</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.totalUsers > 0 
                            ? Math.round((stats.totalAdmins / stats.totalUsers) * 100) 
                            : 0}% of total users
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalAdmins}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>Recent platform metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-semibold">Profile Completion Rate</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.totalUsers > 0 
                          ? Math.round((stats.completedProfiles / stats.totalUsers) * 100) 
                          : 0}% of users have completed profiles
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-semibold">New Signups (7 days)</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.recentSignups} new users joined this week
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate("/dashboard/admin/users")}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Users className="h-6 w-6 text-primary mb-2" />
                  <p className="font-semibold">Manage Users</p>
                  <p className="text-sm text-muted-foreground">View and edit user accounts</p>
                </button>
                <button
                  onClick={() => navigate("/dashboard/admin/analytics")}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <BookOpen className="h-6 w-6 text-primary mb-2" />
                  <p className="font-semibold">View Analytics</p>
                  <p className="text-sm text-muted-foreground">Platform insights and reports</p>
                </button>
                <button
                  onClick={() => navigate("/dashboard/admin/settings")}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Activity className="h-6 w-6 text-primary mb-2" />
                  <p className="font-semibold">System Settings</p>
                  <p className="text-sm text-muted-foreground">Configure platform settings</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
