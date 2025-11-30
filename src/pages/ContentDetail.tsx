import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { 
  ArrowLeft,
  BookOpen,
  Calendar,
  Tag,
  Loader2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  MessageSquare,
  Lightbulb,
  Brain,
  Send
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ContentDetail = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { contentId } = useParams();
  const { toast } = useToast();
  const [content, setContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [preview, setPreview] = useState<any>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("pending");
  const [ragInsights, setRagInsights] = useState<any>(null);
  
  // AI-powered features state
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string; content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && contentId) {
      fetchContent();
    }
  }, [user, contentId]);

  const fetchContent = async () => {
    if (!contentId || !user) return;
    
    setLoadingContent(true);
    try {
      // Open content with RAG processing
      try {
        const contentResult = await api.admin.openContent({
          content_id: contentId,
          user_id: user.id,
          trigger_processing: true
        });
        
        setContentData(contentResult);
        setContent(contentResult.content);
        setProcessingStatus(contentResult.processing_status || "pending");
        setRagInsights(contentResult.rag_insights);
        
        // If processing is in progress, poll for updates
        if (contentResult.processing_status === "processing") {
          pollProcessingStatus();
        }
      } catch (apiError) {
        console.log("API openContent failed, falling back to direct fetch:", apiError);
        // Fallback to direct database fetch
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .eq("id", contentId)
          .single();

        if (error) {
          throw error;
        }

        setContent(data);
        setProcessingStatus(data.processing_status || "pending");
      }

      // Try to get preview from API
      try {
        const previewData = await api.admin.previewContent(contentId);
        setPreview(previewData);
      } catch (previewError) {
        console.log("Preview not available:", previewError);
      }
    } catch (error: any) {
      console.error("Error fetching content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load content",
      });
      navigate("/dashboard/student/content");
    } finally {
      setLoadingContent(false);
    }
  };

  const pollProcessingStatus = async () => {
    // Poll every 3 seconds for processing status
    const interval = setInterval(async () => {
      if (!contentId || !user) {
        clearInterval(interval);
        return;
      }
      
      try {
        const result = await api.admin.openContent({
          content_id: contentId,
          user_id: user.id,
          trigger_processing: false
        });
        
        setProcessingStatus(result.processing_status || "pending");
        setRagInsights(result.rag_insights);
        
        if (result.processing_status === "completed" || result.processing_status === "failed") {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error polling processing status:", error);
      }
    }, 3000);
    
    // Clear interval after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ncert":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "pyq":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "hots":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ncert":
        return "NCERT";
      case "pyq":
        return "Previous Year Question";
      case "hots":
        return "HOTS Question";
      default:
        return type?.toUpperCase() || "Content";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // AI-powered functions
  const generateAIQuestions = async () => {
    if (!content || generatingQuestions) return;
    
    setGeneratingQuestions(true);
    try {
      const prompt = `Generate 5 important questions based on this educational content:

Title: ${content.title || "Content"}
Subject: ${content.subject}
${content.chapter ? `Chapter: ${content.chapter}` : ""}
Content: ${(content.content_text || "").substring(0, 2000)}

Generate questions that test understanding of key concepts. Format as JSON array with question and explanation fields.`;

      const response = await api.rag.query({
        query: prompt,
        subject: content.subject as any,
        top_k: 3,
      });

      // Parse questions from response
      const questionsText = response.generated_text || "";
      const questions = parseQuestionsFromText(questionsText);
      setAiQuestions(questions);
      
      toast({
        title: "Questions Generated",
        description: "AI has generated questions based on this content",
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

  const parseQuestionsFromText = (text: string): any[] => {
    const questions: any[] = [];
    const questionPattern = /(?:Q\d+|Question\s+\d+|^\d+[\.\)])\s*[:\-]?\s*(.+?)(?=(?:Q\d+|Question\s+\d+|^\d+[\.\)])|$)/gis;
    const matches = [...text.matchAll(questionPattern)];
    
    matches.forEach((match, index) => {
      const questionText = match[1]?.trim();
      if (questionText && questionText.length > 10) {
        questions.push({
          id: `q${index + 1}`,
          question: questionText,
          explanation: `This question tests understanding of key concepts from the content.`,
        });
      }
    });

    // Fallback: split by paragraphs
    if (questions.length === 0) {
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
      paragraphs.slice(0, 5).forEach((para, index) => {
        questions.push({
          id: `q${index + 1}`,
          question: para.trim(),
          explanation: "Generated question based on content",
        });
      });
    }

    return questions.slice(0, 5);
  };

  const generateAISummary = async () => {
    if (!content || generatingSummary) return;
    
    setGeneratingSummary(true);
    try {
      const prompt = `Provide a comprehensive summary of this educational content:

Title: ${content.title || "Content"}
Subject: ${content.subject}
${content.chapter ? `Chapter: ${content.chapter}` : ""}
Content: ${(content.content_text || "").substring(0, 3000)}

Create a well-structured summary highlighting:
1. Main topics covered
2. Key concepts
3. Important points
4. Learning objectives`;

      const response = await api.rag.query({
        query: prompt,
        subject: content.subject as any,
        top_k: 5,
      });

      setAiSummary(response.generated_text || "Summary not available");
      
      toast({
        title: "Summary Generated",
        description: "AI has generated a summary of this content",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate summary",
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !content || sendingMessage) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setSendingMessage(true);

    try {
      const prompt = `You are an AI tutor helping a student understand this content:

Title: ${content.title || "Educational Content"}
Subject: ${content.subject}
${content.chapter ? `Chapter: ${content.chapter}` : ""}
Content Preview: ${(content.content_text || "").substring(0, 2000)}

Student's question: ${userMessage}

Provide a helpful, clear explanation.`;

      const response = await api.rag.query({
        query: prompt,
        subject: content.subject as any,
        top_k: 5,
      });

      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: response.generated_text || "I'm here to help!"
      }]);
    } catch (error: any) {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading || loadingContent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Content Not Found</h3>
          <Button onClick={() => navigate("/dashboard/student/content")}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/student/content")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>

          {/* Content Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <Badge className={getTypeColor(content.type)}>
                  {getTypeLabel(content.type)}
                </Badge>
                {content.difficulty && (
                  <Badge variant="outline">
                    {content.difficulty}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">
                {content.title || `${getTypeLabel(content.type)} Content`}
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="capitalize font-medium">{content.subject}</span>
                {content.chapter && (
                  <>
                    <span>•</span>
                    <span>{content.chapter}</span>
                  </>
                )}
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(content.created_at)}</span>
                </div>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Processing Status */}
          {processingStatus && processingStatus !== "completed" && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {processingStatus === "processing" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <div>
                        <p className="font-medium">Processing PDF with AI...</p>
                        <p className="text-sm text-muted-foreground">
                          Extracting text, generating embeddings, and indexing content for better understanding
                        </p>
                      </div>
                    </>
                  ) : processingStatus === "failed" ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-red-500">Processing Failed</p>
                        <p className="text-sm text-muted-foreground">
                          Unable to process PDF. Please try again later.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Processing Pending</p>
                        <p className="text-sm text-muted-foreground">
                          PDF will be processed when you open it
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* RAG Insights */}
          {ragInsights && processingStatus === "completed" && (
            <Card className="mb-6 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>
                  Key concepts and important points extracted using AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-sm leading-relaxed">{ragInsights.summary}</p>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Confidence: {(ragInsights.confidence * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span>{ragInsights.sources_count} sources analyzed</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PDF Viewer or Content Body */}
          {contentData?.file_url && contentData.file_type === "pdf" ? (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>PDF Document</CardTitle>
                  <div className="flex items-center gap-2">
                    {processingStatus === "completed" && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(contentData.file_url, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                  <iframe
                    src={contentData.file_url}
                    className="w-full h-full"
                    title="PDF Viewer"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">
                    {content.content_text}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Chunks (if available) */}
          {preview && preview.chunks && preview.chunks.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Content Chunks</CardTitle>
                <CardDescription>
                  How this content is split for AI retrieval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {preview.chunks.map((chunk: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          Chunk {index + 1}
                        </Badge>
                        {chunk.metadata?.chunk_index !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            Index: {chunk.metadata.chunk_index}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{chunk.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI-Powered Features */}
          <Card className="mt-6 border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                AI-Powered Learning Assistant
              </CardTitle>
              <CardDescription>
                Get AI-generated questions, summaries, and ask questions about this content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="questions" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Questions
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Ask AI
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4">
                  {!aiSummary ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate an AI-powered summary of this content
                      </p>
                      <Button
                        onClick={generateAISummary}
                        disabled={generatingSummary}
                        className="bg-gradient-to-r from-primary to-primary/90"
                      >
                        {generatingSummary ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Summary
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/50 p-4 rounded-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {aiSummary}
                        </ReactMarkdown>
                      </div>
                      <Button
                        variant="outline"
                        onClick={generateAISummary}
                        disabled={generatingSummary}
                        size="sm"
                      >
                        Regenerate Summary
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="questions" className="mt-4">
                  {aiQuestions.length === 0 ? (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate AI-powered questions to test your understanding
                      </p>
                      <Button
                        onClick={generateAIQuestions}
                        disabled={generatingQuestions}
                        className="bg-gradient-to-r from-primary to-primary/90"
                      >
                        {generatingQuestions ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Questions
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiQuestions.map((q, index) => (
                        <Card key={q.id}>
                          <CardHeader>
                            <CardTitle className="text-base">
                              Question {index + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-3">{q.question}</p>
                            {q.explanation && (
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                  <strong>Note:</strong> {q.explanation}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      <Button
                        variant="outline"
                        onClick={generateAIQuestions}
                        disabled={generatingQuestions}
                        size="sm"
                        className="w-full"
                      >
                        Generate New Questions
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                  <div className="space-y-4">
                    <ScrollArea className="h-[300px] border rounded-lg p-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Ask questions about this content</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatMessages.map((msg, index) => (
                            <div
                              key={index}
                              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                {msg.role === "assistant" ? (
                                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="text-sm">{msg.content}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {sendingMessage && (
                            <div className="flex justify-start">
                              <div className="bg-muted rounded-lg p-3">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask about this content..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChatMessage();
                          }
                        }}
                        disabled={sendingMessage}
                      />
                      <Button
                        onClick={handleSendChatMessage}
                        disabled={!chatInput.trim() || sendingMessage}
                        className="bg-gradient-to-r from-primary to-primary/90"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Metadata */}
          {content.metadata && Object.keys(content.metadata).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(content.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContentDetail;

