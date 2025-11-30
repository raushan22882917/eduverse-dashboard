import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { parseMCQ, hasMultipleMCQs, splitMultipleMCQs } from "@/utils/mcqParser";
import { 
  BookOpen, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import "katex/dist/katex.min.css";

const Homework = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignedHomework, setAssignedHomework] = useState<any[]>([]);
  const [loadingHomework, setLoadingHomework] = useState(false);

  useEffect(() => {
    fetchAssignedHomework();
  }, []);

  const fetchAssignedHomework = async () => {
    try {
      setLoadingHomework(true);
      // Fetch ALL homework sessions from homework_sessions table (no user filter)
      console.log("Fetching all homework sessions...");
      const data = await api.homework.getSessions({ limit: 1000 });
      console.log("Homework sessions received:", data);
      
      // Show all homework sessions from the table
      setAssignedHomework(data || []);
    } catch (error: any) {
      console.error("Error fetching homework sessions:", error);
      
      // Check if it's a connection error
      const isConnectionError = 
        error?.message?.includes("Failed to fetch") || 
        error?.message?.includes("ERR_CONNECTION_REFUSED") ||
        error?.name === "TypeError";
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: isConnectionError 
          ? "Backend server is not running. Please start the backend server at http://localhost:8000"
          : "Failed to load homework. Please try again later.",
      });
    } finally {
      setLoadingHomework(false);
    }
  };


  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Homework</h1>
            <p className="text-muted-foreground">View and complete homework assigned by your teachers</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Homework List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Assigned Homework ({assignedHomework.length})
                  </CardTitle>
                  <CardDescription>Your homework sessions and assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHomework ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : assignedHomework.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No homework sessions</p>
                      <p className="text-sm">No homework sessions found in the database</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {assignedHomework.map((hw) => (
                        <Card
                          key={hw.id}
                          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
                          onClick={() => {
                            navigate(`/dashboard/student/homework/submit/${hw.id}`);
                          }}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <Badge variant="secondary" className="capitalize shrink-0">
                                {hw.subject}
                              </Badge>
                              {hw.is_complete ? (
                                <Badge variant="default" className="gap-1 shrink-0">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Completed
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1 shrink-0">
                                  <AlertCircle className="h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {(() => {
                                const questionPreview = hw.question.length > 500 ? hw.question.substring(0, 500) + "..." : hw.question;
                                
                                // Check if it's MCQ format
                                if (hasMultipleMCQs(hw.question)) {
                                  const mcqs = splitMultipleMCQs(hw.question);
                                  return (
                                    <div className="space-y-4">
                                      {mcqs.slice(0, 2).map((mcq, idx) => (
                                        <div key={idx} className="border-l-2 border-primary pl-3 py-2">
                                          {mcq.questionNumber && (
                                            <div className="font-semibold mb-2">Question {mcq.questionNumber}</div>
                                          )}
                                          <div className="mb-2">
                                            <ReactMarkdown
                                              remarkPlugins={[remarkMath, remarkGfm]}
                                              rehypePlugins={[rehypeKatex]}
                                            >
                                              {mcq.questionText}
                                            </ReactMarkdown>
                                          </div>
                                          <RadioGroup disabled className="space-y-2">
                                            {mcq.options.map((option) => (
                                              <div key={option.label} className="flex items-center space-x-2">
                                                <RadioGroupItem value={option.label} id={`${hw.id}-${idx}-${option.label}`} />
                                                <Label htmlFor={`${hw.id}-${idx}-${option.label}`} className="font-normal cursor-pointer">
                                                  <span className="font-semibold">({option.label})</span> {option.text}
                                                </Label>
                                              </div>
                                            ))}
                                          </RadioGroup>
                                        </div>
                                      ))}
                                      {mcqs.length > 2 && (
                                        <p className="text-sm text-muted-foreground italic">
                                          + {mcqs.length - 2} more question{mcqs.length - 2 > 1 ? 's' : ''}...
                                        </p>
                                      )}
                                    </div>
                                  );
                                }
                                
                                const parsed = parseMCQ(questionPreview);
                                if (parsed.isMCQ) {
                                  return (
                                    <div className="space-y-3">
                                      <div>
                                        <ReactMarkdown
                                          remarkPlugins={[remarkMath, remarkGfm]}
                                          rehypePlugins={[rehypeKatex]}
                                        >
                                          {parsed.questionText}
                                        </ReactMarkdown>
                                      </div>
                                      <RadioGroup disabled className="space-y-2">
                                        {parsed.options.map((option) => (
                                          <div key={option.label} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option.label} id={`${hw.id}-${option.label}`} />
                                            <Label htmlFor={`${hw.id}-${option.label}`} className="font-normal cursor-pointer">
                                              <span className="font-semibold">({option.label})</span> {option.text}
                                            </Label>
                                          </div>
                                        ))}
                                      </RadioGroup>
                                    </div>
                                  );
                                }
                                
                                // Regular markdown display
                                return (
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                      p: ({ children }) => {
                                        const text = String(children);
                                        if (text.length > 300) {
                                          return <p className="mb-2">{text.substring(0, 300)}...</p>;
                                        }
                                        return <p className="mb-2">{children}</p>;
                                      },
                                      h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>,
                                      h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3">{children}</h2>,
                                      h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-2">{children}</h3>,
                                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                      code: ({ children, className }) => {
                                        const isInline = !className;
                                        if (isInline) {
                                          return <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>;
                                        }
                                        return <code className={className}>{children}</code>;
                                      },
                                      pre: ({ children }) => <pre className="bg-muted p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                                    }}
                                  >
                                    {questionPreview}
                                  </ReactMarkdown>
                                );
                              })()}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 pt-2 border-t">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{new Date(hw.created_at).toLocaleDateString()}</span>
                                {hw.hints_revealed > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>Hints: {hw.hints_revealed}/3</span>
                                  </>
                                )}
                                {hw.attempts && Array.isArray(hw.attempts) && hw.attempts.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>Attempts: {hw.attempts.length}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Homework Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Homework Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Total Assigned</p>
                      <p className="text-2xl font-bold">{assignedHomework.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {assignedHomework.filter(hw => hw.is_complete).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {assignedHomework.filter(hw => !hw.is_complete).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homework;

