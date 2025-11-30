import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { 
  Target, 
  BookOpen, 
  FileText,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Loader2,
  PlayCircle
} from "lucide-react";

const Microplan = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [microplan, setMicroplan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMicroplan();
    }
  }, [user, selectedDate]);

  const fetchMicroplan = async () => {
    if (!user) return;
    
    setLoadingPlan(true);
    try {
      const plan = await api.microplan.getByDate({
        plan_date: selectedDate,
        user_id: user.id,
      });
      setMicroplan(plan);
    } catch (error: any) {
      if (error.status !== 404) {
        console.error("Error fetching microplan:", error);
      }
      setMicroplan(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const plan = await api.microplan.generate({
        user_id: user.id,
        plan_date: selectedDate,
      });
      setMicroplan(plan);
      toast({
        title: "Microplan Generated",
        description: "Your personalized learning plan is ready!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate microplan",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!microplan?.id || !user) return;

    try {
      await api.microplan.markComplete({
        microplan_id: microplan.id,
        user_id: user.id,
      });
      toast({
        title: "Completed!",
        description: "Great job completing today's plan!",
      });
      fetchMicroplan();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark as complete",
      });
    }
  };

  if (loading || loadingPlan) {
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
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Daily Microplan</h1>
              <p className="text-muted-foreground">Your personalized learning plan for today</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {!microplan && (
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Generate Plan
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {microplan ? (
            <div className="space-y-6">
              {/* Plan Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardTitle>
                      <CardDescription>
                        {microplan.is_completed ? (
                          <Badge className="mt-2">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="mt-2">
                            In Progress
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    {!microplan.is_completed && (
                      <Button onClick={handleMarkComplete}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Concept Summary */}
              {microplan.concept_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Concept Summary
                    </CardTitle>
                    <CardDescription>NCERT content to review</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-semibold">{microplan.concept_summary.topic_name}</p>
                      {microplan.concept_summary.summary && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {microplan.concept_summary.summary}
                        </p>
                      )}
                      <Button variant="outline" size="sm" className="mt-2">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Study Concept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PYQs */}
              {microplan.pyqs && microplan.pyqs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      Previous Year Questions ({microplan.pyqs.length})
                    </CardTitle>
                    <CardDescription>Practice with real exam questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {microplan.pyqs.map((pyq: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline">PYQ {pyq.year || 'Previous Year'}</Badge>
                            <Button variant="ghost" size="sm">
                              Attempt
                            </Button>
                          </div>
                          <p className="text-sm line-clamp-2">{pyq.question}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* HOTS Question */}
              {microplan.hots_question && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-purple-500" />
                      HOTS Question
                    </CardTitle>
                    <CardDescription>Higher Order Thinking Skills challenge</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{microplan.hots_question.question}</p>
                      <Button variant="outline" size="sm">
                        Attempt Question
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quiz */}
              {microplan.quiz && microplan.quiz.questions && microplan.quiz.questions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Quick Quiz ({microplan.quiz.questions.length} questions)
                    </CardTitle>
                    <CardDescription>Test your understanding</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {microplan.quiz.questions.map((q: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="text-sm font-medium mb-2">Q{index + 1}: {q.question}</p>
                          <Button variant="ghost" size="sm">View Answer</Button>
                        </div>
                      ))}
                      <Button 
                        className="w-full mt-4"
                        onClick={() => navigate(`/dashboard/student/quiz/start/${microplan.id}`)}
                      >
                        Start Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Microplan Found</h3>
                <p className="text-muted-foreground mb-6">
                  Generate a personalized learning plan for {new Date(selectedDate).toLocaleDateString()}
                </p>
                <Button onClick={handleGenerate} disabled={generating} size="lg">
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Generate Microplan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Microplan;

