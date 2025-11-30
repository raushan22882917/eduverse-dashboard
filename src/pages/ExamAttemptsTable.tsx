import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, Loader2, Home, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { PerformanceTrend, Subject, TestResult } from "@/types/exam";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AttemptWithDetails extends TestResult {
  examSetId?: string;
  subject?: Subject;
  date?: string;
}

const ExamAttemptsTable = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | "all">("all");
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAttempts();
    }
  }, [user, selectedSubject]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const params: any = { user_id: user!.id };
      
      if (selectedSubject !== "all") {
        params.subject = selectedSubject;
      }
      
      const performanceTrend: PerformanceTrend = await api.exam.getHistory(params);
      
      // Fetch detailed results for each attempt
      const attemptsWithDetails = await Promise.all(
        performanceTrend.test_sessions.map(async (session) => {
          try {
            const details = await api.exam.getResults(session.session_id, user!.id);
            return {
              ...details,
              examSetId: session.session_id,
              subject: session.subject,
              date: session.date,
            } as AttemptWithDetails;
          } catch (error) {
            console.error(`Failed to fetch details for session ${session.session_id}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null results and sort by date (newest first)
      const validAttempts = attemptsWithDetails
        .filter((attempt): attempt is AttemptWithDetails => attempt !== null)
        .sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      
      setAttempts(validAttempts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch exam attempts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubjectColor = (subject: Subject) => {
    const colors = {
      mathematics: "bg-blue-500",
      physics: "bg-purple-500",
      chemistry: "bg-green-500",
      biology: "bg-orange-500",
    };
    return colors[subject] || "bg-gray-500";
  };

  const getSubjectLabel = (subject: Subject) => {
    return subject.charAt(0).toUpperCase() + subject.slice(1);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  // Get all unique question IDs across all attempts
  const getAllQuestionIds = () => {
    const questionIds = new Set<string>();
    attempts.forEach(attempt => {
      attempt.question_results.forEach(result => {
        questionIds.add(result.question_id);
      });
    });
    return Array.from(questionIds);
  };

  // Get question details for a specific attempt
  const getQuestionResult = (attempt: AttemptWithDetails, questionId: string) => {
    return attempt.question_results.find(r => r.question_id === questionId);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allQuestionIds = attempts.length > 0 ? getAllQuestionIds() : [];

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/student/exams")}
              className="mb-4"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
            <h1 className="text-3xl font-bold mb-2">All Exam Attempts</h1>
            <p className="text-muted-foreground">
              Detailed table view of all your exam attempts with question-wise marks
            </p>
          </div>

          {/* Filters and View Mode */}
          <div className="flex items-center gap-4 mb-6">
            <Select
              value={selectedSubject}
              onValueChange={(value) => setSelectedSubject(value as Subject | "all")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("cards")}
              >
                Card View
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                Table View
              </Button>
            </div>
          </div>

          {attempts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No exam attempts found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start taking exams to see your attempts here
                </p>
                <Button onClick={() => navigate("/dashboard/student/exams")}>
                  Browse Exams
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "table" ? (
            <Card>
              <CardHeader>
                <CardTitle>All Attempts - Question-wise Marks</CardTitle>
                <CardDescription>
                  Comprehensive table showing all attempts with question marks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10">Question</TableHead>
                        {attempts.map((attempt, idx) => (
                          <TableHead key={attempt.session_id} className="text-center min-w-[150px]">
                            <div className="flex flex-col items-center">
                              <Badge className={`${getSubjectColor(attempt.subject!)} text-white mb-1`}>
                                {getSubjectLabel(attempt.subject!)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                #{attempts.length - idx}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {attempt.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allQuestionIds.map((questionId, qIdx) => {
                        // Get question text from first attempt that has it
                        const firstResult = attempts
                          .flatMap(a => a.question_results)
                          .find(r => r.question_id === questionId);
                        
                        return (
                          <TableRow key={questionId}>
                            <TableCell className="sticky left-0 bg-background z-10 font-medium">
                              <div className="max-w-[300px]">
                                <p className="text-sm font-semibold mb-1">Q{qIdx + 1}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {firstResult?.question || "Question"}
                                </p>
                              </div>
                            </TableCell>
                            {attempts.map((attempt) => {
                              const result = getQuestionResult(attempt, questionId);
                              if (!result) {
                                return (
                                  <TableCell key={attempt.session_id} className="text-center">
                                    <span className="text-muted-foreground text-xs">-</span>
                                  </TableCell>
                                );
                              }
                              return (
                                <TableCell key={attempt.session_id} className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <Badge
                                      variant={result.is_correct ? "default" : result.marks_awarded > 0 ? "secondary" : "destructive"}
                                      className="text-xs"
                                    >
                                      {result.marks_awarded.toFixed(1)}/{result.max_marks}
                                    </Badge>
                                    {result.is_correct ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : result.marks_awarded > 0 ? (
                                      <div className="h-4 w-4 rounded-full bg-yellow-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                      {/* Summary Row */}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell className="sticky left-0 bg-muted/50 z-10">Total Score</TableCell>
                        {attempts.map((attempt) => (
                          <TableCell key={attempt.session_id} className="text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-lg font-bold ${getGradeColor(attempt.percentage)}`}>
                                {attempt.score.toFixed(1)}/{attempt.total_marks}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {attempt.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {attempts.map((attempt, attemptIndex) => (
                <Card key={attempt.session_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={`${getSubjectColor(attempt.subject!)} text-white`}>
                          {getSubjectLabel(attempt.subject!)}
                        </Badge>
                        <div>
                          <CardTitle className="text-lg">
                            Attempt #{attempts.length - attemptIndex}
                          </CardTitle>
                          <CardDescription>
                            {attempt.date && format(new Date(attempt.date), "MMM dd, yyyy 'at' hh:mm a")}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getGradeColor(attempt.percentage)}`}>
                            {attempt.percentage.toFixed(1)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {attempt.score.toFixed(1)}/{attempt.total_marks} marks
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedAttempt(
                            expandedAttempt === attempt.session_id ? null : attempt.session_id
                          )}
                        >
                          {expandedAttempt === attempt.session_id ? "Collapse" : "Expand"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedAttempt === attempt.session_id && (
                    <CardContent>
                      <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 gap-4 pb-4 border-b">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {attempt.correct_answers}
                            </p>
                            <p className="text-sm text-muted-foreground">Correct</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">
                              {attempt.marking_rubric.partially_correct || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Partial</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">
                              {attempt.marking_rubric.incorrect || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Incorrect</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <p className="text-2xl font-bold">
                                {attempt.time_taken_minutes}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">Minutes</p>
                          </div>
                        </div>

                        {/* Questions Table */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead className="min-w-[300px]">Question</TableHead>
                                <TableHead className="w-[150px]">Your Answer</TableHead>
                                <TableHead className="w-[100px] text-center">Marks</TableHead>
                                <TableHead className="w-[100px] text-center">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {attempt.question_results.map((result, index) => (
                                <TableRow key={result.question_id}>
                                  <TableCell className="font-medium">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell>
                                    <div className="max-w-[400px]">
                                      <p className="text-sm line-clamp-2">
                                        {result.question}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="max-w-[200px]">
                                      <p className="text-sm line-clamp-2 text-muted-foreground">
                                        {result.student_answer || (
                                          <span className="italic text-muted-foreground">
                                            No answer
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge
                                      variant={result.is_correct ? "default" : "destructive"}
                                      className="font-semibold"
                                    >
                                      {result.marks_awarded.toFixed(1)}/{result.max_marks}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {result.is_correct ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                    ) : result.marks_awarded > 0 ? (
                                      <div className="flex items-center justify-center">
                                        <div className="h-5 w-5 rounded-full bg-yellow-500 mx-auto" />
                                      </div>
                                    ) : (
                                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* View Details Button */}
                        <div className="flex justify-end pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/dashboard/student/exam/results/${attempt.session_id}`)}
                          >
                            View Full Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamAttemptsTable;

