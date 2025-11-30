import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TeacherSidebar from "@/components/TeacherSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  FileQuestion,
  ArrowLeft,
  Loader2,
  Clock,
  BookOpen,
  Edit,
  CheckCircle2,
  XCircle
} from "lucide-react";

const TeacherQuizDetail = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && quizId) {
      fetchQuiz();
    }
  }, [user, quizId]);

  const fetchQuiz = async () => {
    try {
      setLoadingQuiz(true);
      const quizData = await api.teacher.getQuiz(quizId!, user?.id || "");
      setQuiz(quizData);
    } catch (error: any) {
      console.error("Error fetching quiz:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch quiz",
      });
      navigate("/dashboard/teacher/quizzes");
    } finally {
      setLoadingQuiz(false);
    }
  };

  if (loading || loadingQuiz) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  const questions = quiz.quiz_data?.questions || [];

  return (
    <div className="flex min-h-screen w-full">
      <TeacherSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/teacher/quizzes")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <FileQuestion className="h-8 w-8" />
                  {quiz.title}
                </h1>
                <p className="text-muted-foreground">
                  {quiz.description || "No description provided"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/teacher/quizzes/edit/${quiz.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Quiz
            </Button>
          </div>

          {/* Quiz Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Subject</p>
                  <Badge variant="outline" className="capitalize">
                    {quiz.subject}
                  </Badge>
                </div>
                {quiz.class_grade && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Class Grade</p>
                    <Badge variant="outline">
                      Grade {quiz.class_grade}
                    </Badge>
                  </div>
                )}
                {quiz.duration_minutes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{quiz.duration_minutes} minutes</span>
                    </div>
                  </div>
                )}
                {quiz.total_marks && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Marks</p>
                    <span className="font-medium">{quiz.total_marks} marks</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Status:</p>
                {quiz.is_active ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Created: {new Date(quiz.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions ({questions.length})</CardTitle>
                  <CardDescription>
                    Total marks: {quiz.total_marks || questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No questions in this quiz</p>
                </div>
              ) : (
                questions.map((question: any, index: number) => (
                  <Card key={question.id || index} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          <Badge variant="secondary">{question.marks || 0} marks</Badge>
                          <Badge>{question.question_type || "short_answer"}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Question:</p>
                        <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                          {question.question || "No question text"}
                        </p>
                      </div>
                      
                      {question.question_type === "mcq" && question.options && question.options.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Options:</p>
                          <div className="space-y-2">
                            {question.options.map((option: string, optIndex: number) => (
                              <div
                                key={optIndex}
                                className={`p-2 rounded border ${
                                  option === question.correct_answer
                                    ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                    : "bg-muted"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <span className="text-sm">{option}</span>
                                  {option === question.correct_answer && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {question.correct_answer && (
                        <div>
                          <p className="text-sm font-medium mb-2">Correct Answer:</p>
                          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm whitespace-pre-wrap">{question.correct_answer}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/teacher/quizzes")}
            >
              Back to Quizzes
            </Button>
            <Button
              onClick={() => navigate(`/dashboard/teacher/quizzes/edit/${quiz.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Quiz
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherQuizDetail;



