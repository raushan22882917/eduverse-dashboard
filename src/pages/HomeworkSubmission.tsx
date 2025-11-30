import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { parseMCQ, hasMultipleMCQs, splitMultipleMCQs } from "@/utils/mcqParser";
import {
  BookOpen,
  Lightbulb,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  FileText
} from "lucide-react";
import "katex/dist/katex.min.css";

const HomeworkSubmission = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [hintLevel, setHintLevel] = useState(1);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [hints, setHints] = useState<Record<number, string>>({});
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && sessionId) {
      fetchSession();
    }
  }, [user, sessionId]);

  const fetchSession = async () => {
    if (!sessionId) return;
    
    try {
      setLoadingSession(true);
      const data = await api.homework.getSession(sessionId);
      setSession(data);
      setAttempts(data.attempts || []);
      setHintLevel((data.hints_revealed || 0) + 1);
      
      // Restore hints from metadata
      let metadata = data.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          metadata = {};
        }
      }
      if (metadata && metadata.hints) {
        // Convert string keys to numbers for proper sorting
        const hintsObj: Record<number, string> = {};
        Object.entries(metadata.hints).forEach(([key, value]) => {
          hintsObj[parseInt(key)] = value as string;
        });
        setHints(hintsObj);
      }
    } catch (error: any) {
      console.error("Error fetching session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load homework",
      });
      navigate("/dashboard/student/homework");
    } finally {
      setLoadingSession(false);
    }
  };

  const handleGetHint = async () => {
    if (!sessionId || loadingAction) return;

    setLoadingAction(true);
    try {
      const result = await api.homework.hint({
        session_id: sessionId,
        hint_level: hintLevel,
      });
      
      // Add hint to hints object
      const hintText = result.hint_text || result.hint || "";
      if (hintText) {
        setHints(prev => ({
          ...prev,
          [hintLevel]: hintText
        }));
      }
      
      toast({
        title: `Hint Level ${hintLevel}`,
        description: "Hint revealed",
      });
      // Refresh session to get updated hints_revealed count and metadata
      fetchSession();
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
    if (!answer.trim() || !sessionId || loadingAction) return;

    setLoadingAction(true);
    try {
      const result = await api.homework.attempt({
        session_id: sessionId,
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

      // Refresh session to get updated data
      await fetchSession();
      setAnswer(""); // Clear answer field
      
      // If completed, show success message
      if (result.is_correct || result.solution_revealed) {
        setTimeout(() => {
          navigate("/dashboard/student/homework");
        }, 2000);
      }
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

  if (loading || loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen w-full">
        <StudentSidebar />
        <main className="flex-1 p-8 overflow-y-auto bg-background">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Homework not found</p>
                <Button onClick={() => navigate("/dashboard/student/homework")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Homework
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const remainingAttempts = 3 - (attempts.length || 0);
  const canSubmit = !session.is_complete && remainingAttempts > 0 && answer.trim().length > 0;

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/student/homework")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Homework
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Submit Homework</h1>
                <p className="text-muted-foreground">
                  Complete and submit your homework assignment
                </p>
              </div>
              <Badge variant={session.is_complete ? "default" : "secondary"} className="gap-1">
                {session.is_complete ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    In Progress
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5" />
                    Question
                  </CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {session.subject}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {(() => {
                  // Check if it's multiple MCQ questions
                  if (hasMultipleMCQs(session.question)) {
                    const mcqs = splitMultipleMCQs(session.question);
                    return (
                      <div className="space-y-6">
                        {mcqs.map((mcq, idx) => (
                          <div key={idx} className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r">
                            {mcq.questionNumber && (
                              <div className="font-semibold text-lg mb-3">Question {mcq.questionNumber}</div>
                            )}
                            <div className="mb-4">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath, remarkGfm]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  p: ({ children }) => <p className="mb-2 text-base leading-relaxed">{children}</p>,
                                  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-3">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-2">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-2">{children}</h3>,
                                }}
                              >
                                {mcq.questionText}
                              </ReactMarkdown>
                            </div>
                            <RadioGroup disabled className="space-y-3">
                              {mcq.options.map((option) => (
                                <div key={option.label} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50">
                                  <RadioGroupItem value={option.label} id={`q${idx}-${option.label}`} className="mt-1" />
                              <Label htmlFor={`q${idx}-${option.label}`} className="font-normal cursor-pointer flex-1">
                                <span className="font-semibold text-primary">({option.label})</span>{" "}
                                <span className="inline">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeKatex]}
                                  >
                                    {option.text}
                                  </ReactMarkdown>
                                </span>
                              </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  // Check if it's a single MCQ
                  const parsed = parseMCQ(session.question);
                  if (parsed.isMCQ) {
                    return (
                      <div className="space-y-4">
                        <div>
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ children }) => <p className="mb-3 text-base leading-relaxed">{children}</p>,
                              h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl font-semibold mb-2 mt-3">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-2">{children}</h3>,
                            }}
                          >
                            {parsed.questionText}
                          </ReactMarkdown>
                        </div>
                        <RadioGroup disabled className="space-y-3">
                          {parsed.options.map((option) => (
                            <div key={option.label} className="flex items-start space-x-3 p-3 rounded hover:bg-muted/50 border">
                              <RadioGroupItem value={option.label} id={`mcq-${option.label}`} className="mt-1" />
                              <Label htmlFor={`mcq-${option.label}`} className="font-normal cursor-pointer flex-1">
                                <span className="font-semibold text-primary">({option.label})</span>{" "}
                                <span className="inline">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeKatex]}
                                  >
                                    {option.text}
                                  </ReactMarkdown>
                                </span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    );
                  }
                  
                  // Regular markdown display
                  return (
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ children }) => <p className="mb-3 text-base leading-relaxed">{children}</p>,
                        h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold mb-2 mt-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-2">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 ml-4">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-4">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        code: ({ children, className }) => {
                          const isInline = !className;
                          if (isInline) {
                            return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
                          }
                          return <code className={className}>{children}</code>;
                        },
                        pre: ({ children }) => <pre className="bg-muted p-3 rounded overflow-x-auto mb-3">{children}</pre>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic my-3">{children}</blockquote>,
                      }}
                    >
                      {session.question}
                    </ReactMarkdown>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Answer Submission Card */}
          {!session.is_complete && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
                <CardDescription>
                  Attempts remaining: {remainingAttempts} / 3
                  {attempts.length > 0 && (
                    <span className="ml-2">
                      • Previous attempts: {attempts.length}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={8}
                  className="text-base"
                  disabled={loadingAction}
                />
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!canSubmit || loadingAction}
                    className="flex-1"
                    size="lg"
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
                    disabled={loadingAction || session.is_complete || hintLevel > 3}
                    size="lg"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Get Hint {hintLevel <= 3 ? `(${hintLevel})` : ""}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hints Display */}
          {Object.keys(hints).length > 0 && (
            <div className="mb-6 space-y-4">
              {Object.entries(hints)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([level, hintText]) => (
                  <Card 
                    key={level} 
                    className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                        <Lightbulb className="h-5 w-5" />
                        Hint Level {level}
                        {parseInt(level) === 3 && (
                          <Badge variant="outline" className="ml-2">Solution</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {hintText}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Previous Attempts */}
          {attempts.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Previous Attempts</CardTitle>
                <CardDescription>Your previous answer submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attempts.map((attempt: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-muted">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium">Attempt {index + 1}</span>
                          {attempt.is_correct ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Incorrect
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mb-2 whitespace-pre-wrap">{attempt.answer}</p>
                        {attempt.feedback && (
                          <p className="text-xs text-muted-foreground italic">
                            Feedback: {attempt.feedback}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Solution (if revealed or completed) */}
          {(session.solution_revealed || session.is_complete) && session.correct_answer && (
            <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {session.correct_answer}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion Message */}
          {session.is_complete && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-semibold text-lg">Homework Completed!</p>
                    <p className="text-sm text-muted-foreground">
                      You have successfully completed this homework assignment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomeworkSubmission;


