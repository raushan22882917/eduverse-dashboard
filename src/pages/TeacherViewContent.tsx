import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import TeacherSidebar from "@/components/TeacherSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  ClipboardList,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Users,
  Lightbulb,
  Target,
  TrendingUp
} from "lucide-react";
import "katex/dist/katex.min.css";

const TeacherViewContent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [examSets, setExamSets] = useState<any[]>([]);
  const [homeworkSessions, setHomeworkSessions] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingHomework, setLoadingHomework] = useState(false);
  const [activeTab, setActiveTab] = useState("exams");
  const [selectedHomework, setSelectedHomework] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      if (activeTab === "exams") {
        fetchExamSets();
      } else {
        fetchHomeworkSessions();
      }
    }
  }, [user, activeTab]);

  const fetchExamSets = async () => {
    try {
      setLoadingExams(true);
      // Fetch all exam sets (teachers can see all)
      const data = await api.exam.getSets({});
      setExamSets(data || []);
    } catch (error: any) {
      console.error("Error fetching exam sets:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch exam sets",
      });
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchHomeworkSessions = async () => {
    try {
      setLoadingHomework(true);
      
      // Get teacher's students first
      const students = await api.teacher.getStudents(user?.id || "");
      const studentIds = students.map(s => s.user_id);

      if (studentIds.length === 0) {
        setHomeworkSessions([]);
        return;
      }

      // Get all homework sessions for the teacher's students
      const { data, error } = await supabase
        .from("homework_sessions" as any)
        .select("*")
        .in("user_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Group homework sessions by question_id to show unique assignments
      const homeworkMap = new Map<string, any>();
      
      (data || []).forEach((session: any) => {
        const questionId = session.question_id;
        
        if (!homeworkMap.has(questionId)) {
          // First occurrence of this homework assignment
          homeworkMap.set(questionId, {
            id: questionId,
            question_id: questionId,
            question: session.question,
            subject: session.subject,
            correct_answer: session.correct_answer,
            metadata: session.metadata || {},
            created_at: session.created_at,
            updated_at: session.updated_at,
            total_assigned: 0,
            completed: 0,
            pending: 0,
            total_attempts: 0,
            total_hints_revealed: 0,
            solutions_revealed: 0,
            students: [],
            sessions: []
          });
        }
        
        const homework = homeworkMap.get(questionId);
        homework.total_assigned++;
        homework.sessions.push(session);
        
        // Aggregate statistics
        homework.total_attempts += session.attempts?.length || 0;
        homework.total_hints_revealed += session.hints_revealed || 0;
        if (session.solution_revealed) {
          homework.solutions_revealed++;
        }
        
        const student = students.find(s => s.user_id === session.user_id);
        homework.students.push({
          user_id: session.user_id,
          name: student?.profile?.full_name || "Unknown",
          is_complete: session.is_complete,
          attempts: session.attempts?.length || 0,
          hints_revealed: session.hints_revealed || 0,
          solution_revealed: session.solution_revealed || false,
          session_id: session.id,
          created_at: session.created_at,
          updated_at: session.updated_at
        });
        
        if (session.is_complete) {
          homework.completed++;
        } else {
          homework.pending++;
        }
      });

      // Convert map to array and sort by creation date
      const homeworkList = Array.from(homeworkMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHomeworkSessions(homeworkList);
    } catch (error: any) {
      console.error("Error fetching homework sessions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch homework sessions",
      });
    } finally {
      setLoadingHomework(false);
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      mathematics: "bg-blue-500",
      physics: "bg-purple-500",
      chemistry: "bg-green-500",
      biology: "bg-orange-500",
    };
    return colors[subject] || "bg-gray-500";
  };

  const getSubjectLabel = (subject: string) => {
    return subject.charAt(0).toUpperCase() + subject.slice(1);
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">View Created Content</h1>
            <p className="text-muted-foreground">
              View all exams and homework you've created
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="exams" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Created Exams
              </TabsTrigger>
              <TabsTrigger value="homework" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                All Homework
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="exams" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Sets</CardTitle>
                  <CardDescription>All available exam sets in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingExams ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : examSets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No exam sets found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {examSets.map((examSet) => (
                        <Card key={examSet.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <Badge className={`${getSubjectColor(examSet.subject)} text-white`}>
                                {getSubjectLabel(examSet.subject)}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {examSet.year}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">
                              {getSubjectLabel(examSet.subject)} {examSet.year}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{examSet.questions?.length || 0} Questions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{examSet.duration_minutes || 0} minutes</span>
                              </div>
                              <div className="font-medium">
                                Total Marks: {examSet.total_marks || 0}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => navigate(`/dashboard/teacher/exams/submissions/${examSet.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Submissions
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="homework" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>All Homework</CardTitle>
                  <CardDescription>All homework sessions for your students</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHomework ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : homeworkSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No homework found</p>
                      <p className="text-sm">No homework sessions found for your students</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {homeworkSessions.map((homework) => (
                        <Card key={homework.question_id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <Badge className={`${getSubjectColor(homework.subject)} text-white capitalize`}>
                                {homework.subject}
                              </Badge>
                              {(homework.metadata?.topic || homework.metadata?.subtopic) && (
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                  {homework.metadata?.topic && (
                                    <Badge variant="outline" className="text-xs">
                                      {homework.metadata.topic}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-semibold mb-2 line-clamp-2 prose prose-sm max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath, remarkGfm]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  p: ({ children }) => <p className="mb-0 text-base leading-relaxed line-clamp-2">{children}</p>,
                                  h1: ({ children }) => <h1 className="text-lg font-semibold mb-0 mt-0 line-clamp-2">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-base font-semibold mb-0 mt-0 line-clamp-2">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-0 mt-0 line-clamp-2">{children}</h3>,
                                }}
                              >
                                {homework.question.length > 100 
                                  ? homework.question.substring(0, 100) + "..." 
                                  : homework.question}
                              </ReactMarkdown>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {new Date(homework.created_at).toLocaleDateString()}
                              {homework.metadata?.due_date && (
                                <>
                                  <span>•</span>
                                  <span>Due: {new Date(homework.metadata.due_date).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* Statistics */}
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="text-center p-2 bg-muted rounded">
                                  <div className="font-semibold text-lg">{homework.total_assigned}</div>
                                  <div className="text-xs text-muted-foreground">Assigned</div>
                                </div>
                                <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
                                  <div className="font-semibold text-lg text-green-600">{homework.completed}</div>
                                  <div className="text-xs text-muted-foreground">Completed</div>
                                </div>
                                <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                                  <div className="font-semibold text-lg text-orange-600">{homework.pending}</div>
                                  <div className="text-xs text-muted-foreground">Pending</div>
                                </div>
                              </div>

                              {/* Additional Statistics */}
                              <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                                <div className="text-center p-1.5 bg-blue-50 dark:bg-blue-950/20 rounded">
                                  <div className="font-medium text-blue-600 dark:text-blue-400">{homework.total_attempts}</div>
                                  <div className="text-muted-foreground">Total Attempts</div>
                                </div>
                                <div className="text-center p-1.5 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                                  <div className="font-medium text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                                    <Lightbulb className="h-3 w-3" />
                                    {homework.total_hints_revealed}
                                  </div>
                                  <div className="text-muted-foreground">Hints Used</div>
                                </div>
                                <div className="text-center p-1.5 bg-purple-50 dark:bg-purple-950/20 rounded">
                                  <div className="font-medium text-purple-600 dark:text-purple-400">{homework.solutions_revealed}</div>
                                  <div className="text-muted-foreground">Solutions Revealed</div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Completion Rate</span>
                                  <span>
                                    {homework.total_assigned > 0
                                      ? Math.round((homework.completed / homework.total_assigned) * 100)
                                      : 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{
                                      width: `${homework.total_assigned > 0 ? (homework.completed / homework.total_assigned) * 100 : 0}%`
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedHomework(homework);
                                    setIsDetailDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Show full question in a dialog
                                    setSelectedHomework(homework);
                                    setIsDetailDialogOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Homework Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Homework Details</DialogTitle>
            <DialogDescription>
              View all student progress and statistics for this homework assignment
            </DialogDescription>
          </DialogHeader>
          
          {selectedHomework && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Question Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Question</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          p: ({ children }) => <p className="mb-2 text-sm leading-relaxed">{children}</p>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="bg-muted p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                        }}
                      >
                        {selectedHomework.question}
                      </ReactMarkdown>
                    </div>
                    {selectedHomework.correct_answer && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Correct Answer:</p>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ children }) => <p className="mb-0 text-sm text-green-800 dark:text-green-300 leading-relaxed">{children}</p>,
                              h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-0 text-green-800 dark:text-green-300">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-semibold mb-1 mt-0 text-green-800 dark:text-green-300">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-xs font-semibold mb-0 mt-0 text-green-800 dark:text-green-300">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-1 text-green-800 dark:text-green-300">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 text-green-800 dark:text-green-300">{children}</ol>,
                              li: ({ children }) => <li className="mb-0.5">{children}</li>,
                              code: ({ children }) => <code className="bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded text-xs text-green-900 dark:text-green-200">{children}</code>,
                              pre: ({ children }) => <pre className="bg-green-100 dark:bg-green-900/30 p-2 rounded overflow-x-auto mb-1 text-green-900 dark:text-green-200">{children}</pre>,
                            }}
                          >
                            {selectedHomework.correct_answer}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Overall Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{selectedHomework.total_assigned}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Assigned</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{selectedHomework.completed}</div>
                        <div className="text-sm text-muted-foreground mt-1">Completed</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">{selectedHomework.pending}</div>
                        <div className="text-sm text-muted-foreground mt-1">Pending</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedHomework.total_assigned > 0
                            ? Math.round((selectedHomework.completed / selectedHomework.total_assigned) * 100)
                            : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Completion Rate</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Student Progress Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Student Progress ({selectedHomework.students.length} students)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Hints Used</TableHead>
                          <TableHead>Solution Revealed</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedHomework.students.map((student: any) => (
                          <TableRow key={student.user_id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>
                              {student.is_complete ? (
                                <Badge className="bg-green-500 text-white">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4 text-blue-500" />
                                {student.attempts}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                {student.hints_revealed}/3
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.solution_revealed ? (
                                <Badge variant="outline" className="text-purple-600">
                                  Yes
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(student.updated_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Additional Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedHomework.total_attempts}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Attempts</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                          <Lightbulb className="h-5 w-5" />
                          {selectedHomework.total_hints_revealed}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Total Hints Used</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{selectedHomework.solutions_revealed}</div>
                        <div className="text-sm text-muted-foreground mt-1">Solutions Revealed</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherViewContent;

