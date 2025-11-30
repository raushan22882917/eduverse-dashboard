import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, AlertCircle, Loader2, CheckCircle2, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useExamSecurity } from "@/hooks/use-exam-security";

interface QuizQuestion {
  id?: string;
  question: string;
  correct_answer?: string;
  marks?: number;
  options?: string[];
}

interface QuizSession {
  id: string;
  user_id: string;
  microplan_id?: string;
  quiz_data: {
    title?: string;
    questions: QuizQuestion[];
  };
  subject: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  total_marks?: number;
  score?: number;
  answers: Record<string, { answer: string; timestamp: string }>;
  is_completed: boolean;
}

const QuizTest = () => {
  const { microplanId } = useParams<{ microplanId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<Set<string>>(new Set());
  const [fullscreenWarningCountdown, setFullscreenWarningCountdown] = useState<number | null>(null);
  const [questionsHidden, setQuestionsHidden] = useState(false);

  // Enable exam security (disable when quiz is completed)
  const { violations, totalViolations, isFullscreen } = useExamSecurity(
    (violation) => {
      // Log violations to backend (optional)
      console.warn("Security violation detected:", violation);
      
      // If fullscreen violation, start countdown
      if (violation.type === "fullscreen") {
        setQuestionsHidden(true);
        setFullscreenWarningCountdown(10);
      }
    },
    !session?.is_completed // Disable security when quiz is completed
  );

  // Handle fullscreen violation countdown
  useEffect(() => {
    if (fullscreenWarningCountdown === null) return;

    // If user returns to fullscreen, cancel countdown
    if (isFullscreen && fullscreenWarningCountdown > 0) {
      setFullscreenWarningCountdown(null);
      setQuestionsHidden(false);
      toast({
        title: "Fullscreen Restored",
        description: "You have returned to fullscreen mode. You can continue the quiz.",
      });
      return;
    }

    // If countdown reaches 0, auto-submit
    if (fullscreenWarningCountdown === 0) {
      setFullscreenWarningCountdown(null);
      handleSubmit(true); // Auto-submit
      return;
    }

    // Decrease countdown every second
    const timer = setTimeout(() => {
      setFullscreenWarningCountdown(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreenWarningCountdown, isFullscreen]);

  useEffect(() => {
    if (!user || !microplanId) {
      navigate("/login");
      return;
    }
    
    initializeQuiz();
  }, [user, microplanId]);

  useEffect(() => {
    if (!session || session.is_completed) return;

    const timer = setInterval(() => {
      const startTime = new Date(session.start_time).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const duration = (session.duration_minutes || 0) * 60;
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeRemaining(remaining);
      
      // Auto-submit when time runs out
      if (remaining === 0 && !autoSubmitting) {
        setAutoSubmitting(true);
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session, autoSubmitting]);

  const initializeQuiz = async () => {
    try {
      setLoading(true);
      
      // Fetch microplan to get quiz data
      const microplan = await api.microplan.getMicroplan(microplanId!);
      
      if (!microplan.quiz_data || !microplan.quiz_data.questions || microplan.quiz_data.questions.length === 0) {
        toast({
          title: "Error",
          description: "No quiz found in this microplan",
          variant: "destructive",
        });
        navigate("/dashboard/student/microplan");
        return;
      }
      
      // Start quiz session
      const sessionData = await api.quiz.startSession({
        user_id: user!.id,
        microplan_id: microplanId!,
        quiz_data: microplan.quiz_data,
        subject: microplan.subject,
      });
      
      setSession(sessionData);
      
      // Initialize time remaining
      const duration = sessionData.duration_minutes || (microplan.quiz_data.questions.length * 2);
      setTimeRemaining(duration * 60);
      
      // Load existing answers if any
      if (sessionData.answers) {
        const existingAnswers: Record<string, string> = {};
        Object.keys(sessionData.answers).forEach(key => {
          existingAnswers[key] = sessionData.answers[key].answer || "";
        });
        setAnswers(existingAnswers);
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start quiz",
        variant: "destructive",
      });
      navigate("/dashboard/student/microplan");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setSavedAnswers(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId); // Remove from saved set when answer changes
      return newSet;
    });
  };

  const handleSaveAnswer = async (questionId: string) => {
    if (!session || !user) return;
    
    try {
      await api.quiz.saveAnswer({
        session_id: session.id,
        user_id: user.id,
        answer: {
          question_id: questionId,
          answer: answers[questionId] || "",
          timestamp: new Date().toISOString(),
        },
      });
      
      setSavedAnswers(prev => new Set(prev).add(questionId));
      
      toast({
        title: "Answer saved",
        description: "Your answer has been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save answer",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!session || !user) return;
    
    try {
      setSubmitting(true);
      
      // Save all answers before submitting
      for (const [questionId, answer] of Object.entries(answers)) {
        if (answer.trim()) {
          await api.quiz.saveAnswer({
            session_id: session.id,
            user_id: user.id,
            answer: {
              question_id: questionId,
              answer: answer,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
      
      // Submit quiz
      const result = await api.quiz.submitQuiz({
        session_id: session.id,
        user_id: user.id,
      });
      
      // Update session state to mark as completed
      setSession({ ...session, ...result, is_completed: true });
      
      // Exit fullscreen
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } catch (error) {
        console.warn("Failed to exit fullscreen:", error);
      }
      
      // Show success dialog
      setShowSuccessDialog(true);
      setShowSubmitDialog(false);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit quiz",
        variant: "destructive",
      });
      setShowSuccessDialog(false);
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (!session) return "text-foreground";
    const totalSeconds = (session.duration_minutes || 0) * 60;
    const percentage = (timeRemaining / totalSeconds) * 100;
    
    if (percentage <= 10) return "text-red-500";
    if (percentage <= 25) return "text-orange-500";
    return "text-foreground";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const questions = session.quiz_data?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(id => answers[id]?.trim()).length;
  const questionId = currentQuestion.id || `q${currentQuestionIndex}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {session.quiz_data?.title || "Quick Quiz"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">
                  {answeredCount}/{questions.length} Answered
                </span>
              </div>
              
              {totalViolations > 0 && (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Violations: {totalViolations}
                  </span>
                </div>
              )}
              
              <div className={`flex items-center gap-2 ${getTimeColor()}`}>
                <Clock className="h-5 w-5" />
                <span className="text-lg font-bold font-mono">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <Button
                variant="destructive"
                onClick={() => setShowSubmitDialog(true)}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Quiz"
                )}
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </div>
      </div>

      {/* Fullscreen Violation Warning */}
      {questionsHidden && fullscreenWarningCountdown !== null && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-6 w-6" />
                Fullscreen Mode Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You have exited fullscreen mode. Please return to fullscreen immediately to continue the quiz.
              </p>
              
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-8 w-8 text-red-500 animate-pulse" />
                <span className="text-4xl font-bold text-red-500 font-mono">
                  {fullscreenWarningCountdown}
                </span>
                <span className="text-lg text-muted-foreground">seconds</span>
              </div>
              
              <p className="text-sm text-center text-muted-foreground">
                {fullscreenWarningCountdown > 0 
                  ? `Quiz will be automatically submitted in ${fullscreenWarningCountdown} second${fullscreenWarningCountdown !== 1 ? 's' : ''} if you don't return to fullscreen.`
                  : "Submitting quiz..."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Question Content */}
      {!questionsHidden && (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              {currentQuestion.marks && (
                <span className="text-sm font-medium text-muted-foreground">
                  {currentQuestion.marks} marks
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-base whitespace-pre-wrap">{currentQuestion.question}</p>
            </div>
            
            {/* Show options if MCQ */}
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium mb-2 block">Select Answer</label>
                {currentQuestion.options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant={answers[questionId] === option ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleAnswerChange(questionId, option)}
                  >
                    {String.fromCharCode(65 + idx)}) {option}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Text answer input */}
            {(!currentQuestion.options || currentQuestion.options.length === 0) && (
              <div>
                <label className="text-sm font-medium mb-2 block">Your Answer</label>
                <Textarea
                  value={answers[questionId] || ""}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                  onCopy={(e) => {
                    e.preventDefault();
                    toast({
                      variant: "destructive",
                      title: "Security Warning",
                      description: "Copying is disabled during the quiz.",
                    });
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    toast({
                      variant: "destructive",
                      title: "Security Warning",
                      description: "Pasting is disabled during the quiz.",
                    });
                  }}
                  placeholder="Type your answer here..."
                  className="min-h-[200px] resize-none"
                />
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleSaveAnswer(questionId)}
                disabled={!answers[questionId]?.trim()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Answer
              </Button>
              
              {savedAnswers.has(questionId) && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2 flex-wrap justify-center">
            {questions.map((_, index) => {
              const qId = questions[index].id || `q${index}`;
              return (
                <Button
                  key={index}
                  variant={index === currentQuestionIndex ? "default" : "outline"}
                  size="sm"
                  className={`w-10 h-10 ${
                    answers[qId]?.trim()
                      ? "border-green-500"
                      : ""
                  }`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
          
          <Button
            onClick={() => setCurrentQuestionIndex(prev => 
              Math.min(questions.length - 1, prev + 1)
            )}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Next
          </Button>
        </div>
      </div>
      )}

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={() => {}}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {autoSubmitting ? "Time's Up!" : "Quiz Submitted Successfully"}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              {autoSubmitting 
                ? "Your quiz has been automatically submitted. Your answers have been saved and will be evaluated."
                : "Your quiz has been submitted successfully. Your answers have been saved and will be evaluated. You can view your results now."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setShowSuccessDialog(false);
                navigate(`/dashboard/student/quiz/results/${session.id}`);
              }}
              className="w-full"
            >
              View Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Are you sure you want to submit your quiz?</p>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    You have answered {answeredCount} out of {questions.length} questions
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Once submitted, you cannot change your answers.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit(false)}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuizTest;






