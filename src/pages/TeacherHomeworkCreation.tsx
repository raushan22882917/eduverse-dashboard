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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  ClipboardList,
  Loader2,
  Save,
  Sparkles,
  Brain,
  Wand2,
  Edit,
  Check,
  X,
  Send,
  BookOpen,
  FileText
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Topic {
  id: string;
  subject: string;
  chapter: string;
  name: string;
  order_index: number;
}

const TeacherHomeworkCreation = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState<string>("mathematics");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [activeTab, setActiveTab] = useState("create");
  
  // AI-powered features
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [improvingQuestion, setImprovingQuestion] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStudents();
      fetchTopics();
    }
  }, [user]);

  useEffect(() => {
    if (subject) {
      fetchTopics();
      setSelectedTopic("");
      setSelectedSubtopic("");
    }
  }, [subject]);

  const fetchTopics = async () => {
    try {
      setLoadingTopics(true);
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("subject", subject)
        .order("order_index");
      
      if (error) throw error;
      setTopics(data || []);
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

  // Get unique chapters (topics) for the selected subject
  const getChapters = () => {
    const chapters = Array.from(new Set(topics.map(t => t.chapter)));
    return chapters.sort();
  };

  // Get subtopics (names) for the selected chapter
  const getSubtopics = () => {
    if (!selectedTopic) return [];
    return topics
      .filter(t => t.chapter === selectedTopic)
      .sort((a, b) => a.order_index - b.order_index);
  };

  // AI-powered question generation
  const generateAIQuestion = async () => {
    if (!aiPrompt.trim() || generatingQuestion) return;

    setGeneratingQuestion(true);
    try {
      const topicContext = selectedTopic 
        ? `Chapter: ${selectedTopic}${selectedSubtopic ? `, Subtopic: ${selectedSubtopic}` : ""}`
        : "";
      
      const prompt = `Generate a comprehensive homework question for:
Subject: ${subject}
${topicContext}
Additional Context: ${aiPrompt}
Class Level: 12

Generate a well-structured homework question that:
- Tests understanding of key concepts
- Is appropriate for Class 12 level
- Includes clear instructions
- Can be answered in a reasonable time
- Aligns with the selected topic${selectedSubtopic ? " and subtopic" : ""}

Return the question text and optionally a detailed solution.`;

      const response = await api.rag.query({
        query: prompt,
        subject: subject as any,
        top_k: 5,
      });

      const questionText = response.generated_text || "";
      
      // Try to extract question and answer
      const questionMatch = questionText.match(/(?:Question|Q)[:\-]?\s*(.+?)(?=(?:Answer|Solution|A[:\-])|$)/is);
      const answerMatch = questionText.match(/(?:Answer|Solution|A[:\-])\s*(.+?)$/is);
      
      if (questionMatch) {
        setQuestion(questionMatch[1].trim());
      } else {
        setQuestion(questionText.substring(0, 500).trim());
      }
      
      if (answerMatch) {
        setCorrectAnswer(answerMatch[1].trim());
      }
      
      setShowAIGenerator(false);
      setAiPrompt("");
      setIsEditing(true);
      
      toast({
        title: "Question Generated",
        description: "AI has generated a homework question. You can edit it before submitting.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate question",
      });
    } finally {
      setGeneratingQuestion(false);
    }
  };

  const improveQuestionWithAI = async () => {
    if (!question.trim() || improvingQuestion) return;

    setImprovingQuestion(true);
    try {
      const topicContext = selectedTopic 
        ? `Chapter: ${selectedTopic}${selectedSubtopic ? `, Subtopic: ${selectedSubtopic}` : ""}`
        : "";
      
      const prompt = `Improve and enhance this homework question:

Original Question: ${question}
Subject: ${subject}
${topicContext}
${correctAnswer ? `Current Answer: ${correctAnswer}` : ""}

Provide an improved version that is:
- Clearer and more precise
- Better aligned with learning objectives
- More engaging for students
- Properly formatted for Class 12 level
- Better aligned with the topic${selectedSubtopic ? " and subtopic" : ""}

Return the improved question and optionally an improved solution.`;

      const response = await api.rag.query({
        query: prompt,
        subject: subject as any,
        top_k: 3,
      });

      const improvedText = response.generated_text || question;
      
      // Try to extract question and answer
      const questionMatch = improvedText.match(/(?:Question|Q)[:\-]?\s*(.+?)(?=(?:Answer|Solution|A[:\-])|$)/is);
      const answerMatch = improvedText.match(/(?:Answer|Solution|A[:\-])\s*(.+?)$/is);
      
      if (questionMatch) {
        setQuestion(questionMatch[1].trim());
      } else {
        setQuestion(improvedText.substring(0, 500).trim());
      }
      
      if (answerMatch && !correctAnswer) {
        setCorrectAnswer(answerMatch[1].trim());
      }
      
      setIsEditing(true);
      
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
      setImprovingQuestion(false);
    }
  };

  const handleCreateHomework = async () => {
    if (!question.trim()) {
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
      setCreating(true);

      // Generate a shared question_id for all students (teacher-assigned homework)
      const sharedQuestionId = `teacher-assigned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create homework sessions for each selected student
      const promises = selectedStudents.map(async (studentId) => {
        return await api.homework.start({
          user_id: studentId,
          question: question,
          subject: subject as any,
          correct_answer: correctAnswer || undefined,
          question_id: sharedQuestionId,
          metadata: {
            is_assigned: true,
            assigned_by_teacher: true,
            due_date: dueDate || null,
            topic: selectedTopic || null,
            subtopic: selectedSubtopic || null,
            topic_id: topics.find(t => t.chapter === selectedTopic && t.name === selectedSubtopic)?.id || null
          }
        });
      });

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `Homework assigned to ${selectedStudents.length} student(s)`,
      });

      // Reset form
      setQuestion("");
      setCorrectAnswer("");
      setSelectedStudents([]);
      setDueDate("");
      setSelectedTopic("");
      setSelectedSubtopic("");
      setIsEditing(true);
      setActiveTab("create");

      navigate("/dashboard/teacher/view-content");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create homework",
      });
    } finally {
      setCreating(false);
    }
  };

  const canSubmit = question.trim() && selectedStudents.length > 0;

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
              <ClipboardList className="h-8 w-8" />
              Create Homework
            </h1>
            <p className="text-muted-foreground">
              Create and assign homework to your students
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="create">Create Question</TabsTrigger>
              <TabsTrigger value="preview" disabled={!question.trim()}>
                Preview & Submit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              {/* Subject and Topic Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject & Topic Selection</CardTitle>
                  <CardDescription>Select the subject, topic, and subtopic for this homework</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <Label>Topic (Chapter) {selectedTopic && <Check className="h-4 w-4 inline text-green-500" />}</Label>
                      {loadingTopics ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <Select value={selectedTopic} onValueChange={(value) => {
                          setSelectedTopic(value);
                          setSelectedSubtopic("");
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {getChapters().map((chapter) => (
                              <SelectItem key={chapter} value={chapter}>
                                {chapter}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Subtopic {selectedSubtopic && <Check className="h-4 w-4 inline text-green-500" />}</Label>
                      <Select 
                        value={selectedSubtopic} 
                        onValueChange={setSelectedSubtopic}
                        disabled={!selectedTopic}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedTopic ? "Select subtopic" : "Select topic first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubtopics().map((subtopic) => (
                            <SelectItem key={subtopic.id} value={subtopic.name}>
                              {subtopic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(selectedTopic || selectedSubtopic) && (
                    <div className="flex gap-2 flex-wrap">
                      {selectedTopic && (
                        <Badge variant="secondary" className="gap-1">
                          <BookOpen className="h-3 w-3" />
                          {selectedTopic}
                        </Badge>
                      )}
                      {selectedSubtopic && (
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {selectedSubtopic}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Question Creation */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Question Details</CardTitle>
                      <CardDescription>Create your homework question manually or with AI</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAIGenerator(true)}
                        className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generate
                      </Button>
                      {question.trim() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={improveQuestionWithAI}
                          disabled={improvingQuestion}
                          className="text-primary"
                        >
                          {improvingQuestion ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Improving...
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-3 w-3 mr-1" />
                              Improve
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question *</Label>
                    <Textarea
                      value={question}
                      onChange={(e) => {
                        setQuestion(e.target.value);
                        setIsEditing(true);
                      }}
                      placeholder="Enter the homework question... (You can use AI to generate or improve it)"
                      className="min-h-[200px] text-base"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{question.length} characters</span>
                      {isEditing && question.trim() && (
                        <span className="text-orange-500">Editing mode - Make changes before submitting</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Correct Answer / Solution (Optional)</Label>
                    <Textarea
                      value={correctAnswer}
                      onChange={(e) => {
                        setCorrectAnswer(e.target.value);
                        setIsEditing(true);
                      }}
                      placeholder="Enter the correct answer or solution (for reference)..."
                      className="min-h-[150px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This helps the AI provide better feedback to students
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Date (Optional)</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation to Preview */}
              {question.trim() && (
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab("preview")}>
                    Review & Continue
                    <Check className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              {/* Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview Homework</CardTitle>
                  <CardDescription>Review your homework before assigning to students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                    <Badge className="capitalize">{subject}</Badge>
                  </div>
                  {(selectedTopic || selectedSubtopic) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Topic & Subtopic</Label>
                      <div className="flex gap-2">
                        {selectedTopic && (
                          <Badge variant="secondary">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {selectedTopic}
                          </Badge>
                        )}
                        {selectedSubtopic && (
                          <Badge variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            {selectedSubtopic}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Question</Label>
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="whitespace-pre-wrap">{question}</p>
                    </div>
                  </div>
                  {correctAnswer && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Solution</Label>
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="whitespace-pre-wrap">{correctAnswer}</p>
                      </div>
                    </div>
                  )}
                  {dueDate && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                      <p>{new Date(dueDate).toLocaleDateString()}</p>
                    </div>
                  )}
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

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4">
                <Button variant="outline" onClick={() => setActiveTab("create")}>
                  <X className="h-4 w-4 mr-2" />
                  Back to Edit
                </Button>
                <Button 
                  onClick={handleCreateHomework} 
                  disabled={!canSubmit || creating}
                  size="lg"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Assign to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* AI Question Generator Dialog */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI-Powered Question Generator
            </DialogTitle>
            <DialogDescription>
              {selectedTopic 
                ? `Generate a question for ${selectedTopic}${selectedSubtopic ? ` - ${selectedSubtopic}` : ""}`
                : "Describe the topic or provide context, and AI will generate a homework question for you"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Additional Context / Requirements</Label>
              <Textarea
                placeholder={selectedTopic 
                  ? `e.g., 'Focus on problem-solving' or 'Include real-world applications'...`
                  : "e.g., 'Algebra - quadratic equations' or 'Physics - Newton's laws of motion'..."}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              {selectedTopic && (
                <p className="text-xs text-muted-foreground">
                  AI will generate a question based on: {selectedTopic}{selectedSubtopic ? ` - ${selectedSubtopic}` : ""}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAIGenerator(false);
              setAiPrompt("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={generateAIQuestion}
              disabled={generatingQuestion}
              className="bg-gradient-to-r from-primary to-primary/90"
            >
              {generatingQuestion ? (
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

export default TeacherHomeworkCreation;
