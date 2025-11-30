import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { 
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Send,
  Sparkles,
  Award,
  Clock
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type SubjectType = "mathematics" | "physics" | "chemistry" | "biology";

interface PYQQuestion {
  id: string;
  question: string;
  solution: string;
  marks: number;
  year: number;
  difficulty?: string;
}

interface EvaluationResult {
  is_correct: boolean;
  marks_obtained: number;
  total_marks: number;
  feedback: string;
  explanation: string;
}

const PYQPractice = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>("mathematics");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [topics, setTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  
  const [currentQuestion, setCurrentQuestion] = useState<PYQQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [pyqContent, setPyqContent] = useState<any[]>([]);
  const [loadingPyqContent, setLoadingPyqContent] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && selectedSubject) {
      fetchTopics();
      fetchPracticeHistory();
      fetchPyqContent();
    }
  }, [user, selectedSubject]);

  const fetchTopics = async () => {
    try {
      setLoadingTopics(true);
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("subject", selectedSubject)
        .order("order_index");

      if (error) throw error;
      setTopics(data || []);
      
      if (data && data.length > 0 && !selectedTopic) {
        setSelectedTopic(data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching topics:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load topics",
      });
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchPracticeHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("pyq_practice_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject", selectedSubject)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        // Table might not exist yet - silently handle
        console.debug("Practice history not available:", error.message || error);
        setPracticeHistory([]);
        return;
      }
      setPracticeHistory(data || []);
    } catch (error: any) {
      console.debug("Error fetching practice history:", error);
      // Don't show error - table might not exist yet
      setPracticeHistory([]);
    }
  };

  const fetchPyqContent = async () => {
    try {
      setLoadingPyqContent(true);
      
      // Fetch PYQ content
      const { data: contentData, error: contentError } = await supabase
        .from("content")
        .select("*")
        .eq("type", "pyq")
        .eq("subject", selectedSubject)
        .order("created_at", { ascending: false });

      if (contentError) throw contentError;
      
      if (!contentData || contentData.length === 0) {
        setPyqContent([]);
        return;
      }

      // Get unique topic IDs
      const topicIds = [...new Set(contentData.map(item => item.topic_id).filter(Boolean))];
      
      // Fetch topics if there are any
      let topicsMap: Record<string, any> = {};
      if (topicIds.length > 0) {
        const { data: topicsData, error: topicsError } = await supabase
          .from("topics")
          .select("id, name, chapter")
          .in("id", topicIds);
        
        if (!topicsError && topicsData) {
          topicsMap = topicsData.reduce((acc, topic) => {
            acc[topic.id] = topic;
            return acc;
          }, {} as Record<string, any>);
        }
      }
      
      // Process the data to include topic name
      const processedData = contentData.map((item) => {
        const topic = item.topic_id ? topicsMap[item.topic_id] : null;
        const metadata = item.metadata || {};
        return {
          ...item,
          topic_name: topic?.name || "N/A",
          topic_chapter: topic?.chapter || item.chapter || "N/A",
          year: metadata.year || metadata.exam_year || new Date(item.created_at).getFullYear(),
          marks: metadata.marks || metadata.total_marks || metadata.max_marks || "N/A",
        };
      });
      
      setPyqContent(processedData);
    } catch (error: any) {
      console.error("Error fetching PYQ content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load PYQ content",
      });
      setPyqContent([]);
    } finally {
      setLoadingPyqContent(false);
    }
  };

  const generateQuestion = async () => {
    if (!user || !selectedTopic) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a topic",
      });
      return;
    }

    try {
      setGeneratingQuestion(true);
      setCurrentQuestion(null);
      setUserAnswer("");
      setEvaluationResult(null);
      setShowResult(false);

      // Fetch topic details
      const topic = topics.find(t => t.id === selectedTopic);
      if (!topic) {
        throw new Error("Topic not found");
      }

      // Fetch PYQ content from content table
      // First try to get PYQs matching the selected topic
      let query = supabase
        .from("content")
        .select("*")
        .eq("type", "pyq")
        .eq("subject", selectedSubject);

      // Filter by topic_id if available
      const { data: topicPyqs, error: topicError } = await query.eq("topic_id", selectedTopic);

      // Also fetch PYQs from the same chapter if topic-specific ones are limited
      let chapterPyqs: any[] = [];
      if (topic?.chapter) {
        const { data: chapterData, error: chapterError } = await supabase
          .from("content")
          .select("*")
          .eq("type", "pyq")
          .eq("subject", selectedSubject)
          .eq("chapter", topic.chapter)
          .is("topic_id", null); // Get chapter-level PYQs without specific topic

        if (!chapterError && chapterData) {
          chapterPyqs = chapterData;
        }
      }

      // Combine and process PYQ content
      let pyqs: any[] = [];
      const allContent = [...(topicPyqs || []), ...chapterPyqs];

      if (allContent.length > 0) {
        // Convert content items to PYQ format
        pyqs = allContent.map((item) => {
          const contentText = item.content_text || "";
          const metadata = item.metadata || {};
          let question = "";
          let solution = "";
          
          // Priority 1: Check metadata for structured question/solution
          if (metadata.question && metadata.solution) {
            question = metadata.question;
            solution = metadata.solution;
          }
          // Priority 2: Parse structured content_text (Question: ... Solution: ...)
          else if (contentText.match(/question:?\s*/i) && contentText.match(/solution:?\s*/i)) {
            const questionMatch = contentText.match(/question:?\s*(.*?)(?=solution:?)/is);
            const solutionMatch = contentText.match(/solution:?\s*(.*)/is);
            question = questionMatch ? questionMatch[1].trim() : "";
            solution = solutionMatch ? solutionMatch[1].trim() : "";
          }
          // Priority 3: Try to split by common separators
          else if (contentText.includes("---") || contentText.includes("***")) {
            const separator = contentText.includes("---") ? "---" : "***";
            const parts = contentText.split(separator);
            question = parts[0]?.trim() || "";
            solution = parts.slice(1).join(separator).trim() || "";
          }
          // Priority 4: Use title as question, content_text as solution
          else if (item.title) {
            question = item.title;
            solution = contentText;
          }
          // Priority 5: Fallback - use content_text as question
          else {
            question = contentText;
            solution = metadata.solution || "";
          }

          // Extract marks from metadata or default
          const marks = metadata.marks || metadata.total_marks || metadata.max_marks || 5;
          
          // Extract year from metadata or use creation year
          const year = metadata.year || metadata.exam_year || new Date(item.created_at).getFullYear();

          return {
            id: item.id,
            question: question.trim(),
            solution: solution.trim(),
            marks: typeof marks === 'number' ? marks : parseInt(marks) || 5,
            year: typeof year === 'number' ? year : parseInt(year) || new Date().getFullYear(),
            difficulty: item.difficulty || metadata.difficulty || "medium",
            chapter: item.chapter || metadata.chapter,
            topic_id: item.topic_id,
            title: item.title,
            metadata: metadata,
          };
        }).filter(pyq => pyq.question && pyq.solution); // Filter out invalid PYQs
      }

      // Sort by relevance: topic-specific first, then by year (newest first)
      const relevantPyqs = pyqs
        .sort((a, b) => {
          // Prioritize topic-specific PYQs
          if (a.topic_id === selectedTopic && b.topic_id !== selectedTopic) return -1;
          if (a.topic_id !== selectedTopic && b.topic_id === selectedTopic) return 1;
          // Then sort by year (newest first)
          return (b.year || 0) - (a.year || 0);
        })
        .slice(0, 20); // Get more candidates for AI to choose from

      // Use Gemini to analyze content and generate/select a question
      const analysisPrompt = `You are helping a Class 12 student practice PYQ (Previous Year Questions).

Subject: ${selectedSubject}
Topic: ${topic.name}
Chapter: ${topic.chapter}

${relevantPyqs && relevantPyqs.length > 0 
  ? `Available PYQ Questions:\n${relevantPyqs.map((pyq, i) => `${i + 1}. ${pyq.question.substring(0, 200)}... (${pyq.year || 'N/A'}, ${pyq.marks} marks)`).join('\n')}`
  : 'No PYQ questions available in database. Generate a new PYQ-style question based on the topic.'
}

${relevantPyqs && relevantPyqs.length > 0
  ? 'Select the most appropriate PYQ question for this topic. If multiple questions match, choose the best one. Return it in JSON format:'
  : 'Generate a new PYQ-style question for this topic in JSON format:'
}

{
  "question": "The question text",
  "solution": "The complete solution/answer",
  "marks": 5,
  "year": 2023,
  "difficulty": "medium"
}

Only return the JSON, no additional text.`;

      const response = await api.rag.query({
        query: analysisPrompt,
        subject: selectedSubject as any,
        top_k: 3,
      });

      // Parse response
      const responseText = response.generated_text || "";
      let questionData: PYQQuestion | null = null;

      // Try to extract JSON from response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          questionData = JSON.parse(jsonMatch[0]);
        } else if (relevantPyqs && relevantPyqs.length > 0) {
          // Fallback: use first available PYQ
          const pyq = relevantPyqs[0];
          questionData = {
            id: pyq.id,
            question: pyq.question,
            solution: pyq.solution,
            marks: pyq.marks,
            year: pyq.year,
            difficulty: pyq.difficulty,
          };
        }
      } catch (parseError) {
        console.error("Error parsing question:", parseError);
        // Fallback: use first available PYQ
        if (relevantPyqs && relevantPyqs.length > 0) {
          const pyq = relevantPyqs[0];
          questionData = {
            id: pyq.id,
            question: pyq.question,
            solution: pyq.solution,
            marks: pyq.marks,
            year: pyq.year,
            difficulty: pyq.difficulty,
          };
        }
      }

      if (!questionData) {
        throw new Error("Failed to generate question");
      }

      setCurrentQuestion(questionData);
      toast({
        title: "Question Generated",
        description: "Answer the question below",
      });
    } catch (error: any) {
      console.error("Error generating question:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate question",
      });
    } finally {
      setGeneratingQuestion(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!user || !currentQuestion || !userAnswer.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please write an answer",
      });
      return;
    }

    try {
      setEvaluatingAnswer(true);
      setEvaluationResult(null);
      setShowResult(false);

      // Use Gemini to evaluate the answer
      const evaluationPrompt = `You are evaluating a student's answer for a PYQ (Previous Year Question).

Question: ${currentQuestion.question}

Correct Solution/Answer: ${currentQuestion.solution}

Student's Answer: ${userAnswer}

Total Marks: ${currentQuestion.marks}

Evaluate the student's answer and provide:
1. Whether the answer is correct (consider partial credit for partially correct answers)
2. Marks obtained (out of ${currentQuestion.marks})
3. Detailed feedback
4. Explanation of what was correct/incorrect

Return your evaluation in JSON format:
{
  "is_correct": true/false,
  "marks_obtained": 4,
  "total_marks": ${currentQuestion.marks},
  "feedback": "Detailed feedback about the answer",
  "explanation": "Explanation of correct concepts and mistakes"
}

Only return the JSON, no additional text.`;

      const response = await api.rag.query({
        query: evaluationPrompt,
        subject: selectedSubject as any,
        top_k: 3,
      });

      // Parse evaluation result
      const responseText = response.generated_text || "";
      let evalResult: EvaluationResult | null = null;

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          evalResult = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing evaluation:", parseError);
      }

      if (!evalResult) {
        // Fallback evaluation
        const isCorrect = userAnswer.toLowerCase().includes(
          currentQuestion.solution.toLowerCase().substring(0, 20)
        );
        evalResult = {
          is_correct: isCorrect,
          marks_obtained: isCorrect ? currentQuestion.marks : Math.floor(currentQuestion.marks * 0.3),
          total_marks: currentQuestion.marks,
          feedback: isCorrect 
            ? "Your answer is correct! Well done."
            : "Your answer needs improvement. Review the solution.",
          explanation: currentQuestion.solution,
        };
      }

      setEvaluationResult(evalResult);
      setShowResult(true);

      // Save to database
      await savePracticeSession(evalResult);

      toast({
        title: "Answer Evaluated",
        description: `You scored ${evalResult.marks_obtained}/${evalResult.total_marks} marks`,
      });
    } catch (error: any) {
      console.error("Error evaluating answer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to evaluate answer",
      });
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  const savePracticeSession = async (result: EvaluationResult) => {
    if (!user || !currentQuestion) return;

    try {
      const sessionData = {
        user_id: user.id,
        subject: selectedSubject,
        topic_id: selectedTopic,
        question: currentQuestion.question,
        correct_answer: currentQuestion.solution,
        user_answer: userAnswer,
        marks_obtained: result.marks_obtained,
        total_marks: result.total_marks,
        is_correct: result.is_correct,
        feedback: result.feedback,
        explanation: result.explanation,
        pyq_year: currentQuestion.year,
        difficulty: currentQuestion.difficulty || "medium",
        created_at: new Date().toISOString(),
      };

      try {
        const { error } = await supabase
          .from("pyq_practice_sessions")
          .insert(sessionData);

        if (error) {
          console.debug("Failed to save practice session (table may not exist):", error.message || error);
          // Don't throw - saving is optional
        } else {
          fetchPracticeHistory();
        }
      } catch (dbError: any) {
        console.debug("Error saving practice session:", dbError);
        // Don't throw - saving is optional
      }
    } catch (error: any) {
      console.warn("Error saving practice session:", error);
      // Don't throw - saving is optional
    }
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
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileQuestion className="h-8 w-8" />
              PYQ Practice
            </h1>
            <p className="text-muted-foreground">
              Practice Previous Year Questions with AI-powered evaluation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Question Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selection Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Topic</CardTitle>
                  <CardDescription>Choose subject and topic to practice</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject</label>
                      <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v as SubjectType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="physics">Physics</SelectItem>
                          <SelectItem value="chemistry">Chemistry</SelectItem>
                          <SelectItem value="biology">Biology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Topic</label>
                      {loadingTopics ? (
                        <div className="flex items-center gap-2 h-10">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading topics...</span>
                        </div>
                      ) : (
                        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {topics.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id}>
                                {topic.name} ({topic.chapter})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={generateQuestion}
                    disabled={generatingQuestion || !selectedTopic}
                    className="w-full mt-4 gap-2"
                  >
                    {generatingQuestion ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Question...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Question
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Question Card */}
              {currentQuestion && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileQuestion className="h-5 w-5" />
                          Question
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{currentQuestion.year}</Badge>
                          <Badge variant="secondary">{currentQuestion.marks} marks</Badge>
                          {currentQuestion.difficulty && (
                            <Badge variant="outline">{currentQuestion.difficulty}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentQuestion.question}
                      </ReactMarkdown>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Answer</label>
                        <Textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Write your answer here..."
                          className="min-h-[200px]"
                          disabled={evaluatingAnswer || showResult}
                        />
                      </div>

                      <Button
                        onClick={evaluateAnswer}
                        disabled={!userAnswer.trim() || evaluatingAnswer || showResult}
                        className="w-full gap-2"
                      >
                        {evaluatingAnswer ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Submit Answer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Result Card */}
              {showResult && evaluationResult && (
                <Card className={evaluationResult.is_correct ? "border-green-500" : "border-orange-500"}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {evaluationResult.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-orange-500" />
                      )}
                      Evaluation Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Marks Obtained</p>
                          <p className="text-2xl font-bold">
                            {evaluationResult.marks_obtained} / {evaluationResult.total_marks}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Percentage</p>
                          <p className="text-2xl font-bold">
                            {Math.round((evaluationResult.marks_obtained / evaluationResult.total_marks) * 100)}%
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Feedback</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {evaluationResult.feedback}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Explanation</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {evaluationResult.explanation}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Correct Solution</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-muted p-4 rounded-lg">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {currentQuestion?.solution || ""}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setShowResult(false);
                          setCurrentQuestion(null);
                          setUserAnswer("");
                          setEvaluationResult(null);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Practice Another Question
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Practice History */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Recent Practice
                  </CardTitle>
                  <CardDescription>Your practice history</CardDescription>
                </CardHeader>
                <CardContent>
                  {practiceHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No practice sessions yet</p>
                      <p className="text-xs mt-2">Start practicing to see your history</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {practiceHistory.map((session, index) => (
                        <div key={session.id || index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant={session.is_correct ? "default" : "secondary"}>
                              {session.marks_obtained}/{session.total_marks}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{session.question?.substring(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* PYQ Content Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                PYQ Content Database
              </CardTitle>
              <CardDescription>
                All Previous Year Questions available for {selectedSubject}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPyqContent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading PYQ content...</span>
                </div>
              ) : pyqContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No PYQ content found</p>
                  <p className="text-xs mt-2">PYQ content will appear here when available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Chapter</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Class Grade</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pyqContent.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-[200px]">
                            <div className="truncate" title={item.title || "No title"}>
                              {item.title || "Untitled"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.topic_chapter || item.chapter || "N/A"}
                          </TableCell>
                          <TableCell>
                            {item.topic_name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {item.difficulty ? (
                              <Badge variant="outline">{item.difficulty}</Badge>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            {item.year || "N/A"}
                          </TableCell>
                          <TableCell>
                            {item.marks !== "N/A" ? (
                              <Badge variant="secondary">{item.marks}</Badge>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            {item.class_grade ? (
                              <Badge variant="outline">Class {item.class_grade}</Badge>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PYQPractice;

