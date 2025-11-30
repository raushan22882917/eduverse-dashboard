import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TeacherSidebar from "@/components/TeacherSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Users,
  TrendingUp
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TeacherExamSubmissions = () => {
  const { examSetId } = useParams<{ examSetId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [examSet, setExamSet] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && examSetId) {
      fetchExamSet();
      fetchSubmissions();
    }
  }, [user, examSetId]);

  const fetchExamSet = async () => {
    try {
      const data = await api.exam.getSet(examSetId!);
      setExamSet(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch exam set",
      });
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoadingData(true);
      
      // Get teacher's students
      const students = await api.teacher.getStudents(user?.id || "");
      const studentIds = students.map(s => s.user_id);

      if (studentIds.length === 0) {
        setSubmissions([]);
        return;
      }

      // Get test sessions for this exam set
      // Note: exam_set_id in test_sessions might be stored as the exam set identifier string
      let { data, error } = await supabase
        .from("test_sessions")
        .select("*")
        .eq("exam_set_id", examSetId)
        .in("user_id", studentIds)
        .order("created_at", { ascending: false });
      
      // If no results, try filtering by subject (some sessions might not have exam_set_id set)
      if ((!data || data.length === 0) && examSet) {
        const { data: allSessions, error: allError } = await supabase
          .from("test_sessions")
          .select("*")
          .eq("subject", examSet.subject)
          .in("user_id", studentIds)
          .order("created_at", { ascending: false });
        
        if (!allError && allSessions && allSessions.length > 0) {
          data = allSessions;
        }
      }

      if (error) throw error;

      // Get student names and enrich data
      const submissionsWithNames = await Promise.all(
        (data || []).map(async (session) => {
          const student = students.find(s => s.user_id === session.user_id);
          return {
            ...session,
            student_name: student?.profile?.full_name || "Unknown",
            student_grade: student?.class_grade || null
          };
        })
      );

      setSubmissions(submissionsWithNames);
    } catch (error: any) {
      console.error("Error fetching submissions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch exam submissions",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleViewDetails = (submission: any) => {
    setSelectedSubmission(submission);
    setShowDetails(true);
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      mathematics: "bg-blue-500",
      physics: "bg-purple-500",
      chemistry: "bg-green-500",
      biology: "bg-orange-500",
    };
    return colors[subject] || "bg-gray-500";
  };

  const calculatePercentage = (score: number | null, total: number | null) => {
    if (!score || !total) return 0;
    return Math.round((score / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const averageScore = submissions.length > 0
    ? submissions
        .filter(s => s.is_completed && s.score !== null)
        .reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.is_completed && s.score !== null).length
    : 0;

  const completedCount = submissions.filter(s => s.is_completed).length;

  return (
    <div className="flex min-h-screen w-full">
      <TeacherSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/teacher/view-content")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content
            </Button>
            <h1 className="text-3xl font-bold mb-2">Exam Submissions</h1>
            {examSet && (
              <p className="text-muted-foreground">
                {examSet.subject.charAt(0).toUpperCase() + examSet.subject.slice(1)} {examSet.year} - Student Submissions
              </p>
            )}
          </div>

          {/* Statistics */}
          {submissions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Average Score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {averageScore > 0 ? `${averageScore.toFixed(1)}%` : "N/A"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Completion Rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {submissions.length > 0 ? Math.round((completedCount / submissions.length) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
              <CardDescription>View all student submissions for this exam</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions found for this exam
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.student_name}</TableCell>
                        <TableCell>
                          {submission.student_grade ? `Grade ${submission.student_grade}` : "-"}
                        </TableCell>
                        <TableCell>
                          {submission.is_completed && submission.score !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {submission.score} / {submission.total_marks}
                              </span>
                              <Badge variant="outline">
                                {calculatePercentage(submission.score, submission.total_marks)}%
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.is_completed ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              In Progress
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(submission)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Submission Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.student_name}'s exam submission
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Student</p>
                  <p className="text-lg font-semibold">{selectedSubmission.student_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Score</p>
                  <p className="text-lg font-semibold">
                    {selectedSubmission.is_completed && selectedSubmission.score !== null
                      ? `${selectedSubmission.score} / ${selectedSubmission.total_marks} (${calculatePercentage(selectedSubmission.score, selectedSubmission.total_marks)}%)`
                      : "Not completed"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Started</p>
                  <p className="text-sm">{new Date(selectedSubmission.start_time).toLocaleString()}</p>
                </div>
                {selectedSubmission.end_time && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-sm">{new Date(selectedSubmission.end_time).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {selectedSubmission.answers && Object.keys(selectedSubmission.answers).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Answers</p>
                  <div className="space-y-2">
                    {Object.entries(selectedSubmission.answers).map(([questionId, answer]: [string, any]) => (
                      <Card key={questionId}>
                        <CardContent className="p-4">
                          <p className="text-sm font-medium mb-1">Question {questionId}</p>
                          <p className="text-sm">{answer.answer || answer}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherExamSubmissions;

