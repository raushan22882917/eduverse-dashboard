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
  FileText
} from "lucide-react";

const ContentDetail = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { contentId } = useParams();
  const { toast } = useToast();
  const [content, setContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [preview, setPreview] = useState<any>(null);

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
    if (!contentId) return;
    
    setLoadingContent(true);
    try {
      // Fetch content from database
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("id", contentId)
        .single();

      if (error) {
        throw error;
      }

      setContent(data);

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

          {/* Content Body */}
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

