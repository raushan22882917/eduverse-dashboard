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
  FileQuestion,
  Plus,
  Trash2,
  Loader2,
  Save,
  X
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  marks: number;
  question_type: "mcq" | "short_answer" | "long_answer" | "numerical";
  options?: string[];
  correct_answer?: string;
}

const TeacherQuizCreation = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState<string>("");
  const [subject, setSubject] = useState<string>("mathematics");
  const [description, setDescription] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [classGrade, setClassGrade] = useState<number>(12);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [creating, setCreating] = useState(false);

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

  const handleCreateQuiz = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a quiz title",
      });
      return;
    }

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
      
      const quizData = {
        questions: questions.map((q, index) => ({
          id: q.id,
          question_number: index + 1,
          question: q.question,
          question_type: q.question_type,
          marks: q.marks,
          options: q.options || [],
          correct_answer: q.correct_answer || "",
        })),
        total_marks: totalMarks,
        duration_minutes: durationMinutes,
      };

      const response = await api.teacher.createQuiz({
        teacher_id: user?.id || "",
        title: title.trim(),
        subject: subject,
        description: description.trim() || undefined,
        quiz_data: quizData,
        duration_minutes: durationMinutes,
        total_marks: totalMarks,
        class_grade: classGrade,
        metadata: {},
      });

      toast({
        title: "Quiz Created!",
        description: "Your quiz has been created successfully",
      });

      // Navigate to quiz management page
      navigate("/dashboard/teacher/quizzes");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create quiz",
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
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <FileQuestion className="h-8 w-8" />
                Create Quiz
              </h1>
              <p className="text-muted-foreground">
                Create a new quiz for your students
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/teacher/quizzes")}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
              <CardDescription>Basic information about your quiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Quiz Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Chapter 5 Review Quiz"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject *</Label>
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
                <div>
                  <Label htmlFor="class-grade">Class Grade</Label>
                  <Input
                    id="class-grade"
                    type="number"
                    min="6"
                    max="12"
                    value={classGrade}
                    onChange={(e) => setClassGrade(parseInt(e.target.value) || 12)}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the quiz..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    Add questions to your quiz ({questions.length} questions, {questions.reduce((sum, q) => sum + q.marks, 0)} total marks)
                  </CardDescription>
                </div>
                <Button onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No questions yet. Add your first question to get started.</p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <Card key={question.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          <Badge variant="secondary">{question.marks} marks</Badge>
                          <Badge>{question.question_type}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Question Text *</Label>
                        <Textarea
                          placeholder="Enter your question here..."
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Question Type</Label>
                          <Select
                            value={question.question_type}
                            onValueChange={(value: any) => updateQuestion(question.id, "question_type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mcq">Multiple Choice</SelectItem>
                              <SelectItem value="short_answer">Short Answer</SelectItem>
                              <SelectItem value="long_answer">Long Answer</SelectItem>
                              <SelectItem value="numerical">Numerical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Marks</Label>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={question.marks}
                            onChange={(e) => updateQuestion(question.id, "marks", parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>
                      {question.question_type === "mcq" && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Options</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(question.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {(question.options || []).map((option, optIndex) => (
                              <div key={optIndex} className="flex gap-2">
                                <Input
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                  value={option}
                                  onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(question.id, optIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <Label>Correct Answer</Label>
                        <Input
                          placeholder="Enter the correct answer..."
                          value={question.correct_answer || ""}
                          onChange={(e) => updateQuestion(question.id, "correct_answer", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/teacher/quizzes")}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateQuiz} disabled={creating || questions.length === 0}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherQuizCreation;

