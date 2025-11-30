import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, Award, Target, Loader2, Eye, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { PerformanceTrend, Subject } from "@/types/exam";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ExamHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | "all">("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, selectedSubject]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params: any = { user_id: user!.id };
      
      if (selectedSubject !== "all") {
        params.subject = selectedSubject;
      }
      
      const data = await api.exam.getHistory(params);
      setPerformanceTrend(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch exam history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubjectColor = (subject: Subject) => {
    const colors = {
      mathematics: "bg-blue-500",
      physics: "bg-purple-500",
      chemistry: "bg-green-500",
      biology: "bg-orange-500",
    };
    return colors[subject] || "bg-gray-500";
  };

  const getSubjectLabel = (subject: Subject) => {
    return subject.charAt(0).toUpperCase() + subject.slice(1);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold mb-2">Exam History</h1>
                <p className="text-muted-foreground">
                  Track your performance and progress over time
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/student/exam/attempts")}
              >
                <FileText className="h-4 w-4 mr-2" />
                View All Attempts Table
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-8">
            <Select
              value={selectedSubject}
              onValueChange={(value) => setSelectedSubject(value as Subject | "all")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {performanceTrend && performanceTrend.test_sessions.length > 0 ? (
            <>
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">
                        {performanceTrend.average_score.toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Improvement Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {performanceTrend.improvement_rate >= 0 ? (
                        <>
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          <span className="text-3xl font-bold text-green-500">
                            +{performanceTrend.improvement_rate.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-5 w-5 text-red-500" />
                          <span className="text-3xl font-bold text-red-500">
                            {performanceTrend.improvement_rate.toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tests Taken</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">
                        {performanceTrend.test_sessions.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strengths & Weaknesses */}
              {(performanceTrend.strengths.length > 0 || performanceTrend.weaknesses.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {performanceTrend.strengths.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {performanceTrend.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span className="text-sm">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {performanceTrend.weaknesses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                          Areas for Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {performanceTrend.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span className="text-sm">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Test History */}
              <Card>
                <CardHeader>
                  <CardTitle>Test History</CardTitle>
                  <CardDescription>
                    Your recent exam attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceTrend.test_sessions.map((session) => (
                      <div
                        key={session.session_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Badge className={`${getSubjectColor(session.subject)} text-white`}>
                            {getSubjectLabel(session.subject)}
                          </Badge>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(session.date), "MMM dd, yyyy 'at' hh:mm a")}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${getGradeColor(session.percentage)}`}>
                              {session.percentage.toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {session.score.toFixed(1)}/{session.total_marks}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/student/exam/results/${session.session_id}`)}
                          className="ml-4"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No exam history yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start taking exams to track your progress
                </p>
                <Button onClick={() => navigate("/dashboard/student/exams")}>
                  Browse Exams
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamHistory;
