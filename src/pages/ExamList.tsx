import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ExamSet, Subject } from "@/types/exam";
import { useToast } from "@/hooks/use-toast";

const ExamList = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | "all">("all");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchExamSets();
  }, [selectedSubject, selectedYear]);

  const fetchExamSets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (selectedSubject !== "all") {
        params.subject = selectedSubject;
      }
      
      if (selectedYear !== "all") {
        params.year = selectedYear;
      }
      
      const data = await api.exam.getSets(params);
      setExamSets(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch exam sets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examSet: ExamSet) => {
    navigate(`/dashboard/student/exam/start/${examSet.id}`);
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
            <h1 className="text-3xl font-bold mb-2">Practice Exams</h1>
            <p className="text-muted-foreground">
              Test your knowledge with previous year questions organized by subject and year
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
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

            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(value === "all" ? "all" : parseInt(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {Array.from({ length: 10 }, (_, i) => 2024 - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Sets Grid */}
          {examSets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No exam sets found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {examSets.map((examSet) => (
                <Card key={examSet.id} className="hover:shadow-lg transition-shadow">
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
                    <CardTitle className="text-xl">
                      {getSubjectLabel(examSet.subject)} {examSet.year}
                    </CardTitle>
                    <CardDescription>
                      Previous Year Question Paper
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{examSet.questions.length} Questions</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{examSet.duration_minutes} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>Total Marks: {examSet.total_marks}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => handleStartExam(examSet)}
                    >
                      <span>Start Exam</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamList;
