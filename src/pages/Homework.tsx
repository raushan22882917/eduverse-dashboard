import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { 
  BookOpen, 
  Lightbulb, 
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

const Homework = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [session, setSession] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [hintLevel, setHintLevel] = useState(1);
  const [loadingAction, setLoadingAction] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    try {
      const data = await api.homework.getSessions({ user_id: user.id, limit: 10 });
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const handleStartSession = async () => {
    if (!question.trim() || !user) return;

    setLoadingAction(true);
    try {
      const result = await api.homework.start({
        user_id: user.id,
        question: question,
        subject: selectedSubject || undefined,
      });
      setSession(result);
      toast({
        title: "Session Started",
        description: "Your homework session is ready!",
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start session",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGetHint = async () => {
    if (!session?.session_id) return;

    setLoadingAction(true);
    try {
      const result = await api.homework.hint({
        session_id: session.session_id,
        hint_level: hintLevel,
      });
      toast({
        title: `Hint Level ${hintLevel}`,
        description: result.hint,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get hint",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !session?.session_id) return;

    setLoadingAction(true);
    try {
      const result = await api.homework.attempt({
        session_id: session.session_id,
        answer: answer,
      });
      
      if (result.is_correct) {
        toast({
          title: "Correct!",
          description: "Great job! Your answer is correct.",
        });
      } else {
        toast({
          variant: "default",
          title: "Try Again",
          description: result.feedback || "Your answer needs improvement.",
        });
      }

      if (result.solution_revealed) {
        toast({
          title: "Solution Revealed",
          description: "Check the solution below.",
        });
      }

      // Refresh session
      const updatedSession = await api.homework.getSession(session.session_id);
      setSession(updatedSession);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit answer",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Homework Assistant</h1>
            <p className="text-muted-foreground">Get step-by-step help with your homework problems</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - New Session */}
            <div className="lg:col-span-2 space-y-6">
              {!session ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Start New Homework Session</CardTitle>
                    <CardDescription>Enter your homework question</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject (Optional)</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select subject</option>
                        <option value="mathematics">Mathematics</option>
                        <option value="physics">Physics</option>
                        <option value="chemistry">Chemistry</option>
                        <option value="biology">Biology</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question</label>
                      <Textarea
                        placeholder="Enter your homework question here..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={8}
                      />
                    </div>
                    <Button 
                      onClick={handleStartSession} 
                      className="w-full"
                      disabled={!question.trim() || loadingAction}
                    >
                      {loadingAction ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Start Session
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Question Display */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Question</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{session.question}</p>
                    </CardContent>
                  </Card>

                  {/* Answer Input */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Answer</CardTitle>
                      <CardDescription>
                        Attempts: {session.attempts || 0} / 3
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Enter your answer..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        rows={6}
                        disabled={session.is_completed}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSubmitAnswer}
                          disabled={!answer.trim() || loadingAction || session.is_completed}
                          className="flex-1"
                        >
                          {loadingAction ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Submit Answer
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleGetHint}
                          disabled={loadingAction || session.is_completed}
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Get Hint ({hintLevel})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Solution (if revealed) */}
                  {session.solution && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          Solution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{session.solution}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Start New Session */}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSession(null);
                      setQuestion("");
                      setAnswer("");
                      setHintLevel(1);
                    }}
                    className="w-full"
                  >
                    Start New Session
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column - Recent Sessions */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent sessions
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => {
                            api.homework.getSession(s.id).then(setSession).catch(console.error);
                          }}
                        >
                          <p className="text-sm font-medium line-clamp-2">{s.question}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {s.is_completed ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                In Progress
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homework;

