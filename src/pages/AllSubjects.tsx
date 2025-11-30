import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { 
  Calculator, 
  Microscope, 
  BookOpen, 
  FlaskConical,
  ArrowRight,
  PlayCircle,
  FileText
} from "lucide-react";

const subjectIcons: Record<string, any> = {
  mathematics: Calculator,
  physics: Microscope,
  chemistry: FlaskConical,
  biology: BookOpen,
};

const subjectColors: Record<string, { text: string; bg: string }> = {
  mathematics: { text: "text-primary", bg: "bg-primary/10" },
  physics: { text: "text-chart-1", bg: "bg-chart-1/10" },
  chemistry: { text: "text-blue-500", bg: "bg-blue-500/10" },
  biology: { text: "text-green-500", bg: "bg-green-500/10" },
};

const AllSubjects = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [progressData, setProgressData] = useState<Record<string, any>>({});
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSubjects();
      fetchProgress();
      fetchDocumentCounts();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      
      // Define all available subjects
      const allSubjectsList = ['mathematics', 'physics', 'chemistry', 'biology'];
      
      // Fetch topics from database
      const { data: topics, error } = await supabase
        .from("topics")
        .select("subject, chapter")
        .order("subject");

      if (error) {
        console.warn("Error fetching topics, showing all subjects anyway:", error);
      }

      // Group topics by subject
      const subjectMap: Record<string, { chapters: Set<string>; totalTopics: number }> = {};
      
      // Initialize all subjects with empty data
      allSubjectsList.forEach(subject => {
        subjectMap[subject] = { chapters: new Set(), totalTopics: 0 };
      });
      
      // Populate with actual data if available
      topics?.forEach((topic: any) => {
        if (subjectMap[topic.subject]) {
          subjectMap[topic.subject].chapters.add(topic.chapter);
          subjectMap[topic.subject].totalTopics += 1;
        }
      });

      // Convert to array format - always show all subjects
      const subjectsList = allSubjectsList.map((subject) => {
        const data = subjectMap[subject] || { chapters: new Set(), totalTopics: 0 };
        return {
          id: subject,
          name: subject.charAt(0).toUpperCase() + subject.slice(1),
          icon: subjectIcons[subject] || BookOpen,
          color: subjectColors[subject]?.text || "text-muted-foreground",
          bgColor: subjectColors[subject]?.bg || "bg-muted",
          description: getSubjectDescription(subject),
          totalChapters: data.chapters.size,
          totalTopics: data.totalTopics,
        };
      });

      setSubjects(subjectsList);
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
      // Even on error, show all subjects with empty data
      const allSubjectsList = ['mathematics', 'physics', 'chemistry', 'biology'];
      const subjectsList = allSubjectsList.map((subject) => ({
        id: subject,
        name: subject.charAt(0).toUpperCase() + subject.slice(1),
        icon: subjectIcons[subject] || BookOpen,
        color: subjectColors[subject]?.text || "text-muted-foreground",
        bgColor: subjectColors[subject]?.bg || "bg-muted",
        description: getSubjectDescription(subject),
        totalChapters: 0,
        totalTopics: 0,
      }));
      setSubjects(subjectsList);
      
      toast({
        variant: "destructive",
        title: "Warning",
        description: "Could not load topic data, but all subjects are available",
      });
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchProgress = async () => {
    if (!user) return;
    
    try {
      const summary = await api.progress.getSummary(user.id);
      // Handle both old and new response formats
      const breakdown = summary?.subject_breakdown || summary?.subjects || {};
      if (Object.keys(breakdown).length > 0) {
        setProgressData(breakdown);
      }
    } catch (error: any) {
      console.error("Error fetching progress:", error);
      // Don't show error toast for progress - it's not critical
      // Progress will just show 0% if fetch fails
    }
  };

  const fetchDocumentCounts = async () => {
    try {
      const allSubjectsList = ['mathematics', 'physics', 'chemistry', 'biology'];
      const counts: Record<string, number> = {};

      // Fetch document counts for each subject (only count items with file_url - uploaded documents)
      for (const subject of allSubjectsList) {
        const { count, error } = await supabase
          .from("content")
          .select("*", { count: "exact", head: true })
          .eq("subject", subject)
          .not("file_url", "is", null);

        if (error) {
          console.warn(`Error fetching document count for ${subject}:`, error);
          counts[subject] = 0;
        } else {
          counts[subject] = count || 0;
        }
      }

      setDocumentCounts(counts);
    } catch (error: any) {
      console.error("Error fetching document counts:", error);
      // Set all counts to 0 on error
      const allSubjectsList = ['mathematics', 'physics', 'chemistry', 'biology'];
      const counts: Record<string, number> = {};
      allSubjectsList.forEach(subject => {
        counts[subject] = 0;
      });
      setDocumentCounts(counts);
    }
  };

  const getSubjectDescription = (subject: string): string => {
    const descriptions: Record<string, string> = {
      mathematics: "Algebra, Geometry, Calculus, and more",
      physics: "Mechanics, Thermodynamics, Electromagnetism",
      chemistry: "Organic Chemistry, Reactions, Equations",
      biology: "Cell Biology, Genetics, Ecology",
    };
    return descriptions[subject] || "Explore and learn";
  };

  const getSubjectProgress = (subject: string): number => {
    const progress = progressData[subject];
    if (!progress) return 0;
    return Math.round(progress.average_mastery || 0);
  };

  const getSubjectStats = (subject: string) => {
    const progress = progressData[subject];
    return {
      topicsAttempted: progress?.topics_attempted || 0,
      totalTopics: subjects.find(s => s.id === subject)?.totalTopics || 0,
    };
  };

  if (loading || loadingSubjects) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">All Subjects</h1>
            <p className="text-muted-foreground">Explore and continue learning across all subjects</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Subjects</CardDescription>
                <CardTitle className="text-2xl">{subjects.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>In Progress</CardDescription>
                <CardTitle className="text-2xl">
                  {subjects.filter(s => getSubjectProgress(s.id) > 0 && getSubjectProgress(s.id) < 100).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Topics</CardDescription>
                <CardTitle className="text-2xl">
                  {subjects.reduce((acc, s) => acc + s.totalTopics, 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Chapters</CardDescription>
                <CardTitle className="text-2xl">
                  {subjects.reduce((acc, s) => acc + s.totalChapters, 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Subjects Grid */}
          {subjects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No subjects available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => {
                const Icon = subject.icon;
                const progress = getSubjectProgress(subject.id);
                const stats = getSubjectStats(subject.id);
                const level = progress < 30 ? "Beginner" : progress < 70 ? "Intermediate" : "Advanced";
                
                return (
                  <Card 
                    key={subject.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/dashboard/student/classroom?subject=${subject.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`${subject.bgColor} p-3 rounded-lg`}>
                          <Icon className={`h-6 w-6 ${subject.color}`} />
                        </div>
                        <Badge variant="secondary">{level}</Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{subject.name}</CardTitle>
                      <CardDescription>{subject.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Mastery</span>
                            <span className="text-sm font-semibold">{progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${subject.color.replace('text-', 'bg-')}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Topics Info */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            {stats.totalTopics > 0 
                              ? `${stats.topicsAttempted} / ${stats.totalTopics} topics`
                              : "No topics yet"}
                          </span>
                          <span>
                            {subject.totalChapters > 0 
                              ? `${subject.totalChapters} chapters`
                              : "No chapters yet"}
                          </span>
                        </div>

                        {/* Documents Count */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                          <FileText className="h-4 w-4" />
                          <span>
                            {documentCounts[subject.id] !== undefined
                              ? `${documentCounts[subject.id]} ${documentCounts[subject.id] === 1 ? 'document' : 'documents'}`
                              : "Loading..."}
                          </span>
                        </div>

                        {/* Action Button */}
                        <Button 
                          className="w-full gap-2" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/student/classroom?subject=${subject.id}`);
                          }}
                        >
                          <PlayCircle className="h-4 w-4" />
                          Start Learning
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AllSubjects;

