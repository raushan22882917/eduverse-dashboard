import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Clock, TrendingUp, Award, Loader2, Home } from "lucide-react";
import { api } from "@/lib/api";
import { TestResult } from "@/types/exam";
import { useToast } from "@/hooks/use-toast";

const ExamResults = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [results, setResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !sessionId) {
      navigate("/login");
      return;
    }
    
    fetchResults();
  }, [user, sessionId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await api.exam.getResults(sessionId!, user!.id);
      setResults(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch results",
        variant: "destructive",
      });
      navigate("/dashboard/student/exams");
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: "A+", color: "text-green-600" };
    if (percentage >= 80) return { grade: "A", color: "text-green-500" };
    if (percentage >= 70) return { grade: "B+", color: "text-blue-500" };
    if (percentage >= 60) return { grade: "B", color: "text-blue-400" };
    if (percentage >= 50) return { grade: "C", color: "text-yellow-500" };
    return { grade: "D", color: "text-red-500" };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const { grade, color } = getGrade(results.percentage);

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold mb-2">Exam Results</h1>
            <p className="text-muted-foreground">
              Detailed breakdown of your performance
            </p>
          </div>

          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-4xl font-bold">
                      {results.score.toFixed(1)}/{results.total_marks}
                    </p>
                    <p className="text-muted-foreground">Total Marks</p>
                  </div>
                  <div className={`text-5xl font-bold ${color}`}>
                    {grade}
                  </div>
                </div>
                <Progress value={results.percentage} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {results.percentage.toFixed(1)}% Score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    {results.correct_answers}/{results.total_questions}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Correct Answers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time Taken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {results.time_taken_minutes}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Minutes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
              <CardDescription>
                Analysis of your answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-500">
                      {results.marking_rubric.correct_answers}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-yellow-500">
                      {results.marking_rubric.partially_correct}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Partial</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">
                      {results.marking_rubric.incorrect}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>{results.marking_rubric.evaluation_method}</span>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Tabs defaultValue="answers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="answers">Your Answers</TabsTrigger>
              <TabsTrigger value="solutions">Model Solutions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="answers" className="space-y-4 mt-6">
              {results.question_results.map((result, index) => (
                <Card key={result.question_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">Question {index + 1}</span>
                          <Badge variant={result.is_correct ? "default" : "destructive"}>
                            {result.marks_awarded.toFixed(1)}/{result.max_marks} marks
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {result.question}
                        </p>
                      </div>
                      {result.is_correct ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Your Answer:</p>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm whitespace-pre-wrap">
                            {result.student_answer || (
                              <span className="text-muted-foreground italic">
                                No answer provided
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="solutions" className="space-y-4 mt-6">
              {results.model_answers.map((answer, index) => (
                <Card key={answer.question_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">Question {index + 1}</span>
                          <Badge variant="outline">{answer.marks} marks</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {answer.question}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm font-medium mb-1">Model Answer:</p>
                      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md border border-green-200 dark:border-green-800">
                        <p className="text-sm whitespace-pre-wrap">
                          {answer.model_answer}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <Button onClick={() => navigate("/dashboard/student/exams")}>
              Take Another Exam
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/dashboard/student/exam/history")}
            >
              View History
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamResults;
