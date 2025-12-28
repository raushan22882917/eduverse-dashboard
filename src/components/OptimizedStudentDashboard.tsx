import { memo, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calculator, 
  Microscope, 
  BookOpen, 
  Target, 
  Brain,
  Trophy,
  Flame,
  BarChart3
} from "lucide-react";
import { useApiCache } from "@/hooks/useApiCache";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";

interface StudentStats {
  grade: number | null;
  schoolName: string;
  lessonsCompleted: number;
  timeSpent: string;
  overallScore: number;
  mathProgress: number;
  scienceProgress: number;
  streak: number;
  totalPoints: number;
  rank: number;
}

const StatCard = memo(({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: number;
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {trend && (
          <>
            <TrendingUp className="h-3 w-3" />
            +{trend}% from last week
          </>
        )}
        {description}
      </p>
    </CardContent>
  </Card>
));

const ProgressCard = memo(({ 
  subject, 
  progress, 
  icon: Icon, 
  color 
}: {
  subject: string;
  progress: number;
  icon: any;
  color: string;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <CardTitle className="text-base">{subject}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <Progress value={progress} className="mb-2" />
      <p className="text-sm text-muted-foreground">{progress}% Complete</p>
    </CardContent>
  </Card>
));

const OptimizedStudentDashboard = memo(() => {
  const { user } = useAuth();

  // Optimized data fetching with caching
  const { data: studentProfile } = useApiCache(
    `student-profile-${user?.id}`,
    async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("student_profiles")
        .select("class_grade, school_name")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      return data;
    },
    { ttl: 10 * 60 * 1000, staleWhileRevalidate: true } // 10 minutes cache
  );

  const { data: todayMicroplan } = useApiCache(
    `microplan-today-${user?.id}`,
    async () => {
      if (!user) return null;
      return api.microplan.getToday(user.id).catch(() => null);
    },
    { ttl: 5 * 60 * 1000, staleWhileRevalidate: true } // 5 minutes cache
  );

  const { data: progressData } = useApiCache(
    `progress-${user?.id}`,
    async () => {
      if (!user) return null;
      return api.progress.getOverview(user.id).catch(() => ({
        lessonsCompleted: 0,
        timeSpent: "0h",
        overallScore: 0,
        mathProgress: 0,
        scienceProgress: 0,
        streak: 0,
        totalPoints: 0,
        rank: 0
      }));
    },
    { ttl: 2 * 60 * 1000, staleWhileRevalidate: true } // 2 minutes cache
  );

  // Memoized student stats
  const studentStats = useMemo((): StudentStats => ({
    grade: studentProfile?.class_grade || null,
    schoolName: studentProfile?.school_name || "",
    lessonsCompleted: progressData?.lessonsCompleted || 0,
    timeSpent: progressData?.timeSpent || "0h",
    overallScore: progressData?.overallScore || 0,
    mathProgress: progressData?.mathProgress || 0,
    scienceProgress: progressData?.scienceProgress || 0,
    streak: progressData?.streak || 0,
    totalPoints: progressData?.totalPoints || 0,
    rank: progressData?.rank || 0
  }), [studentProfile, progressData]);

  // Memoized greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">
          {greeting}, {user.user_metadata?.full_name || user.email}!
        </h1>
        <p className="text-muted-foreground">
          {studentStats.grade && `Grade ${studentStats.grade} • `}
          {studentStats.schoolName || "Ready to learn today?"}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Lessons Completed"
          value={studentStats.lessonsCompleted}
          description="This week"
          icon={CheckCircle2}
          trend={12}
        />
        <StatCard
          title="Study Time"
          value={studentStats.timeSpent}
          description="Total time"
          icon={Clock}
        />
        <StatCard
          title="Overall Score"
          value={`${studentStats.overallScore}%`}
          description="Average performance"
          icon={Target}
          trend={5}
        />
        <StatCard
          title="Current Streak"
          value={`${studentStats.streak} days`}
          description="Keep it up!"
          icon={Flame}
        />
      </div>

      {/* Subject Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProgressCard
          subject="Mathematics"
          progress={studentStats.mathProgress}
          icon={Calculator}
          color="text-blue-600"
        />
        <ProgressCard
          subject="Science"
          progress={studentStats.scienceProgress}
          icon={Microscope}
          color="text-green-600"
        />
      </div>

      {/* Today's Plan */}
      {todayMicroplan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Today's Learning Plan
            </CardTitle>
            <CardDescription>
              Personalized plan based on your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayMicroplan.tasks?.slice(0, 3).map((task: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <Badge variant="outline">{task.duration}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(studentStats.totalPoints / 100)}</div>
            <p className="text-sm text-muted-foreground">Badges earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Class Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{studentStats.rank || "N/A"}</div>
            <p className="text-sm text-muted-foreground">In your class</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentStats.totalPoints.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Learning points</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

OptimizedStudentDashboard.displayName = "OptimizedStudentDashboard";

export default OptimizedStudentDashboard;