import { useEffect, useState } from "react";
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
  FlaskConical, 
  FileText, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  Sparkles, 
  Eye, 
  Hand, 
  Mic, 
  Box, 
  Brain,
  Calendar,
  Star,
  Zap,
  Trophy,
  Flame,
  BarChart3,
  PieChart,
  Users,
  MessageCircle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Lightbulb,
  Rocket,
  Globe,
  Heart,
  Coffee,
  Sun,
  Moon,
  ChevronRight,
  Plus,
  Minus,
  RefreshCw,
  TrendingDown,
  AlertCircle,
  Info,
  Gift,
  Crown,
  Medal,
  Bookmark,
  Share2,
  Download,
  Upload,
  Settings,
  Bell,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock3,
  Timer,
  Hourglass,
  GraduationCap
} from "lucide-react";
import InteractiveLoader from "@/components/InteractiveLoader";
import InlineLoader from "@/components/InlineLoader";
import ApiHealthIndicator from "@/components/ApiHealthIndicator";
import ClassroomSession from "@/components/ClassroomSession";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const StudentDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enhanced state management
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
    rank: 0,
    weeklyGoal: 5,
    weeklyProgress: 0
  });
  
  // Interactive features state
  const [todayMicroplan, setTodayMicroplan] = useState<any>(null);
  const [progressSummary, setProgressSummary] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [recommendedTopics, setRecommendedTopics] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [subjectAnalytics, setSubjectAnalytics] = useState<Record<string, any>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  
  // New interactive states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studyTimer, setStudyTimer] = useState({ minutes: 0, seconds: 0, isRunning: false });
  const [dailyQuote, setDailyQuote] = useState("");
  const [weatherGreeting, setWeatherGreeting] = useState("");
  const [animatedStats, setAnimatedStats] = useState({
    lessons: 0,
    score: 0,
    streak: 0,
    points: 0
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [quickActions, setQuickActions] = useState([
    { id: 1, title: "Start AI Tutor", icon: Brain, color: "bg-purple-500", action: () => navigate("/dashboard/student/ai-tutor") },
    { id: 2, title: "Take Quiz", icon: Target, color: "bg-blue-500", action: () => navigate("/dashboard/student/quiz") },
    { id: 3, title: "Practice Problems", icon: Calculator, color: "bg-green-500", action: () => navigate("/dashboard/student/practice") },
    { id: 4, title: "Study Groups", icon: Users, color: "bg-orange-500", action: () => navigate("/dashboard/student/groups") }
  ]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Real-time clock and greeting
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set daily quote and weather greeting
    const quotes = [
      "Every expert was once a beginner. Keep learning! 🌟",
      "Success is the sum of small efforts repeated day in and day out. 💪",
      "The only way to learn mathematics is to do mathematics. 📚",
      "Science is not only compatible with spirituality; it is a profound source of spirituality. 🔬",
      "Education is the most powerful weapon you can use to change the world. 🌍"
    ];
    
    const greetings = [
      "Ready to conquer today's challenges?",
      "Let's make today amazing!",
      "Time to unlock your potential!",
      "Your learning journey continues!",
      "Every moment is a learning opportunity!"
    ];

    const hour = new Date().getHours();
    let timeGreeting = "";
    if (hour < 12) timeGreeting = "";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    setDailyQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    setWeatherGreeting(`${timeGreeting}! ${greetings[Math.floor(Math.random() * greetings.length)]}`);

    return () => clearInterval(timer);
  }, []);

  // Animate stats on load
  useEffect(() => {
    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        callback(Math.floor(progress * (end - start) + start));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    if (studentData.lessonsCompleted > 0) {
      setTimeout(() => {
        animateValue(0, studentData.lessonsCompleted, 1500, (value) => 
          setAnimatedStats(prev => ({ ...prev, lessons: value }))
        );
        animateValue(0, studentData.overallScore, 1500, (value) => 
          setAnimatedStats(prev => ({ ...prev, score: value }))
        );
        animateValue(0, studentData.streak, 1500, (value) => 
          setAnimatedStats(prev => ({ ...prev, streak: value }))
        );
        animateValue(0, studentData.totalPoints, 1500, (value) => 
          setAnimatedStats(prev => ({ ...prev, points: value }))
        );
      }, 500);
    }
  }, [studentData.lessonsCompleted, studentData.overallScore, studentData.streak, studentData.totalPoints]);

  
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) return;

      try {
        setLoadingData(true);

        // Fetch student profile
        const { data: studentProfile, error: profileError } = await supabase
          .from("student_profiles")
          .select("class_grade, school_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching student profile:", profileError);
          // If it's a 406 error, try without .single() or .maybeSingle()
          if (profileError.code === 'PGRST406' || profileError.message?.includes('406')) {
            // Fallback: try a different query format
            const { data: fallbackData } = await supabase
              .from("student_profiles")
              .select("class_grade, school_name")
              .eq("user_id", user.id)
              .limit(1);

            if (fallbackData && fallbackData.length > 0) {
              const profile = fallbackData[0];
              setStudentData(prev => ({
                ...prev,
                grade: profile.class_grade,
                schoolName: profile.school_name || ""
              }));
            }
            return;
          }
        }

        if (studentProfile) {
          setStudentData(prev => ({
            ...prev,
            grade: studentProfile.class_grade,
            schoolName: studentProfile.school_name || ""
          }));
        }

        // Fetch progress summary
        try {
          const summary = await api.progress.getSummary(user.id);
          setProgressSummary(summary);

          // Calculate overall stats from summary
          if (summary) {
            const totalLessons = summary.total_topics_attempted || summary.total_topics || 0;
            const avgScore = summary.average_mastery || summary.avg_mastery_score || 0;
            const totalTime = summary.total_time_minutes || 0;

            // Format time: show hours and minutes
            let timeDisplay = "0h";
            if (totalTime > 0) {
              const hours = Math.floor(totalTime / 60);
              const minutes = totalTime % 60;
              if (hours > 0) {
                timeDisplay = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
              } else {
                timeDisplay = `${minutes}m`;
              }
            }

            setStudentData(prev => ({
              ...prev,
              lessonsCompleted: totalLessons,
              timeSpent: timeDisplay,
              overallScore: Math.round(avgScore),
            }));

            // Calculate subject-specific progress and store detailed analytics
            const breakdown = summary.subject_breakdown || summary.subjects || {};
            if (breakdown) {
              const mathProgress = breakdown.mathematics?.average_mastery || breakdown.mathematics?.avg_mastery_score || 0;
              const scienceProgress = breakdown.physics?.average_mastery || breakdown.physics?.avg_mastery_score ||
                breakdown.chemistry?.average_mastery || breakdown.chemistry?.avg_mastery_score ||
                breakdown.biology?.average_mastery || breakdown.biology?.avg_mastery_score || 0;

              setStudentData(prev => ({
                ...prev,
                mathProgress: Math.round(mathProgress),
                scienceProgress: Math.round(scienceProgress),
              }));

              // Store detailed subject analytics
              const analytics: Record<string, any> = {};
              const subjects = ['mathematics', 'physics', 'chemistry', 'biology'];

              subjects.forEach((subject) => {
                const subjectData = breakdown[subject];
                if (subjectData) {
                  analytics[subject] = {
                    averageMastery: Math.round(subjectData.average_mastery || subjectData.avg_mastery_score || 0),
                    topicsAttempted: subjectData.topics_attempted || subjectData.total_topics || 0,
                    totalTopics: subjectData.total_topics || 0,
                    totalTimeMinutes: subjectData.total_time_minutes || 0,
                    questionsAttempted: subjectData.total_questions || subjectData.questions_attempted || 0,
                    correctAnswers: subjectData.correct_answers || 0,
                    completionRate: subjectData.completion_rate || 0,
                  };
                }
              });

              setSubjectAnalytics(analytics);
            }
          }
        } catch (error: any) {
          console.error("Error fetching progress:", error);
          // Don't show error toast - progress is not critical for dashboard load
        }

        // Fetch today's microplan
        try {
          const microplan = await api.microplan.getToday(user.id);
          setTodayMicroplan(microplan);
        } catch (error) {
          console.error("Error fetching microplan:", error);
        }

        // Fetch detailed progress for each subject
        try {
          const subjects = ['mathematics', 'physics', 'chemistry', 'biology'];
          const subjectProgressData = await Promise.all(
            subjects.map(async (subject) => {
              try {
                const progressData = await api.progress.getUserProgress({
                  user_id: user.id,
                  subject: subject as any,
                });

                if (progressData && progressData.length > 0) {
                  const totalQuestions = progressData.reduce((sum: number, p: any) => sum + (p.questions_attempted || 0), 0);
                  const totalCorrect = progressData.reduce((sum: number, p: any) => sum + (p.correct_answers || 0), 0);
                  const totalTime = progressData.reduce((sum: number, p: any) => sum + (p.total_time_minutes || 0), 0);

                  return {
                    subject,
                    topicsCount: progressData.length,
                    totalQuestions,
                    totalCorrect,
                    totalTime,
                  };
                }
                return null;
              } catch (error: any) {
                // Handle errors gracefully - progress data is optional
                if (error.status === 401 || error.status === 500) {
                  // Backend authentication/configuration issue - don't spam console
                  if (error.message?.includes('API key') || error.message?.includes('Invalid API key')) {
                    console.warn(`Progress data unavailable for ${subject}: Backend authentication issue`);
                  } else {
                    console.warn(`Progress data unavailable for ${subject}: Backend service error`);
                  }
                } else {
                  console.warn(`Progress data unavailable for ${subject}: ${error.message}`);
                }
                return null;
              }
            })
          );

          // Update subject analytics with detailed progress data
          setSubjectAnalytics((prev: Record<string, any>) => {
            const updated = { ...prev };
            subjectProgressData.forEach((data) => {
              if (data && data.subject) {
                updated[data.subject] = {
                  ...updated[data.subject],
                  topicsCount: data.topicsCount,
                  totalQuestions: data.totalQuestions,
                  totalCorrect: data.totalCorrect,
                  totalTime: data.totalTime,
                };
              }
            });
            return updated;
          });
        } catch (error) {
          console.warn("Subject progress data unavailable:", error);
        }

        // Fetch recommended topics based on progress
        try {
          const { data: topics, error: topicsError } = await supabase
            .from("topics")
            .select("*")
            .order("order_index", { ascending: true })
            .limit(5);

          if (!topicsError && topics) {
            // Get progress for each topic
            const topicsWithProgress = await Promise.all(
              topics.map(async (topic) => {
                try {
                  const topicProgress = await api.progress.getTopicProgress({
                    user_id: user.id,
                    topic_id: topic.id,
                  });
                  return {
                    ...topic,
                    progress: topicProgress?.mastery_score || 0,
                    isCompleted: (topicProgress?.mastery_score || 0) >= 80,
                  };
                } catch {
                  return {
                    ...topic,
                    progress: 0,
                    isCompleted: false,
                  };
                }
              })
            );
            setRecommendedTopics(topicsWithProgress);
          }
        } catch (error) {
          console.error("Error fetching recommended topics:", error);
        }

        // Fetch achievements
        try {
          const achievementsData = await api.progress.getAchievements(user.id);
          if (achievementsData && achievementsData.achievements) {
            // Sort by earned_at date and take most recent 3
            const recentAchievements = achievementsData.achievements
              .sort((a: any, b: any) => {
                const dateA = a.earned_at ? new Date(a.earned_at).getTime() : 0;
                const dateB = b.earned_at ? new Date(b.earned_at).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, 3);
            setAchievements(recentAchievements);
          }
        } catch (error: any) {
          // Handle errors gracefully - achievements are optional
          if (error.status === 404) {
            console.warn("Achievements endpoint not found - feature may not be available yet");
          } else if (error.status === 500) {
            console.warn("Achievements service temporarily unavailable:", error.message);
          } else {
            console.error("Error fetching achievements:", error);
          }
          // Set empty array to prevent UI errors
          setAchievements([]);
        }

        // Fetch recent exam history
        try {
          const examHistory = await api.exam.getHistory({
            user_id: user.id,
            limit: 5
          });
          if (examHistory && examHistory.test_sessions && Array.isArray(examHistory.test_sessions)) {
            // Sort by date (most recent first) and take up to 3
            const sortedExams = examHistory.test_sessions
              .filter((exam: any) => exam && exam.is_completed !== false) // Only show completed exams
              .sort((a: any, b: any) => {
                const dateA = a.created_at || a.start_time || a.end_time || "";
                const dateB = b.created_at || b.start_time || b.end_time || "";
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              })
              .slice(0, 3);
            setRecentExams(sortedExams);

            // Group exams by subject for analytics
            const examsBySubject: Record<string, any[]> = {};
            sortedExams.forEach((exam: any) => {
              const subject = exam.subject?.toLowerCase();
              if (subject) {
                if (!examsBySubject[subject]) {
                  examsBySubject[subject] = [];
                }
                examsBySubject[subject].push(exam);
              }
            });

            // Update subject analytics with exam data
            setSubjectAnalytics((prev: Record<string, any>) => {
              const updated = { ...prev };
              Object.keys(examsBySubject).forEach((subject) => {
                const exams = examsBySubject[subject];
                const avgScore = exams.reduce((sum, e) => {
                  const score = e.score || 0;
                  const totalMarks = e.total_marks || 100;
                  return sum + (totalMarks > 0 ? (score / totalMarks) * 100 : 0);
                }, 0) / exams.length;

                if (!updated[subject]) {
                  updated[subject] = {};
                }
                updated[subject] = {
                  ...updated[subject],
                  examCount: exams.length,
                  avgExamScore: Math.round(avgScore),
                };
              });
              return updated;
            });
          }
        } catch (error: any) {
          // Handle errors gracefully - exam history is optional
          if (error.status === 404) {
            console.warn("Exam history endpoint not found - feature may not be available yet");
          } else if (error.status === 500) {
            console.warn("Exam history service temporarily unavailable:", error.message);
          } else {
            console.error("Error fetching exam history:", error);
          }
          // Set empty array to prevent UI errors
          setRecentExams([]);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data",
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchStudentData();
    }
  }, [user, toast]);

  if (loading || loadingData) {
    return (
      <InteractiveLoader
        title="Preparing Your Dashboard"
        subtitle="Setting up your personalized learning experience"
        steps={[
          "Loading your profile data...",
          "Fetching progress analytics...",
          "Preparing AI recommendations...",
          "Generating today's microplan...",
          "Loading achievements...",
          "Finalizing dashboard..."
        ]}
        funFacts={[
          "Students using AI tutoring improve scores by 23% on average! 🚀",
          "Personalized learning paths increase retention by 60%! 🧠",
          "Interactive dashboards boost engagement by 75%! 📊",
          "Gamified learning increases motivation by 90%! 🏆",
          "Daily microplans help students stay 40% more consistent! 📅",
          "AI-powered feedback accelerates learning by 50%! ⚡"
        ]}
      />
    );
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

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-500";
    if (streak >= 14) return "text-orange-500";
    if (streak >= 7) return "text-green-500";
    return "text-blue-500";
  };

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header with Real-time Elements */}
          <div className="mb-8 relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {getGreetingIcon()}
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Welcome back, {userName}!
                  </h1>
                </div>
                <p className="text-muted-foreground text-lg">{weatherGreeting}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {currentTime.toLocaleTimeString()} • {currentTime.toLocaleDateString()}
                  </span>
                </div>
              </div>
              
            
            </div>
            
            {/* Daily Quote */}
            <Card className="mt-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-primary animate-pulse" />
                  <p className="text-sm font-medium italic">{dailyQuote}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Bar */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Card 
                  key={action.id} 
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

          {/* Interactive Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Animated Lesson Counter */}
            <Card className="relative overflow-hidden border-2 border-primary/20 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary group-hover:scale-110 transition-transform">
                      {animatedStats.lessons}
                    </p>
                    <p className="text-sm text-muted-foreground">Lessons Completed</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-500">+12% this week</span>
                    </div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-full group-hover:rotate-12 transition-transform">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20">
                  <div 
                    className="h-full bg-primary transition-all duration-1000"
                    style={{ width: `${Math.min((animatedStats.lessons / 50) * 100, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Overall Score with Progress Ring */}
            <Card className="relative overflow-hidden border-2 border-green-500/20 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-500 group-hover:scale-110 transition-transform">
                      {animatedStats.score}%
                    </p>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-yellow-500">Excellent!</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="bg-green-500/10 p-3 rounded-full group-hover:rotate-12 transition-transform">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </div>
                <Progress value={animatedStats.score} className="mt-3" />
              </CardContent>
            </Card>

            {/* Streak Counter with Fire Animation */}
            <Card className="relative overflow-hidden border-2 border-orange-500/20 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-bold group-hover:scale-110 transition-transform ${getStreakColor(animatedStats.streak)}`}>
                      {animatedStats.streak}
                    </p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Flame className="h-3 w-3 text-orange-500 animate-pulse" />
                      <span className="text-xs text-orange-500">Keep it up!</span>
                    </div>
                  </div>
                  <div className="bg-orange-500/10 p-3 rounded-full group-hover:rotate-12 transition-transform">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Next milestone</span>
                    <span>{Math.max(0, (Math.ceil(animatedStats.streak / 7) * 7) - animatedStats.streak)} days</span>
                  </div>
                  <Progress value={(animatedStats.streak % 7) * (100/7)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Points with Trophy */}
            <Card className="relative overflow-hidden border-2 border-purple-500/20 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-purple-500 group-hover:scale-110 transition-transform">
                      {animatedStats.points.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Crown className="h-3 w-3 text-purple-500" />
                      <span className="text-xs text-purple-500">Rank #{studentData.rank || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="bg-purple-500/10 p-3 rounded-full group-hover:rotate-12 transition-transform">
                    <Trophy className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 opacity-10">
                  <Trophy className="h-16 w-16 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Enhanced */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Enhanced Today's Microplan Card */}
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
                      <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 hover:shadow-md transition-shadow">
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
                    {todayMicroplan.pyqs && todayMicroplan.pyqs.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-blue-500/5 to-blue-500/10 rounded-lg border border-blue-500/20 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <p className="text-sm font-semibold text-blue-500">PYQs ({todayMicroplan.pyqs.length})</p>
                        </div>
                        <p className="text-sm">Practice previous year questions</p>
                        <Button size="sm" variant="ghost" className="mt-2 text-blue-500 hover:bg-blue-500/10">
                          <Target className="h-3 w-3 mr-1" />
                          Practice Now
                        </Button>
                      </div>
                    )}
                    {todayMicroplan.hots_question && (
                      <div className="p-4 bg-gradient-to-r from-purple-500/5 to-purple-500/10 rounded-lg border border-purple-500/20 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <p className="text-sm font-semibold text-purple-500">HOTS Challenge</p>
                        </div>
                        <p className="text-sm">Higher-order thinking skills question</p>
                        <Button size="sm" variant="ghost" className="mt-2 text-purple-500 hover:bg-purple-500/10">
                          <Zap className="h-3 w-3 mr-1" />
                          Take Challenge
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => navigate("/dashboard/student/microplan")} className="flex-1 group">
                        View Full Plan
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
                      className="w-full gap-2 group" 
                      size="lg"
                      disabled={generatingPlan}
                    >
                      {generatingPlan ? (
                        <InlineLoader text="Generating AI Plan..." variant="pulse" />
                      ) : (
                        <>
                          <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                          Generate Today's Plan
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                      ✨ Powered by AI • Personalized for you • Updated daily
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Weekly Progress Card */}
              <Card className="border-2 border-green-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-500/10 p-2 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle>Weekly Goal</CardTitle>
                        <CardDescription>Track your learning consistency</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      {studentData.weeklyProgress}/{studentData.weeklyGoal} days
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress this week</span>
                        <span className="font-medium">{Math.round((studentData.weeklyProgress / studentData.weeklyGoal) * 100)}%</span>
                      </div>
                      <Progress value={(studentData.weeklyProgress / studentData.weeklyGoal) * 100} className="h-3" />
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                        <div
                          key={index}
                          className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                            index < studentData.weeklyProgress
                              ? 'bg-green-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Great consistency! Keep it up!</span>
                    </div>
                  </div>
                </CardContent>
              </Card>



              {/* Subject Analysis */}
              <h2 className="text-xl font-bold">Subject Analysis</h2>
              <div className="space-y-4">
                {Object.keys(subjectAnalytics).length > 0 ? (
                  Object.entries(subjectAnalytics).map(([subject, data]: [string, any]) => {
                    const isExpanded = expandedSubjects.has(subject);
                    const subjectIcons: Record<string, any> = {
                      mathematics: Calculator,
                      physics: Microscope,
                      chemistry: FlaskConical,
                      biology: BookOpen,
                    };
                    const subjectColors: Record<string, { bg: string; text: string; border: string; progress: string }> = {
                      mathematics: {
                        bg: "bg-primary/10",
                        text: "text-primary",
                        border: "border-primary/20",
                        progress: "bg-primary",
                      },
                      physics: {
                        bg: "bg-chart-1/10",
                        text: "text-chart-1",
                        border: "border-chart-1/20",
                        progress: "bg-chart-1",
                      },
                      chemistry: {
                        bg: "bg-blue-500/10",
                        text: "text-blue-500",
                        border: "border-blue-500/20",
                        progress: "bg-blue-500",
                      },
                      biology: {
                        bg: "bg-green-500/10",
                        text: "text-green-500",
                        border: "border-green-500/20",
                        progress: "bg-green-500",
                      },
                    };
                    const Icon = subjectIcons[subject] || BookOpen;
                    const colors = subjectColors[subject] || subjectColors.mathematics;
                    const mastery = data.averageMastery || 0;
                    const topicsAttempted = data.topicsAttempted || data.topicsCount || 0;
                    const totalTopics = data.totalTopics || data.topicsCount || topicsAttempted || 0;
                    const timeSpent = data.totalTimeMinutes || data.totalTime || 0;
                    const questionsAttempted = data.questionsAttempted || data.totalQuestions || 0;
                    const correctAnswers = data.correctAnswers || data.totalCorrect || 0;
                    const accuracy = questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0;
                    const examCount = data.examCount || 0;
                    const avgExamScore = data.avgExamScore || 0;

                    const formatTime = (minutes: number) => {
                      if (minutes < 60) return `${minutes}m`;
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                    };

                    return (
                      <Card key={subject} className="overflow-hidden">
                        <CardHeader
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            const newExpanded = new Set(expandedSubjects);
                            if (isExpanded) {
                              newExpanded.delete(subject);
                            } else {
                              newExpanded.add(subject);
                            }
                            setExpandedSubjects(newExpanded);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`${colors.bg} ${colors.border} p-2 rounded-lg border`}>
                                <Icon className={`h-5 w-5 ${colors.text}`} />
                              </div>
                              <div>
                                <CardTitle className="capitalize text-lg">{subject}</CardTitle>
                                <CardDescription>
                                  {topicsAttempted} of {totalTopics} topics attempted
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${colors.text}`}>{mastery}%</p>
                                <p className="text-xs text-muted-foreground">Mastery</p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div className="mt-4 w-full bg-muted rounded-full h-2">
                            <div
                              className={`${colors.progress} h-2 rounded-full transition-all`}
                              style={{ width: `${mastery}%` }}
                            ></div>
                          </div>
                        </CardHeader>
                        {isExpanded && (
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Activity className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Time Spent</p>
                                </div>
                                <p className="text-lg font-semibold">{formatTime(timeSpent)}</p>
                              </div>
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Target className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Questions</p>
                                </div>
                                <p className="text-lg font-semibold">{questionsAttempted}</p>
                              </div>
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Accuracy</p>
                                </div>
                                <p className="text-lg font-semibold">{accuracy}%</p>
                              </div>
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Exams</p>
                                </div>
                                <p className="text-lg font-semibold">
                                  {examCount > 0 ? `${avgExamScore}% avg` : "No exams"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Correct Answers</span>
                                <span className="font-semibold">{correctAnswers} / {questionsAttempted}</span>
                              </div>
                              {examCount > 0 && (
                                <div className="flex items-center justify-between text-sm mt-2">
                                  <span className="text-muted-foreground">Tests Completed</span>
                                  <span className="font-semibold">{examCount} tests</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">Start learning to see your subject analysis</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Student Info */}
              {studentData.grade && (
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Calculator className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Grade {studentData.grade} Student</p>
                      {studentData.schoolName && (
                        <p className="text-sm text-muted-foreground">{studentData.schoolName}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-card p-4 rounded-lg border flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{studentData.lessonsCompleted}</p>
                    <p className="text-sm text-muted-foreground">Lessons Done</p>
                  </div>
                </div>
                <div className="bg-card p-4 rounded-lg border flex items-center gap-4">
                  <div className="bg-chart-1/20 p-3 rounded-full">
                    <Clock className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{studentData.timeSpent}</p>
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                  </div>
                </div>
                <div className="bg-card p-4 rounded-lg border flex items-center gap-4">
                  <div className="bg-chart-2/20 p-3 rounded-full">
                    <TrendingUp className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{studentData.overallScore}%</p>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                </div>
              </div>

              {/* Recommended Topics */}
              {recommendedTopics.length > 0 && (
                <>
                  <h2 className="text-xl font-bold pt-4">Recommended Topics</h2>
                  <div className="flex flex-col gap-3">
                    {recommendedTopics.slice(0, 3).map((topic) => {
                      const subjectIcons: Record<string, any> = {
                        mathematics: Calculator,
                        physics: Microscope,
                        chemistry: FlaskConical,
                        biology: BookOpen,
                      };
                      const Icon = subjectIcons[topic.subject] || BookOpen;
                      const iconColors: Record<string, string> = {
                        mathematics: "bg-primary/10 text-primary",
                        physics: "bg-chart-1/10 text-chart-1",
                        chemistry: "bg-blue-500/10 text-blue-500",
                        biology: "bg-green-500/10 text-green-500",
                      };
                      const iconColor = iconColors[topic.subject] || "bg-muted text-muted-foreground";

                      return (
                        <div
                          key={topic.id}
                          className={`flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-md transition-shadow ${topic.isCompleted ? "opacity-60" : ""
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`${iconColor} p-3 rounded-lg`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className={`font-semibold ${topic.isCompleted ? "text-muted-foreground" : ""}`}>
                                {topic.chapter} - {topic.name}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {topic.subject}
                                {topic.progress > 0 && ` • ${Math.round(topic.progress)}% mastered`}
                              </p>
                            </div>
                          </div>
                          {topic.isCompleted ? (
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Done
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => navigate(`/dashboard/student/classroom?subject=${topic.subject}&chapter=${topic.id}`)}
                            >
                              <span>Start</span>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Recent Exams */}
              {recentExams.length > 0 && (
                <>
                  <h2 className="text-xl font-bold pt-4">Recent Exams</h2>
                  <div className="flex flex-col gap-3">
                    {recentExams.map((exam: any) => {
                      const subjectColors: Record<string, string> = {
                        mathematics: "bg-primary/10 text-primary border-primary/20",
                        physics: "bg-chart-1/10 text-chart-1 border-chart-1/20",
                        chemistry: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        biology: "bg-green-500/10 text-green-500 border-green-500/20",
                      };
                      const subjectColor = subjectColors[exam.subject?.toLowerCase() || ""] || "bg-muted text-muted-foreground border-muted";

                      const score = exam.score || 0;
                      const totalMarks = exam.total_marks || 100;
                      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
                      const examDate = exam.created_at || exam.start_time;

                      return (
                        <div
                          key={exam.id || exam.session_id}
                          className="flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`${subjectColor} p-3 rounded-lg border`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold capitalize">
                                {exam.subject || "Exam"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {examDate ? new Date(examDate).toLocaleDateString() : "Recently"}
                                {percentage > 0 && ` • ${percentage}%`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              if (exam.id || exam.session_id) {
                                navigate(`/dashboard/student/exam-results/${exam.id || exam.session_id}`);
                              } else {
                                navigate("/dashboard/student/exams");
                              }
                            }}
                          >
                            <span>View</span>
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => navigate("/dashboard/student/exams")}
                  >
                    View All Exams
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </div>

            {/* Classroom Session - Full Width */}
            <div className="lg:col-span-3">
              <ClassroomSession />
            </div>
          </div>

          {/* Second Row - Right Column Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2"></div>

            {/* Right Column - Enhanced */}
            <div className="lg:col-span-1 space-y-6">
              {/* Achievements Showcase */}
              <Card className="border-2 border-yellow-500/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  <div className="flex items-center gap-2">
                    <div className="bg-yellow-500/20 p-2 rounded-lg">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Recent Achievements
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                          {achievements.length}
                        </Badge>
                      </CardTitle>
                      <CardDescription>Your latest accomplishments</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {achievements.length > 0 ? (
                    <div className="space-y-4">
                      {achievements.map((achievement, index) => {
                        const getAchievementIcon = (icon?: string) => {
                          if (icon) return <span className="text-2xl">{icon}</span>;
                          if (achievement.id?.includes("mastery")) return <Medal className="h-8 w-8 text-yellow-500" />;
                          if (achievement.id?.includes("streak")) return <Flame className="h-8 w-8 text-orange-500" />;
                          return <Star className="h-8 w-8 text-primary" />;
                        };

                        const getAchievementBg = () => {
                          if (achievement.id?.includes("mastery_90")) return "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20";
                          if (achievement.id?.includes("mastery_80")) return "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20";
                          if (achievement.id?.includes("streak_30")) return "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20";
                          return "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20";
                        };

                        return (
                          <div key={achievement.id || index} className={`p-4 rounded-lg border ${getAchievementBg()} hover:shadow-md transition-all group`}>
                            <div className="flex items-center gap-4">
                              <div className="group-hover:scale-110 transition-transform">
                                {getAchievementIcon(achievement.icon)}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{achievement.name || "Achievement Unlocked!"}</p>
                                <p className="text-sm text-muted-foreground">
                                  {achievement.description || `Earned in ${achievement.subject || "learning"}`}
                                </p>
                                {achievement.earned_at && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(achievement.earned_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <Button
                        variant="outline"
                        className="w-full mt-4 group"
                        onClick={() => navigate("/dashboard/student/achievements")}
                      >
                        View All Achievements
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-muted/50 p-6 rounded-lg">
                        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-2">No achievements yet</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start learning to unlock your first achievement!
                        </p>
                        <Button size="sm" onClick={() => navigate("/dashboard/student/classroom")}>
                          Start Learning
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

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
                    <Button className="w-full bg-purple-500 hover:bg-purple-600 group" onClick={() => navigate("/dashboard/student/ai-tutor")}>
                      <Brain className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                      Start AI Session
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Streak Visualization */}
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
                    <div className="relative">
                      <div className="text-4xl font-bold text-orange-500 animate-pulse">
                        {studentData.streak || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">days in a row</div>
                    </div>
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
                    <div className="text-xs text-muted-foreground">
                      {studentData.streak >= 7 ? "Amazing streak! 🔥" : `${7 - (studentData.streak % 7)} days to next milestone`}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Time Today</span>
                      <span className="font-medium">{formatTime(studyTimer.minutes, studyTimer.seconds)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">This Week</span>
                      <span className="font-medium">{studentData.timeSpent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rank</span>
                      <Badge variant="outline">#{studentData.rank || 'N/A'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              {/* <ApiHealthIndicator showDetails={true} /> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
