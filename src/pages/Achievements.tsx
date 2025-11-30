import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Star, 
  Award, 
  Target,
  Zap,
  Flame,
  Crown,
  Medal,
  CheckCircle2,
  Lock,
  Microscope,
  TrendingUp,
  Clock,
  BookOpen,
  BarChart3,
  Brain,
  Timer,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

const Achievements = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [achievementsData, setAchievementsData] = useState<any>(null);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [testHistory, setTestHistory] = useState<any>(null);
  const [progressSummary, setProgressSummary] = useState<any>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;
      
      setLoadingAchievements(true);
      try {
        const data = await api.progress.getAchievements(user.id);
        setAchievementsData(data);
      } catch (error: any) {
        console.error("Error fetching achievements:", error);
        // Only show error if it's not a network/CORS error
        if (error.message && !error.message.includes("Failed to fetch")) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to load achievements",
          });
        }
        // Set empty achievements on error
        setAchievementsData({ total_achievements: 0, achievements: [] });
      } finally {
        setLoadingAchievements(false);
      }
    };

    if (user) {
      fetchAchievements();
    }
  }, [user, toast]);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!user) return;
      
      setLoadingPerformance(true);
      try {
        // Fetch all performance data in parallel
        const [analytics, history, summary] = await Promise.allSettled([
          api.analytics.getStudentAnalytics(user.id),
          api.exam.getHistory({ user_id: user.id, limit: 10 }),
          api.progress.getSummary(user.id)
        ]);

        if (analytics.status === 'fulfilled') {
          setPerformanceData(analytics.value);
        }
        if (history.status === 'fulfilled') {
          setTestHistory(history.value);
        }
        if (summary.status === 'fulfilled') {
          setProgressSummary(summary.value);
        }
      } catch (error: any) {
        console.error("Error fetching performance data:", error);
        // Don't show error toast for performance data, just log it
      } finally {
        setLoadingPerformance(false);
      }
    };

    if (user) {
      fetchPerformanceData();
    }
  }, [user]);

  // Transform API data to match UI format
  const achievements = achievementsData?.achievements?.map((ach: any, index: number) => ({
    id: ach.id || index,
    name: ach.name || ach.achievement_name || "Achievement",
    description: ach.description || `Earned in ${ach.subject || "subject"}`,
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    unlocked: true,
    unlockedDate: ach.earned_at || new Date().toISOString(),
    progress: 100,
    category: ach.category || "General",
    topic: ach.topic_id,
    subject: ach.subject
  })) || [];

  const unlockedCount = achievements.length;
  const totalCount = achievements.length || 0;
  const overallProgress = totalCount > 0 ? 100 : 0;

  // Calculate performance insights
  const avgMastery = performanceData?.avg_mastery_score || 0;
  const totalTime = performanceData?.total_time_minutes || 0;
  const maxStreak = performanceData?.max_streak || 0;
  const testCount = performanceData?.test_count || 0;
  const avgTestScore = performanceData?.avg_test_score || 0;
  const subjects = performanceData?.subjects || {};
  const recentTests = performanceData?.recent_tests || [];

  // Calculate strengths and weaknesses
  const subjectEntries = Object.entries(subjects).map(([subject, data]: [string, any]) => ({
    subject,
    mastery: data.avg_mastery_score || 0,
    topics: data.topics_count || 0,
    time: data.total_time_minutes || 0
  }));

  const strengths = subjectEntries
    .filter(s => s.mastery >= 70)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 3);

  const weaknesses = subjectEntries
    .filter(s => s.mastery < 70 && s.mastery > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading || loadingAchievements) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Achievements</h1>
            <p className="text-muted-foreground">Track your learning milestones and accomplishments</p>
          </div>

          {/* Overall Progress Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>Your achievement collection progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{unlockedCount} / {totalCount}</span>
                  <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}% Complete</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Performance Analysis Section */}
          {!loadingPerformance && (performanceData || testHistory || progressSummary) && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Performance Analysis
              </h2>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Mastery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">{avgMastery.toFixed(1)}%</span>
                    </div>
                    <Progress value={avgMastery} className="mt-2 h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Study Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="text-2xl font-bold">{formatTime(totalTime)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Across {performanceData?.total_topics || 0} topics
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="text-2xl font-bold">{maxStreak} days</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Keep it up!</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Test Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="text-2xl font-bold">{avgTestScore.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {testCount} {testCount === 1 ? 'test' : 'tests'} completed
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Subject Breakdown and Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Subject-wise Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Subject-wise Performance
                    </CardTitle>
                    <CardDescription>Your mastery across different subjects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subjectEntries.length > 0 ? (
                      <div className="space-y-4">
                        {subjectEntries.map((subject) => (
                          <div key={subject.subject} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">{subject.subject}</span>
                              <span className="text-sm text-muted-foreground">
                                {subject.mastery.toFixed(1)}% • {subject.topics} topics
                              </span>
                            </div>
                            <Progress value={subject.mastery} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {formatTime(subject.time)} studied
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No subject data available yet
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Strengths & Weaknesses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Strengths & Areas for Improvement
                    </CardTitle>
                    <CardDescription>Insights based on your performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Strengths */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Strengths
                        </h4>
                        {strengths.length > 0 ? (
                          <div className="space-y-2">
                            {strengths.map((subject) => (
                              <div key={subject.subject} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded">
                                <span className="font-medium capitalize text-sm">{subject.subject}</span>
                                <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30">
                                  {subject.mastery.toFixed(1)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Keep practicing to identify strengths!</p>
                        )}
                      </div>

                      {/* Weaknesses */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          Areas for Improvement
                        </h4>
                        {weaknesses.length > 0 ? (
                          <div className="space-y-2">
                            {weaknesses.map((subject) => (
                              <div key={subject.subject} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                                <span className="font-medium capitalize text-sm">{subject.subject}</span>
                                <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/30">
                                  {subject.mastery.toFixed(1)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No areas identified yet</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Test Performance */}
              {recentTests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5" />
                      Recent Test Performance
                    </CardTitle>
                    <CardDescription>Your last {recentTests.length} test attempts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentTests.slice(0, 5).map((test: any, index: number) => {
                        const score = test.score ? parseFloat(test.score) : 0;
                        const totalMarks = test.total_marks || 100;
                        const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
                        const date = test.end_time || test.created_at || new Date().toISOString();
                        
                        return (
                          <div key={test.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium capitalize">{test.subject || 'Unknown'}</span>
                                <Badge variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "destructive"}>
                                  {percentage.toFixed(1)}%
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{new Date(date).toLocaleDateString()}</span>
                                {test.duration_minutes && (
                                  <span>{test.duration_minutes} min</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{score.toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground">/ {totalMarks}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Achievements Grid */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Unlocked Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {achievements
                .filter(a => a.unlocked)
                .map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <Card key={achievement.id} className="border-2 border-primary/20">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`${achievement.bgColor} p-3 rounded-lg`}>
                            <Icon className={`h-6 w-6 ${achievement.color}`} />
                          </div>
                          <Badge variant="default" className="bg-primary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Unlocked
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-2">{achievement.name}</CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Unlocked on {new Date(achievement.unlockedDate!).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>

          {/* Locked Achievements */}
          <div>
            <h2 className="text-2xl font-bold mb-4">In Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements
                .filter(a => !a.unlocked)
                .map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <Card key={achievement.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`${achievement.bgColor} p-3 rounded-lg opacity-50`}>
                            <Icon className={`h-6 w-6 ${achievement.color}`} />
                          </div>
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-2">{achievement.name}</CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Achievements;

