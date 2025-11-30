import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TeacherSidebar from "@/components/TeacherSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  ClipboardList,
  Plus,
  Trash2,
  Loader2,
  Save,
  X,
  Sparkles,
  Brain,
  Wand2,
  Users,
  Calendar
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

const TeacherCreateContent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("exam");

  // Exam state
  const [subject, setSubject] = useState<string>("mathematics");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [creatingExam, setCreatingExam] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [improvingQuestion, setImprovingQuestion] = useState<string | null>(null);

  // Homework state
  const [homeworkSubject, setHomeworkSubject] = useState<string>("mathematics");
  const [homeworkQuestion, setHomeworkQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [creatingHomework, setCreatingHomework] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAIHomeworkGenerator, setShowAIHomeworkGenerator] = useState(false);
  const [generatingHomeworkQuestion, setGeneratingHomeworkQuestion] = useState(false);
  const [homeworkAIPrompt, setHomeworkAIPrompt] = useState("");
  const [improvingHomeworkQuestion, setImprovingHomeworkQuestion] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && activeTab === "homework") {
      fetchStudents();
    }
  }, [user, activeTab]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const data = await api.teacher.getStudents(user?.id || "");
      setStudents(data || []);
    } catch (error: any) {
      console.error("Error fetching students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Exam functions
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
      setCreatingExam(true);
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
      
      // Reset form
      setQuestions([]);
      setSubject("mathematics");
      setYear(new Date().getFullYear());
      setDurationMinutes(180);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create exam",
      });
    } finally {
      setCreatingExam(false);
    }
  };

  // Homework functions
  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.user_id));
    }
  };

  const generateAIHomeworkQuestion = async () => {
    if (!homeworkAIPrompt.trim() || generatingHomeworkQuestion) return;

    setGeneratingHomeworkQuestion(true);
    try {
      const prompt = `Generate a homework question for:
Subject: ${homeworkSubject}
Topic/Context: ${homeworkAIPrompt}
Class Level: 12

Generate a well-structured homework question that:
- Tests understanding of key concepts
- Is appropriate for Class 12 level
- Includes clear instructions
- Can be answered in a reasonable time

Return the question text and optionally a solution.`;

      const response = await api.rag.query({
        query: prompt,
        subject: homeworkSubject as any,
        top_k: 5,
      });

      const questionText = response.generated_text || "";
      
      const questionMatch = questionText.match(/(?:Question|Q)[:\-]?\s*(.+?)(?=(?:Answer|Solution|A[:\-])|$)/is);
      const answerMatch = questionText.match(/(?:Answer|Solution|A[:\-])\s*(.+?)$/is);
      
      if (questionMatch) {
        setHomeworkQuestion(questionMatch[1].trim());
      } else {
        setHomeworkQuestion(questionText.substring(0, 500).trim());
      }
      
      if (answerMatch) {
        setCorrectAnswer(answerMatch[1].trim());
      }
      
      setShowAIHomeworkGenerator(false);
      setHomeworkAIPrompt("");
      
      toast({
        title: "Question Generated",
        description: "AI has generated a homework question for you",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate question",
      });
    } finally {
      setGeneratingHomeworkQuestion(false);
    }
  };

  const improveHomeworkQuestionWithAI = async () => {
    if (!homeworkQuestion.trim() || improvingHomeworkQuestion) return;

    setImprovingHomeworkQuestion(true);
    try {
      const prompt = `Improve and enhance this homework question:

Original Question: ${homeworkQuestion}
Subject: ${homeworkSubject}
${correctAnswer ? `Current Answer: ${correctAnswer}` : ""}

Provide an improved version that is:
- Clearer and more precise
- Better aligned with learning objectives
- More engaging for students
- Properly formatted for Class 12 level

Return the improved question and optionally an improved solution.`;

      const response = await api.rag.query({
        query: prompt,
        subject: homeworkSubject as any,
        top_k: 3,
      });

      const improvedText = response.generated_text || homeworkQuestion;
      
      const questionMatch = improvedText.match(/(?:Question|Q)[:\-]?\s*(.+?)(?=(?:Answer|Solution|A[:\-])|$)/is);
      const answerMatch = improvedText.match(/(?:Answer|Solution|A[:\-])\s*(.+?)$/is);
      
      if (questionMatch) {
        setHomeworkQuestion(questionMatch[1].trim());
      } else {
        setHomeworkQuestion(improvedText.substring(0, 500).trim());
      }
      
      if (answerMatch && !correctAnswer) {
        setCorrectAnswer(answerMatch[1].trim());
      }
      
      toast({
        title: "Question Improved",
        description: "AI has enhanced your homework question",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to improve question",
      });
    } finally {
      setImprovingHomeworkQuestion(false);
    }
  };

  const handleCreateHomework = async () => {
    if (!homeworkQuestion.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a question",
      });
      return;
    }

    if (selectedStudents.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one student",
      });
      return;
    }

    try {
      setCreatingHomework(true);

      const promises = selectedStudents.map(async (studentId) => {
        return await api.homework.start({
          user_id: studentId,
          question: homeworkQuestion,
          subject: homeworkSubject as any,
          correct_answer: correctAnswer || undefined,
        });
      });

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `Homework assigned to ${selectedStudents.length} student(s)`,
      });

      // Reset form
      setHomeworkQuestion("");
      setCorrectAnswer("");
      setSelectedStudents([]);
      setDueDate("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create homework",
      });
    } finally {
      setCreatingHomework(false);
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Content</h1>
            <p className="text-muted-foreground">
              Create exams and homework for your students
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="exam" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Create Exam
              </TabsTrigger>
              <TabsTrigger value="homework" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Create Homework
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="exam" className="mt-0 space-y-6">
              {/* Exam Details */}
              <Card>
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
              <Card>
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
                <Button onClick={handleCreateExam} disabled={creatingExam || questions.length === 0}>
                  {creatingExam ? (
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
            </TabsContent>
            
            <TabsContent value="homework" className="mt-0 space-y-6">
              {/* Homework Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Homework Details</CardTitle>
                  <CardDescription>Set the homework question and subject</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subject *</Label>
                      <Select value={homeworkSubject} onValueChange={setHomeworkSubject}>
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
                      <Label>Due Date (Optional)</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Question *</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAIHomeworkGenerator(true)}
                          className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Generate
                        </Button>
                        {homeworkQuestion.trim() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={improveHomeworkQuestionWithAI}
                            disabled={improvingHomeworkQuestion}
                            className="text-primary"
                          >
                            {improvingHomeworkQuestion ? (
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
                        )}
                      </div>
                    </div>
                    <Textarea
                      value={homeworkQuestion}
                      onChange={(e) => setHomeworkQuestion(e.target.value)}
                      placeholder="Enter the homework question..."
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Correct Answer / Solution (Optional)</Label>
                    <Textarea
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      placeholder="Enter the correct answer or solution (for reference)..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This helps the AI provide better feedback to students
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Student Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Assign To Students</CardTitle>
                      <CardDescription>Select students to assign this homework</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={selectAllStudents}>
                      {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingStudents ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No students found. Students will appear here once assigned to your school.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.user_id}
                          className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => toggleStudent(student.user_id)}
                        >
                          <Checkbox
                            checked={selectedStudents.includes(student.user_id)}
                            onCheckedChange={() => toggleStudent(student.user_id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{student.profile?.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              Grade {student.class_grade} • {student.school_name || ""}
                            </p>
                          </div>
                        </div>
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
                <Button 
                  onClick={handleCreateHomework} 
                  disabled={creatingHomework || !homeworkQuestion.trim() || selectedStudents.length === 0}
                >
                  {creatingHomework ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Assign Homework ({selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''})
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* AI Question Generator Dialog for Exams */}
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

      {/* AI Question Generator Dialog for Homework */}
      <Dialog open={showAIHomeworkGenerator} onOpenChange={setShowAIHomeworkGenerator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI-Powered Question Generator
            </DialogTitle>
            <DialogDescription>
              Describe the topic or provide context, and AI will generate a homework question for you
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Topic/Context for Question</Label>
              <Textarea
                placeholder="e.g., 'Algebra - quadratic equations' or 'Physics - Newton's laws of motion'..."
                value={homeworkAIPrompt}
                onChange={(e) => setHomeworkAIPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAIHomeworkGenerator(false);
              setHomeworkAIPrompt("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={generateAIHomeworkQuestion}
              disabled={!homeworkAIPrompt.trim() || generatingHomeworkQuestion}
              className="bg-gradient-to-r from-primary to-primary/90"
            >
              {generatingHomeworkQuestion ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Question
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherCreateContent;


