import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calculator, 
  Microscope, 
  BookOpen, 
  Target, 
  Brain,
  Calendar,
  Zap,
  Trophy,
  Flame,
  BarChart3,
  Users,
  MessageCircle,
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  Rocket,
  Globe,
  Sun,
  Moon,
  ChevronRight,
  RefreshCw,
  Timer,
  FileText,
  Settings
} from "lucide-react";
import InlineLoader from "@/components/InlineLoader";
import ApiHealthIndicator from "@/components/ApiHealthIndicator";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Lazy load heavy components
const ClassroomSession = lazy(() => import("@/components/ClassroomSession"));
const MathText = lazy(() => import("@/components/MathRenderer").then(module => ({ default: module.MathText })));

// Simple loading component instead of complex InteractiveLoader
const SimpleLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-primary rounded-2xl flex items-center justify-center animate-pulse">
        <Brain className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-primary">Loading Dashboard</h2>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
      </div>
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Simplified state management
  const [studentData, setStudentData] = useState({
    grade: null as number | null,
    schoolName: "",
    lessonsCompleted: 0,
    timeSpent: "0h",
    overallScore: 0,
    mathProgress: 0,
    scienceProgress: 0,
    streak: 0,
    totalPoints: 0,
    rank: 0
  });
  
  const [todayMicroplan, setTodayMicroplan] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  
  // Simplified timer state
  const [studyTimer, setStudyTimer] = useState({ minutes: 0, seconds: 0, isRunning: false });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Simple clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Simple study timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (studyTimer.isRunning) {
      interval = setInterval(() => {
        setStudyTimer(prev => {
          const newSeconds = prev.seconds + 1;
          if (newSeconds >= 60) {
            return { ...prev, minutes: prev.minutes + 1, seconds: 0 };
          }
          return { ...prev, seconds: newSeconds };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [studyTimer.isRunning]);

  // Optimized data fetching - only essential data
  useEffect(() => {
    const fetchEssentialData = async () => {
      if (!user) return;

      try {
        setLoadingData(true);

        // Fetch only essential data in parallel
        const [profileResult, microplanResult] = await Promise.allSettled([
          // Student profile
          supabase
            .from("student_profiles")
            .select("class_grade, school_name")
            .eq("user_id", user.id)
            .limit(1),
          
          // Today's microplan
          api.microplan.getToday(user.id).catch(() => null)
        ]);

        // Handle profile data
        if (profileResult.status === 'fulfilled' && profileResult.value.data?.[0]) {
          const profile = profileResult.value.data[0];
          setStudentData(prev => ({
            ...prev,
            grade: profile.class_grade,
            schoolName: profile.school_name || ""
          }));
        }

        // Handle microplan data
        if (microplanResult.status === 'fulfilled' && microplanResult.value) {
          setTodayMicroplan(microplanResult.value);
        }

        // Fetch progress summary (non-blocking)
        api.progress.getSummary(user.id)
          .then(summary => {
            if (summary) {
              const totalLessons = summary.total_topics_attempted || 0;
              const avgScore = summary.average_mastery || 0;
              const totalTime = summary.total_time_minutes || 0;

              let timeDisplay = "0h";
              if (totalTime > 0) {
                const hours = Math.floor(totalTime / 60);
                const minutes = totalTime % 60;
                timeDisplay = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` : `${minutes}m`;
              }

              const breakdown = summary.subject_breakdown || {};
              const mathProgress = breakdown.mathematics?.average_mastery || 0;
              const scienceProgress = Math.max(
                breakdown.physics?.average_mastery || 0,
                breakdown.chemistry?.average_mastery || 0,
                breakdown.biology?.average_mastery || 0
              );

              setStudentData(prev => ({
                ...prev,
                lessonsCompleted: totalLessons,
                timeSpent: timeDisplay,
                overallScore: Math.round(avgScore),
                mathProgress: Math.round(mathProgress),
                scienceProgress: Math.round(scienceProgress),
                streak: Math.floor(Math.random() * 15) + 1, // Mock data
                totalPoints: totalLessons * 10 + Math.round(avgScore) * 5, // Mock calculation
                rank: Math.floor(Math.random() * 100) + 1 // Mock data
              }));
            }
          })
          .catch(error => console.warn("Progress data unavailable:", error.message));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load some dashboard data",
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchEssentialData();
    }
  }, [user, toast]);

  // Use simple loader instead of complex InteractiveLoader
  if (loading || loadingData) {
    return <SimpleLoader />;
  }

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const handleGenerateMicroplan = async () => {
    if (!user) return;
    try {
      setGeneratingPlan(true);
      const microplan = await api.microplan.generate({ user_id: user.id });
      setTodayMicroplan(microplan);
      toast({
        title: "Microplan Generated",
        description: "Your daily learning plan is ready!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate microplan",
      });
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Helper functions
  const toggleStudyTimer = () => {
    setStudyTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetStudyTimer = () => {
    setStudyTimer({ minutes: 0, seconds: 0, isRunning: false });
  };

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sun className="h-5 w-5 text-yellow-500" />;
    if (hour < 17) return <Sun className="h-5 w-5 text-orange-500" />;
    return <Moon className="h-5 w-5 text-blue-500" />;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Quick actions data
  const quickActions = [
    { title: "Start AI Tutor", icon: Brain, color: "bg-purple-500", action: () => navigate("/dashboard/student/ai-tutor") },
    { title: "Take Quiz", icon: Target, color: "bg-blue-500", action: () => navigate("/dashboard/student/exams") },
    { title: "Interactive Classroom", icon: Users, color: "bg-green-500", action: () => navigate("/dashboard/student/classroom") },
    { title: "View Microplan", icon: Calendar, color: "bg-orange-500", action: () => navigate("/dashboard/student/microplan") }
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <StudentSidebar />

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Simplified Header */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getGreetingIcon()}
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {getGreeting()}, {userName}!
                    </h1>
                  </div>
                  <p className="text-muted-foreground text-lg">Ready to continue your learning journey?</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {currentTime.toLocaleDateString()}
                      </span>
                    </div>
                    {studentData.grade && (
                      <Badge variant="outline" className="text-primary border-primary/30">
                        Grade {studentData.grade}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Study Timer Widget */}
                <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-blue-600">
                          {formatTime(studyTimer.minutes, studyTimer.seconds)}
                        </div>
                        <div className="text-xs text-muted-foreground">Study Timer</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={toggleStudyTimer}
                          className="h-8 w-8 p-0"
                        >
                          {studyTimer.isRunning ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={resetStudyTimer}
                          className="h-8 w-8 p-0"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50 group"
                    onClick={action.action}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="font-medium text-sm">{action.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-2 border-primary/20 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-primary">{studentData.lessonsCompleted}</p>
                      <p className="text-sm text-muted-foreground">Lessons Completed</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-500/20 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-green-500">{studentData.overallScore}%</p>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <Progress value={studentData.overallScore} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-500/20 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-orange-500">{studentData.streak}</p>
                      <p className="text-sm text-muted-foreground">Day Streak</p>
                    </div>
                    <div className="bg-orange-500/10 p-3 rounded-full">
                      <Flame className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-500/20 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-purple-500">{studentData.totalPoints.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Points</p>
                    </div>
                    <div className="bg-purple-500/10 p-3 rounded-full">
                      <Trophy className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Main Content */}
              <div className="xl:col-span-2 space-y-8">
                {/* Today's Microplan */}
                {todayMicroplan ? (
                  <Card className="border-2 border-primary/20 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/20 p-2 rounded-lg">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle>Today's Learning Plan</CardTitle>
                            <CardDescription>Your AI-generated daily microplan</CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <Calendar className="h-3 w-3 mr-1" />
                          Today
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                      {todayMicroplan.concept_summary && (
                        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold text-primary">Concept Summary</p>
                          </div>
                          <p className="text-sm font-medium">{todayMicroplan.concept_summary.topic_name}</p>
                          <Button size="sm" variant="ghost" className="mt-2 text-primary hover:bg-primary/10">
                            <Play className="h-3 w-3 mr-1" />
                            Start Learning
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => navigate("/dashboard/student/microplan")} className="flex-1">
                          View Full Plan
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={handleGenerateMicroplan}
                          disabled={generatingPlan}
                        >
                          <RefreshCw className={`h-4 w-4 ${generatingPlan ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
                    <CardHeader className="text-center">
                      <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>Ready for Today's Challenge?</CardTitle>
                      <CardDescription>Generate your personalized AI-powered learning plan</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Button 
                        onClick={handleGenerateMicroplan} 
                        className="w-full gap-2" 
                        size="lg"
                        disabled={generatingPlan}
                      >
                        {generatingPlan ? (
                          <InlineLoader text="Generating AI Plan..." variant="pulse" />
                        ) : (
                          <>
                            <Rocket className="h-5 w-5" />
                            Generate Today's Plan
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Subject Progress */}
                <Card className="border-2 border-green-500/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="bg-green-500/10 p-2 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle>Subject Progress</CardTitle>
                        <CardDescription>Your learning progress across subjects</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="flex items-center gap-1">
                            <Calculator className="h-4 w-4" />
                            Mathematics
                          </span>
                          <span>{studentData.mathProgress}%</span>
                        </div>
                        <Progress value={studentData.mathProgress} className="h-3" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="flex items-center gap-1">
                            <Microscope className="h-4 w-4" />
                            Science
                          </span>
                          <span>{studentData.scienceProgress}%</span>
                        </div>
                        <Progress value={studentData.scienceProgress} className="h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Math Demo - Lazy loaded */}
                <Card className="border-2 border-blue-500/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Calculator className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle>Mathematical Expressions</CardTitle>
                        <CardDescription>Properly rendered math notation</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<InlineLoader text="Loading math renderer..." />}>
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border">
                          <h4 className="font-semibold mb-3 text-blue-700 dark:text-blue-300">Quadratic Formula</h4>
                          <div className="text-center">
                            <MathText children="$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$" />
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border">
                          <h4 className="font-semibold mb-3 text-green-700 dark:text-green-300">Physics</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Energy:</span>
                              <MathText children="$E = mc^2$" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Suspense>
                  </CardContent>
                </Card>

                {/* Interactive Classroom - Lazy loaded */}
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Interactive Classroom</CardTitle>
                        <CardDescription>Join live sessions and collaborate</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<InlineLoader text="Loading classroom..." />}>
                      <ClassroomSession />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="xl:col-span-1 space-y-6">
                {/* AI Tutor Quick Access */}
                <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-500/20 p-2 rounded-lg">
                        <Brain className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <CardTitle>AI Tutor</CardTitle>
                        <CardDescription>Get instant help with any topic</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium">Ask me anything!</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          "Can you explain quadratic equations?"
                        </p>
                      </div>
                      <Button className="w-full bg-purple-500 hover:bg-purple-600" onClick={() => navigate("/dashboard/student/ai-tutor")}>
                        <Brain className="h-4 w-4 mr-2" />
                        Start AI Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Streak */}
                <Card className="border-2 border-orange-500/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="bg-orange-500/20 p-2 rounded-lg">
                        <Flame className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <CardTitle>Learning Streak</CardTitle>
                        <CardDescription>Keep the momentum going!</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-orange-500">{studentData.streak}</div>
                      <div className="text-sm text-muted-foreground">days in a row</div>
                      <div className="flex justify-center gap-1">
                        {Array.from({ length: 7 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${
                              i < (studentData.streak % 7) ? 'bg-orange-500' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Navigation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Quick Navigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { title: "All Subjects", icon: BookOpen, route: "/dashboard/student/subjects" },
                        { title: "Exams & Tests", icon: FileText, route: "/dashboard/student/exams" },
                        { title: "Focus Timer", icon: Timer, route: "/dashboard/student/focus" },
                        { title: "Settings", icon: Settings, route: "/dashboard/student/settings" }
                      ].map((item, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start gap-2 h-auto p-3"
                          onClick={() => navigate(item.route)}
                        >
                          <item.icon className="h-4 w-4 text-primary" />
                          <span className="text-sm">{item.title}</span>
                          <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* System Status */}
                <ApiHealthIndicator showDetails={false} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;