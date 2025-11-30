import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Clock, TrendingUp, Calculator, Microscope, BookOpen, Target, FlaskConical, FileText, Award, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const StudentDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentData, setStudentData] = useState({
    grade: null as number | null,
    schoolName: "",
    lessonsCompleted: 0,
    timeSpent: "0h",
    overallScore: 0,
    mathProgress: 0,
    scienceProgress: 0
  });
  const [todayMicroplan, setTodayMicroplan] = useState<any>(null);
  const [progressSummary, setProgressSummary] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [recommendedTopics, setRecommendedTopics] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [subjectAnalytics, setSubjectAnalytics] = useState<Record<string, any>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

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
              } catch (error) {
                console.error(`Error fetching ${subject} progress:`, error);
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
          console.error("Error fetching subject progress:", error);
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
        } catch (error) {
          console.error("Error fetching achievements:", error);
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
        } catch (error) {
          console.error("Error fetching exam history:", error);
          // Don't show error - exams are optional
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }


  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const handleGenerateMicroplan = async () => {
    if (!user) return;
    
    try {
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
    }
  };

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
              {/* Today's Microplan Card */}
              {todayMicroplan ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Today's Learning Plan
                    </CardTitle>
                    <CardDescription>Your personalized daily microplan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {todayMicroplan.concept_summary && (
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm font-semibold text-primary mb-2">Concept Summary</p>
                        <p className="text-sm">{todayMicroplan.concept_summary.topic_name}</p>
                      </div>
                    )}
                    {todayMicroplan.pyqs && todayMicroplan.pyqs.length > 0 && (
                      <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                        <p className="text-sm font-semibold text-blue-500 mb-2">PYQs ({todayMicroplan.pyqs.length})</p>
                        <p className="text-sm">Practice previous year questions</p>
                      </div>
                    )}
                    {todayMicroplan.hots_question && (
                      <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                        <p className="text-sm font-semibold text-purple-500 mb-2">HOTS Question</p>
                        <p className="text-sm">Challenge yourself with higher-order thinking</p>
                      </div>
                    )}
                    <Button onClick={() => navigate("/dashboard/student/microplan")} className="w-full">
                      View Full Plan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Daily Learning Plan
                    </CardTitle>
                    <CardDescription>Get your personalized microplan for today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleGenerateMicroplan} className="w-full gap-2">
                      <Target className="h-4 w-4" />
                      Generate Today's Plan
                    </Button>
                  </CardContent>
                </Card>
              )}

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
                    const subjectColors: Record<string, string> = {
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
                          className={`flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-md transition-shadow ${
                            topic.isCompleted ? "opacity-60" : ""
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

            {/* Right Column */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-bold mb-4">Recent Achievements</h3>
                {achievements.length > 0 ? (
                  <div className="space-y-4">
                    {achievements.map((achievement, index) => {
                      const getAchievementIcon = (icon?: string) => {
                        if (icon) return <span className="text-2xl">{icon}</span>;
                        // Fallback icons based on achievement type
                        if (achievement.id?.includes("mastery")) return <CheckCircle2 className="h-8 w-8 text-chart-2" />;
                        if (achievement.id?.includes("streak")) return <Clock className="h-8 w-8 text-chart-1" />;
                        return <Target className="h-8 w-8 text-primary" />;
                      };

                      const getAchievementColor = () => {
                        if (achievement.id?.includes("mastery_90")) return "text-chart-2";
                        if (achievement.id?.includes("mastery_80")) return "text-chart-1";
                        if (achievement.id?.includes("streak_30")) return "text-primary";
                        if (achievement.id?.includes("streak_7")) return "text-chart-1";
                        return "text-muted-foreground";
                      };

                      return (
                        <div key={achievement.id || index} className="flex items-center gap-4">
                          <div className={getAchievementColor()}>
                            {getAchievementIcon(achievement.icon)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{achievement.name || "Achievement"}</p>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description || `Earned in ${achievement.subject || "learning"}`}
                            </p>
                            {achievement.earned_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(achievement.earned_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigate("/dashboard/student/achievements")}
                    >
                      View All Achievements
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No achievements yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start learning to earn your first achievement!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
