import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { ExamSet, TestSession } from "@/types/exam";
import { useToast } from "@/hooks/use-toast";

const ExamTest = () => {
  const { examSetId } = useParams<{ examSetId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [examSet, setExamSet] = useState<ExamSet | null>(null);
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !examSetId) {
      navigate("/login");
      return;
    }
    
    initializeExam();
  }, [user, examSetId]);

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

  const initializeExam = async () => {
    try {
      setLoading(true);
      
      // Fetch exam set
      const examData = await api.exam.getSet(examSetId!);
      setExamSet(examData);
      
      // Start test session
      const sessionData = await api.exam.startSession({
        user_id: user!.id,
        exam_set_id: examSetId!,
        subject: examData.subject,
      });
      
      setSession(sessionData);
      
      // Initialize time remaining
      const duration = sessionData.duration_minutes * 60;
      setTimeRemaining(duration);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start exam",
        variant: "destructive",
      });
      navigate("/dashboard/student/exams");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSaveAnswer = async (questionId: string) => {
    if (!session || !user) return;
    
    try {
      await api.exam.saveAnswer({
        session_id: session.id,
        user_id: user.id,
        answer: {
          question_id: questionId,
          answer: answers[questionId] || "",
          timestamp: new Date().toISOString(),
        },
      });
      
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
          await api.exam.saveAnswer({
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
      
      // Submit test
      await api.exam.submitTest({
        session_id: session.id,
        user_id: user.id,
      });
      
      if (autoSubmit) {
        toast({
          title: "Time's up!",
          description: "Your exam has been automatically submitted",
        });
      } else {
        toast({
          title: "Exam submitted",
          description: "Your answers have been submitted for evaluation",
        });
      }
      
      // Navigate to results
      navigate(`/dashboard/student/exam/results/${session.id}`);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit exam",
        variant: "destructive",
      });
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

  if (!examSet || !session) {
    return null;
  }

  const currentQuestion = examSet.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examSet.questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(id => answers[id]?.trim()).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {examSet.subject.charAt(0).toUpperCase() + examSet.subject.slice(1)} {examSet.year}
              </h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {examSet.questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">
                  {answeredCount}/{examSet.questions.length} Answered
                </span>
              </div>
              
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
                  "Submit Exam"
                )}
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              <span className="text-sm font-medium text-muted-foreground">
                {currentQuestion.marks} marks
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-base whitespace-pre-wrap">{currentQuestion.question}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Your Answer</label>
              <Textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[200px] resize-none"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleSaveAnswer(currentQuestion.id)}
                disabled={!answers[currentQuestion.id]?.trim()}
              >
                Save Answer
              </Button>
              
              {answers[currentQuestion.id]?.trim() && (
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
            {examSet.questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                size="sm"
                className={`w-10 h-10 ${
                  answers[examSet.questions[index].id]?.trim()
                    ? "border-green-500"
                    : ""
                }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          
          <Button
            onClick={() => setCurrentQuestionIndex(prev => 
              Math.min(examSet.questions.length - 1, prev + 1)
            )}
            disabled={currentQuestionIndex === examSet.questions.length - 1}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Are you sure you want to submit your exam?</p>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    You have answered {answeredCount} out of {examSet.questions.length} questions
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

export default ExamTest;
