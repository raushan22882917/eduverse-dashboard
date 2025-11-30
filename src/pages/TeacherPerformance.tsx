import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TeacherSidebar from "@/components/TeacherSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Clock,
  Loader2,
  Target,
  BookOpen
} from "lucide-react";

const TeacherPerformance = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user, selectedSubject]);

  const fetchPerformanceData = async () => {
    try {
      setLoadingData(true);
      // Get all students first
      const students = await api.teacher.getStudents(user?.id || "");
      
      if (!students || students.length === 0) {
        setPerformanceData({
          total_students: 0,
          average_mastery: 0,
          top_performers: [],
          struggling_students: [],
          subject_breakdown: {}
        });
        return;
      }

      // Aggregate performance data
      const studentIds = students.map(s => s.user_id);
      let totalMastery = 0;
      let studentsWithProgress = 0;
      const subjectBreakdown: any = {
        mathematics: { total: 0, count: 0 },
        physics: { total: 0, count: 0 },
        chemistry: { total: 0, count: 0 },
        biology: { total: 0, count: 0 }
      };

      // Fetch progress for each student
      const progressPromises = studentIds.map(async (studentId) => {
        try {
          const progress = await api.progress.getUserProgress({ user_id: studentId });
          return { studentId, progress: progress || [] };
        } catch (error) {
          return { studentId, progress: [] };
        }
      });

      const progressResults = await Promise.all(progressPromises);
      
      const studentPerformance: any[] = [];
      
      progressResults.forEach(({ studentId, progress }) => {
        if (progress.length > 0) {
          studentsWithProgress++;
          let studentTotalMastery = 0;
          let studentMasteryCount = 0;

          progress.forEach((p: any) => {
            const mastery = p.mastery_score || 0;
            studentTotalMastery += mastery;
            studentMasteryCount++;
            
            const subject = p.subject;
            if (subjectBreakdown[subject]) {
              subjectBreakdown[subject].total += mastery;
              subjectBreakdown[subject].count++;
            }
          });

          const avgMastery = studentMasteryCount > 0 ? studentTotalMastery / studentMasteryCount : 0;
          totalMastery += avgMastery;
          
          const student = students.find(s => s.user_id === studentId);
          studentPerformance.push({
            student_id: studentId,
            student_name: student?.profile?.full_name || "Unknown",
            average_mastery: avgMastery,
            progress_count: progress.length
          });
        }
      });

      const averageMastery = studentsWithProgress > 0 ? totalMastery / studentsWithProgress : 0;

      // Sort students
      const sortedStudents = [...studentPerformance].sort((a, b) => b.average_mastery - a.average_mastery);
      const topPerformers = sortedStudents.slice(0, 5);
      const strugglingStudents = sortedStudents.filter(s => s.average_mastery < 50).slice(0, 5);

      // Calculate subject averages
      Object.keys(subjectBreakdown).forEach(subject => {
        const data = subjectBreakdown[subject];
        subjectBreakdown[subject] = data.count > 0 ? data.total / data.count : 0;
      });

      setPerformanceData({
        total_students: students.length,
        students_with_progress: studentsWithProgress,
        average_mastery: averageMastery,
        top_performers: topPerformers,
        struggling_students: strugglingStudents,
        subject_breakdown: subjectBreakdown
      });
    } catch (error: any) {
      console.error("Error fetching performance data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load performance data",
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

  return (
    <div className="flex min-h-screen w-full">
      <TeacherSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Student Performance
            </h1>
            <p className="text-muted-foreground">
              Track and analyze student performance across all subjects
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData?.total_students || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {performanceData?.students_with_progress || 0} with progress data
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Mastery</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData ? Math.round(performanceData.average_mastery) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Across all subjects</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Struggling Students</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.struggling_students?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Below 50% mastery</p>
              </CardContent>
            </Card>
          </div>

          {/* Subject Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Performance by Subject</CardTitle>
              <CardDescription>Average mastery scores across subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["mathematics", "physics", "chemistry", "biology"].map((subject) => (
                  <div key={subject} className="p-4 border rounded-lg">
                    <p className="text-sm font-medium mb-2 capitalize">{subject}</p>
                    <div className="text-2xl font-bold">
                      {performanceData?.subject_breakdown?.[subject]
                        ? Math.round(performanceData.subject_breakdown[subject])
                        : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Top Performers
              </CardTitle>
              <CardDescription>Students with highest mastery scores</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData?.top_performers?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No performance data available</p>
              ) : (
                <div className="space-y-3">
                  {performanceData?.top_performers?.map((student: any, index: number) => (
                    <div key={student.student_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{student.student_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.progress_count} topics completed
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="text-lg px-3 py-1">
                        {Math.round(student.average_mastery)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Struggling Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Students Needing Attention
              </CardTitle>
              <CardDescription>Students with mastery below 50%</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData?.struggling_students?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Great! No students are struggling currently.
                </p>
              ) : (
                <div className="space-y-3">
                  {performanceData?.struggling_students?.map((student: any) => (
                    <div key={student.student_id} className="flex items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold">{student.student_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.progress_count} topics completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-lg px-3 py-1">
                          {Math.round(student.average_mastery)}%
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/dashboard/teacher/students/${student.student_id}/performance`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherPerformance;

