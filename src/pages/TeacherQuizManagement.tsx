import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TeacherSidebar from "@/components/TeacherSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  FileQuestion,
  Plus,
  Eye,
  Loader2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  BookOpen
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TeacherQuizManagement = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quizSessions, setQuizSessions] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchQuizzes();
      fetchQuizSessions();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const quizList = await api.teacher.getQuizzes(user?.id || "");
      setQuizzes(quizList || []);
    } catch (error: any) {
      console.error("Error fetching quizzes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch quizzes",
      });
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const fetchQuizSessions = async () => {
    try {
      setLoadingSessions(true);
      
      // Use backend API endpoint which bypasses RLS issues
      const sessions = await api.teacher.getQuizSessions(user?.id || "");
      setQuizSessions(sessions || []);
    } catch (error: any) {
      console.error("Error fetching quiz sessions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch quiz sessions",
      });
      setQuizSessions([]);
    } finally {
      setLoadingSessions(false);
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <FileQuestion className="h-8 w-8" />
                Quiz Management
              </h1>
              <p className="text-muted-foreground">
                Create and manage quizzes, view student quiz sessions
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard/teacher/quizzes/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </div>

          <Tabs defaultValue="quizzes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="quizzes">
                <BookOpen className="h-4 w-4 mr-2" />
                My Quizzes ({quizzes.length})
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <Users className="h-4 w-4 mr-2" />
                Quiz Sessions ({quizSessions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quizzes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Created Quizzes</CardTitle>
                  <CardDescription>Manage your quiz templates</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingQuizzes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {quizzes.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                          <FileQuestion className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground mb-4">No quizzes created yet</p>
                          <Button onClick={() => navigate("/dashboard/teacher/quizzes/create")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Quiz
                          </Button>
                        </div>
                      ) : (
                        quizzes.map((quiz) => (
                          <Card key={quiz.id} className="relative">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg mb-2">{quiz.title}</CardTitle>
                                  <CardDescription className="line-clamp-2">
                                    {quiz.description || "No description"}
                                  </CardDescription>
                                </div>
                                {quiz.is_active ? (
                                  <Badge variant="default" className="ml-2">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="ml-2">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {quiz.subject}
                                </Badge>
                                {quiz.class_grade && (
                                  <Badge variant="outline">
                                    Grade {quiz.class_grade}
                                  </Badge>
                                )}
                                {quiz.duration_minutes && (
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {quiz.duration_minutes} min
                                  </Badge>
                                )}
                                {quiz.total_marks && (
                                  <Badge variant="outline">
                                    {quiz.total_marks} marks
                                  </Badge>
                                )}
                              </div>
                              {quiz.quiz_data?.questions && (
                                <p className="text-sm text-muted-foreground">
                                  {quiz.quiz_data.questions.length} question{quiz.quiz_data.questions.length !== 1 ? 's' : ''}
                                </p>
                              )}
                              <div className="flex items-center gap-2 pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => navigate(`/dashboard/teacher/quizzes/${quiz.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/dashboard/teacher/quizzes/edit/${quiz.id}`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Created {new Date(quiz.created_at).toLocaleDateString()}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Sessions</CardTitle>
                  <CardDescription>View all quiz attempts by your students</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quizSessions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No quiz sessions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          quizSessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell className="font-medium">{session.student_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {session.subject}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {session.is_completed && session.score !== null ? (
                                  <span className="font-semibold">
                                    {session.score} / {session.total_marks}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {session.is_completed ? (
                                  <Badge variant="default" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    In Progress
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(session.created_at).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/dashboard/teacher/quizzes/session/${session.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default TeacherQuizManagement;

