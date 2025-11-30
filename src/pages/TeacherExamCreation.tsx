import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TeacherSidebar from "@/components/TeacherSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  Save,
  X,
  Sparkles,
  Brain,
  Wand2
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Question {
  id: string;
  question: string;
  marks: number;
  question_type: "mcq" | "short_answer" | "long_answer" | "numerical";
  options?: string[];
  correct_answer?: string;
}

const TeacherExamCreation = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState<string>("mathematics");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [creating, setCreating] = useState(false);
  
  // AI-powered features
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [improvingQuestion, setImprovingQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      question: "",
      marks: 5,
      question_type: "short_answer",
      options: [],
      correct_answer: ""
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...(q.options || []), ""] }
        : q
    ));
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, index: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return { ...q, options: q.options.filter((_, i) => i !== index) };
      }
      return q;
    }));
  };

  // AI-powered question generation
  const generateAIQuestions = async () => {
    if (!aiPrompt.trim() || generatingQuestions) return;

    setGeneratingQuestions(true);
    try {
      const prompt = `Generate exam questions for:
Subject: ${subject}
Year: ${year}
Topic/Context: ${aiPrompt}

Generate ${aiPrompt.includes("number") ? "" : "5"} diverse questions including:
- Multiple choice questions (MCQ)
- Short answer questions
- Long answer questions
- Numerical problems

Format as JSON with question, question_type, marks, options (for MCQ), and correct_answer fields.`;

      const response = await api.rag.query({
        query: prompt,
        subject: subject as any,
        top_k: 5,
      });

      const questionsText = response.generated_text || "";
      const parsedQuestions = parseAIQuestions(questionsText);
      setAiGeneratedQuestions(parsedQuestions);
      
      toast({
        title: "Questions Generated",
        description: `Generated ${parsedQuestions.length} AI-powered questions`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate questions",
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const parseAIQuestions = (text: string): Question[] => {
    const questions: Question[] = [];
    
    // Try to parse JSON first
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          parsed.forEach((q: any, index: number) => {
            questions.push({
              id: `ai-q${Date.now()}-${index}`,
              question: q.question || q.text || "",
              marks: q.marks || 5,
              question_type: q.question_type || "short_answer",
              options: q.options || [],
              correct_answer: q.correct_answer || q.answer || "",
            });
          });
          return questions;
        }
      }
    } catch (e) {
      // Continue with text parsing
    }

    // Fallback: parse from text
    const questionPattern = /(?:Q\d+|Question\s+\d+)[:\-]?\s*(.+?)(?=(?:Q\d+|Question\s+\d+)|$)/gis;
    const matches = [...text.matchAll(questionPattern)];
    
    matches.forEach((match, index) => {
      const questionText = match[1]?.trim();
      if (questionText && questionText.length > 10) {
        const isMCQ = /[A-D][\.\)]\s/.test(questionText);
        questions.push({
          id: `ai-q${Date.now()}-${index}`,
          question: questionText,
          marks: 5,
          question_type: isMCQ ? "mcq" : "short_answer",
          options: isMCQ ? [] : [],
          correct_answer: "",
        });
      }
    });

    return questions.slice(0, 10);
  };

  const addAIQuestion = (question: Question) => {
    setQuestions([...questions, question]);
    setAiGeneratedQuestions(aiGeneratedQuestions.filter(q => q.id !== question.id));
    toast({
      title: "Question Added",
      description: "Question has been added to your exam",
    });
  };

  const addAllAIQuestions = () => {
    setQuestions([...questions, ...aiGeneratedQuestions]);
    setAiGeneratedQuestions([]);
    setShowAIGenerator(false);
    toast({
      title: "Questions Added",
      description: `Added ${aiGeneratedQuestions.length} questions to your exam`,
    });
  };

  const improveQuestionWithAI = async (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || improvingQuestion === questionId) return;

    setImprovingQuestion(questionId);
    try {
      const prompt = `Improve and enhance this exam question:

Original Question: ${question.question}
Question Type: ${question.question_type}
Subject: ${subject}
Marks: ${question.marks}

Provide an improved version that is:
- Clearer and more precise
- Better aligned with learning objectives
- More engaging for students
- Properly formatted

Return only the improved question text.`;

      const response = await api.rag.query({
        query: prompt,
        subject: subject as any,
        top_k: 3,
      });

      const improvedText = response.generated_text?.trim() || question.question;
      updateQuestion(questionId, "question", improvedText);
      
      toast({
        title: "Question Improved",
        description: "AI has enhanced your question",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to improve question",
      });
    } finally {
      setImprovingQuestion(null);
    }
  };

  const handleCreateExam = async () => {
    if (questions.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one question",
      });
      return;
    }

    // Validate questions
    for (const q of questions) {
      if (!q.question.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "All questions must have question text",
        });
        return;
      }
      if (q.question_type === "mcq" && (!q.options || q.options.length < 2)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "MCQ questions must have at least 2 options",
        });
        return;
      }
    }

    try {
      setCreating(true);
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      
      const examData = {
        subject,
        year,
        duration_minutes: durationMinutes,
        total_marks: totalMarks,
        questions: questions.map(q => ({
          question: q.question,
          marks: q.marks,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          metadata: {}
        })),
        metadata: {}
      };

      await api.exam.createSet(examData);
      
      toast({
        title: "Success",
        description: "Exam created successfully",
      });
      
      navigate("/dashboard/teacher");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create exam",
      });
    } finally {
      setCreating(false);
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
      <TeacherSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Create Exam
            </h1>
            <p className="text-muted-foreground">
              Create a new exam for your students
            </p>
          </div>

          {/* Exam Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
              <CardDescription>Set basic exam information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={subject} onValueChange={setSubject}>
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
                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                    min={2000}
                    max={2100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes) *</Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 180)}
                    min={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Questions ({questions.length})</CardTitle>
                <CardDescription>Add questions to your exam</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAIGenerator(true)}
                  className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Generate
                </Button>
                <Button onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions added yet. Click "Add Question" to get started.
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <Card key={question.id}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Question Type *</Label>
                            <Select
                              value={question.question_type}
                              onValueChange={(v: any) => updateQuestion(question.id, "question_type", v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mcq">MCQ</SelectItem>
                                <SelectItem value="short_answer">Short Answer</SelectItem>
                                <SelectItem value="long_answer">Long Answer</SelectItem>
                                <SelectItem value="numerical">Numerical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Marks *</Label>
                            <Input
                              type="number"
                              value={question.marks}
                              onChange={(e) => updateQuestion(question.id, "marks", parseInt(e.target.value) || 5)}
                              min={1}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Question Text *</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => improveQuestionWithAI(question.id)}
                              disabled={improvingQuestion === question.id}
                              className="text-primary"
                            >
                              {improvingQuestion === question.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Improving...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="h-3 w-3 mr-1" />
                                  Improve with AI
                                </>
                              )}
                            </Button>
                          </div>
                          <Textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                            placeholder="Enter the question..."
                            className="min-h-[100px]"
                          />
                        </div>
                        {question.question_type === "mcq" && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Options *</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(question.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Option
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {question.options?.map((option, optIndex) => (
                                <div key={optIndex} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                    placeholder={`Option ${optIndex + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOption(question.id, optIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <Label>Correct Answer</Label>
                              <Input
                                value={question.correct_answer || ""}
                                onChange={(e) => updateQuestion(question.id, "correct_answer", e.target.value)}
                                placeholder="Enter correct answer"
                              />
                            </div>
                          </div>
                        )}
                        {question.question_type !== "mcq" && (
                          <div className="space-y-2">
                            <Label>Correct Answer / Solution</Label>
                            <Textarea
                              value={question.correct_answer || ""}
                              onChange={(e) => updateQuestion(question.id, "correct_answer", e.target.value)}
                              placeholder="Enter the correct answer or solution..."
                              className="min-h-[80px]"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard/teacher")}>
              Cancel
            </Button>
            <Button onClick={handleCreateExam} disabled={creating || questions.length === 0}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Exam
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* AI Question Generator Dialog */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI-Powered Question Generator
            </DialogTitle>
            <DialogDescription>
              Describe the topic or provide context, and AI will generate exam questions for you
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="space-y-2">
              <Label>Topic/Context for Questions</Label>
              <Textarea
                placeholder="e.g., 'Algebra - quadratic equations' or 'Physics - Newton's laws of motion'..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button
              onClick={generateAIQuestions}
              disabled={!aiPrompt.trim() || generatingQuestions}
              className="w-full bg-gradient-to-r from-primary to-primary/90"
            >
              {generatingQuestions ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>

            {aiGeneratedQuestions.length > 0 && (
              <div className="flex-1 overflow-y-auto space-y-3 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">
                    Generated Questions ({aiGeneratedQuestions.length})
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAllAIQuestions}
                  >
                    Add All
                  </Button>
                </div>
                {aiGeneratedQuestions.map((q) => (
                  <Card key={q.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline">{q.question_type}</Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addAIQuestion(q)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{q.question}</p>
                      {q.marks && (
                        <p className="text-xs text-muted-foreground">
                          Marks: {q.marks}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAIGenerator(false);
              setAiPrompt("");
              setAiGeneratedQuestions([]);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherExamCreation;

