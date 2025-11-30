import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2,
  CheckCircle2,
  FileCheck,
  Lightbulb,
  TrendingUp,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  detailedAnalysis: string;
}

type Subject = "mathematics" | "physics" | "chemistry" | "biology";

const UserContentUpload = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  // Subject and chapter selection
  const [selectedSubject, setSelectedSubject] = useState<Subject | "">("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [chapters, setChapters] = useState<string[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingPYQContent, setLoadingPYQContent] = useState(false);
  
  // Questions state
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [referenceContent, setReferenceContent] = useState("");
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  // Answer evaluation state
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [savedEvaluations, setSavedEvaluations] = useState<any[]>([]);

  // Fetch chapters when subject is selected
  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedSubject) {
        setChapters([]);
        setSelectedChapter("");
        return;
      }

      setLoadingChapters(true);
      try {
        const { data, error } = await supabase
          .from("topics")
          .select("chapter")
          .eq("subject", selectedSubject)
          .order("chapter", { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          const uniqueChapters = Array.from(new Set((data || []).map((t: any) => t.chapter as string).filter((ch: string) => ch && ch.trim()))).sort() as string[];
          setChapters(uniqueChapters);
        } else {
          // Try content table as fallback
          const { data: contentData } = await supabase
            .from("content")
            .select("chapter")
            .eq("subject", selectedSubject)
            .not("chapter", "is", null);
          
          if (contentData && contentData.length > 0) {
            const contentChapters = Array.from(new Set((contentData || []).map((c: any) => c.chapter as string).filter((ch: string) => ch && ch.trim()))).sort() as string[];
            if (contentChapters.length > 0) {
              setChapters(contentChapters);
            }
          }
        }
      } catch (error: any) {
        console.error("Error fetching chapters:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load chapters",
        });
      } finally {
        setLoadingChapters(false);
      }
    };

    fetchChapters();
  }, [selectedSubject, toast]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Track time per question
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= 0) {
      const now = Date.now();
      setQuestionStartTime(now);
    }
  }, [currentQuestionIndex, questions.length]);

  const handleGenerateQuestions = async () => {
    if (!selectedSubject) {
      toast({
        variant: "destructive",
        title: "Subject Required",
        description: "Please select a subject first",
      });
      return;
    }

    setLoadingQuestions(true);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setEvaluationResult(null);
    setTimerSeconds(0);
    setTimePerQuestion([]);
    setSessionStartTime(Date.now());
    setIsTimerRunning(true);
    
    try {
      // Use RAG to get relevant content and generate questions
      const ragQuery = selectedChapter 
        ? `Generate 5 practice questions for ${selectedChapter} chapter in ${selectedSubject}`
        : `Generate 5 practice questions for ${selectedSubject}`;

      const filters: any = {};
      if (selectedSubject) filters.subject = selectedSubject;
      if (selectedChapter) filters.chapter = selectedChapter;

      // Get content for context
      const ragResponse = await api.rag.query({
        query: ragQuery,
        subject: selectedSubject,
        top_k: 10,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      });

      if (ragResponse && ragResponse.contexts && ragResponse.contexts.length > 0) {
        const content = ragResponse.contexts
          .map((ctx: any) => ctx.text || ctx.content_text || "")
          .filter((text: string) => text.trim())
          .join("\n\n---\n\n");
        setReferenceContent(content);
      }

      // Generate questions using Gemini
      const prompt = `Generate 5 high-quality practice questions for Class 12 ${selectedSubject}${selectedChapter ? `, specifically for ${selectedChapter} chapter` : ''}. 

${referenceContent ? `Context:\n${referenceContent.substring(0, 1000)}\n\n` : ''}
Return ONLY a JSON array of question strings, like this:
["Question 1 text", "Question 2 text", "Question 3 text", "Question 4 text", "Question 5 text"]

Do not include any explanations, just the JSON array.`;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/rag/query-direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: prompt,
          subject: selectedSubject,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const result = await response.json();
      let generatedQuestions: string[] = [];

      if (result.generated_text) {
        try {
          let text = result.generated_text.trim();
          if (text.includes("```json")) {
            text = text.split("```json")[1].split("```")[0].trim();
          } else if (text.includes("```")) {
            text = text.split("```")[1].split("```")[0].trim();
          }
          generatedQuestions = JSON.parse(text);
          if (!Array.isArray(generatedQuestions)) {
            const questionText = typeof generatedQuestions === 'string' ? generatedQuestions : text;
            generatedQuestions = questionText
              .split(/\n\d+[\.\)]\s*|\n-\s*/)
              .map(q => q.trim())
              .filter(q => q.length > 10);
          }
        } catch (parseError) {
          const text = result.generated_text;
          generatedQuestions = text
            .split(/\n\d+[\.\)]\s*|\n-\s*|\nQ\d+[\.\):]\s*/i)
            .map(q => q.trim())
            .filter(q => q.length > 10 && !q.toLowerCase().includes('json'));
        }
      }

      if (generatedQuestions.length > 0) {
        setQuestions(generatedQuestions);
        setCurrentQuestionIndex(0);
        setUserAnswer("");
        setEvaluationResult(null);
      } else {
        toast({
          variant: "destructive",
          title: "No Questions Generated",
          description: "Could not generate questions. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Error generating questions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate questions",
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleEvaluateAndSave = async () => {
    if (!userAnswer.trim() || !questions[currentQuestionIndex]) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide your answer",
      });
      return;
    }

    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to save your answers",
      });
      return;
    }

    // Calculate time spent on this question
    const timeSpent = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
    const updatedTimePerQuestion = [...timePerQuestion];
    updatedTimePerQuestion[currentQuestionIndex] = timeSpent;
    setTimePerQuestion(updatedTimePerQuestion);

    setEvaluating(true);
    try {
      // Evaluate answer
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/rag/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questions[currentQuestionIndex],
          user_answer: userAnswer,
          reference_content: referenceContent || "General knowledge base",
          subject: selectedSubject,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate answer");
      }

      const result = await response.json();
      setEvaluationResult(result);

      // Calculate total time
      const totalTimeSeconds = timerSeconds;
      const totalTimeMinutes = Math.floor(totalTimeSeconds / 60);

      // Save to database
      if (selectedSubject) {
        const saveData = {
          user_id: user.id,
          subject: selectedSubject as Subject,
          chapter: selectedChapter || null,
          question: questions[currentQuestionIndex],
          user_answer: userAnswer,
          evaluation: result,
          score: result.score || 0,
          time_spent_seconds: timeSpent,
          session_time_seconds: totalTimeSeconds,
          session_time_minutes: totalTimeMinutes,
          question_index: currentQuestionIndex,
          all_questions: questions,
          time_per_question: updatedTimePerQuestion,
          reference_content: referenceContent || null,
          metadata: {
            session_start_time: sessionStartTime,
            created_at: new Date().toISOString(),
          },
        };

        const { error: saveError } = await (supabase
          .from("practice_question_evaluations" as any)
          .insert(saveData as any));

        if (saveError) {
          console.error("Error saving evaluation:", saveError);
          toast({
            variant: "default",
            title: "Evaluation Complete",
            description: "Answer evaluated but failed to save. Evaluation result shown below.",
          });
        } else {
          toast({
            title: "Answer Saved",
            description: "Your answer has been evaluated and saved with timer data",
          });
          setSavedEvaluations([...savedEvaluations, {
            question: questions[currentQuestionIndex],
            answer: userAnswer,
            evaluation: result,
            index: currentQuestionIndex,
            timeSpent: timeSpent,
          }]);
        }
      } else {
        toast({
          variant: "default",
          title: "Evaluation Complete",
          description: "Answer evaluated. Please select a subject to save answers.",
        });
      }

    } catch (error: any) {
      console.error("Evaluation error:", error);
      toast({
        variant: "destructive",
        title: "Evaluation Failed",
        description: error.message || "Failed to evaluate answer",
      });
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Save time for current question before moving
      if (questionStartTime) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        const updatedTimePerQuestion = [...timePerQuestion];
        updatedTimePerQuestion[currentQuestionIndex] = timeSpent;
        setTimePerQuestion(updatedTimePerQuestion);
      }
      
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer("");
      setEvaluationResult(null);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save time for current question before moving
      if (questionStartTime) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        const updatedTimePerQuestion = [...timePerQuestion];
        updatedTimePerQuestion[currentQuestionIndex] = timeSpent;
        setTimePerQuestion(updatedTimePerQuestion);
      }
      
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setUserAnswer("");
      setEvaluationResult(null);
      setQuestionStartTime(Date.now());
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

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setSessionStartTime(Date.now());
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Practice Questions</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Answer questions one by one and get AI-powered feedback
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Practice Questions
                </CardTitle>
                <CardDescription>
                  Select subject and chapter to start practicing questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject and Chapter Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Subject *
                    </label>
                    <Select
                      value={selectedSubject}
                      onValueChange={(value) => {
                        setSelectedSubject(value as Subject);
                        setSelectedChapter("");
                        setQuestions([]);
                        setCurrentQuestionIndex(0);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="biology">Biology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Chapter
                    </label>
                    <Select
                      value={selectedChapter}
                      onValueChange={setSelectedChapter}
                      disabled={!selectedSubject || loadingChapters}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingChapters ? "Loading chapters..." : chapters.length === 0 ? "No chapters available" : "Select chapter (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.length > 0 ? (
                          chapters.map((chapter) => (
                            <SelectItem key={chapter} value={chapter}>
                              {chapter}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No chapters found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Questions Button */}
                {selectedSubject && questions.length === 0 && !loadingQuestions && (
                  <Button
                    onClick={handleGenerateQuestions}
                    className="w-full"
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Questions
                  </Button>
                )}

                {loadingQuestions && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>Generating Questions</AlertTitle>
                    <AlertDescription>
                      Generating practice questions for you...
                    </AlertDescription>
                  </Alert>
                )}

                {questions.length > 0 && (
                  <div className="space-y-4">
                    {/* Timer and Question Navigation */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-mono font-semibold">
                            {formatTime(timerSeconds)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleTimer}
                            className="h-7 w-7 p-0"
                          >
                            {isTimerRunning ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetTimer}
                            className="h-7 w-7 p-0"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                        {questionStartTime && (
                          <Badge variant="secondary" className="text-xs">
                            Time on this question: {formatTime(Math.floor((Date.now() - questionStartTime) / 1000))}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousQuestion}
                          disabled={currentQuestionIndex === 0}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextQuestion}
                          disabled={currentQuestionIndex === questions.length - 1}
                        >
                          Next
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>

                    {/* Current Question */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question</label>
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm leading-relaxed">{questions[currentQuestionIndex]}</p>
                      </div>
                    </div>

                    {/* Answer Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Answer</label>
                      <Textarea
                        placeholder="Write your answer here..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        rows={8}
                        className="resize-none"
                      />
                    </div>

                    {/* Check Answer Button */}
                    <Button
                      onClick={handleEvaluateAndSave}
                      disabled={evaluating || !userAnswer.trim()}
                      className="w-full"
                      size="lg"
                    >
                      {evaluating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-4 w-4 mr-2" />
                          Check Answer
                        </>
                      )}
                    </Button>

                    {/* Evaluation Results */}
                    {evaluationResult && (
                      <Card className="mt-4">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Evaluation Results</CardTitle>
                            <Badge
                              variant={evaluationResult.score >= 70 ? "default" : evaluationResult.score >= 50 ? "secondary" : "destructive"}
                              className="text-lg px-3 py-1"
                            >
                              Score: {evaluationResult.score}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>Feedback</AlertTitle>
                            <AlertDescription className="mt-2">
                              {evaluationResult.feedback}
                            </AlertDescription>
                          </Alert>

                          {evaluationResult.strengths && evaluationResult.strengths.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <h4 className="font-semibold">Strengths</h4>
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-sm ml-6">
                                {evaluationResult.strengths.map((strength, idx) => (
                                  <li key={idx} className="text-muted-foreground">{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evaluationResult.improvements && evaluationResult.improvements.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold">Areas for Improvement</h4>
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-sm ml-6">
                                {evaluationResult.improvements.map((improvement, idx) => (
                                  <li key={idx} className="text-muted-foreground">{improvement}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evaluationResult.detailedAnalysis && (
                            <div>
                              <h4 className="font-semibold mb-2">Detailed Analysis</h4>
                              <div className="prose prose-sm max-w-none bg-muted p-4 rounded-lg">
                                <p className="whitespace-pre-wrap text-sm">
                                  {evaluationResult.detailedAnalysis}
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {!loadingQuestions && questions.length === 0 && selectedSubject && (
                  <Alert>
                    <FileCheck className="h-4 w-4" />
                    <AlertTitle>No Questions Yet</AlertTitle>
                    <AlertDescription>
                      Questions are being generated. Please wait a moment or try selecting a different chapter.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserContentUpload;
