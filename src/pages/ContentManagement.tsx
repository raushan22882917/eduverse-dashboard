import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  FileText, 
  Video,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ContentManagement = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({});
  
  // Unified form state
  const [contentType, setContentType] = useState("ncert");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [chapterNumber, setChapterNumber] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [contentText, setContentText] = useState("");
  const [classGrade, setClassGrade] = useState<number | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [contentMetadata, setContentMetadata] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Poll for indexing progress
  const pollContentStatus = async (contentId: string, maxAttempts: number = 60) => {
    // Skip polling for localStorage-generated content IDs
    if (contentId.startsWith('content_')) {
      console.log('Skipping polling for localStorage content:', contentId);
      setUploadProgress(prev => ({ ...prev, [contentId]: 100 }));
      setUploadStatus(prev => ({ ...prev, [contentId]: "completed" }));
      return;
    }

    let attempts = 0;
    const pollInterval = 2000; // Poll every 2 seconds
    
    const poll = async () => {
      try {
        const status = await api.admin.getContentStatus(contentId);
        setUploadProgress(prev => ({ ...prev, [contentId]: status.indexing_progress }));
        setUploadStatus(prev => ({ ...prev, [contentId]: status.processing_status }));
        
        if (status.processing_status === "completed" || status.processing_status === "failed") {
          // Stop polling when complete or failed
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error("Error polling content status:", error);
        // Stop polling on repeated errors to avoid spam
        if (attempts >= 3) {
          console.warn(`Stopping polling for ${contentId} after ${attempts} failed attempts`);
          setUploadStatus(prev => ({ ...prev, [contentId]: "error" }));
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        }
      }
    };
    
    // Start polling after a short delay
    setTimeout(poll, 1000);
  };

  const handleUpload = async () => {
    // Validate: must have either file or content text, and subject is required
    if (!file && !contentText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide either a file or content text (or both)",
      });
      return;
    }

    if (!subject) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a subject",
      });
      return;
    }

    setUploading(true);
    try {
      // Prepare metadata
      let metadata: any = {};
      if (contentMetadata.trim()) {
        try {
          metadata = JSON.parse(contentMetadata);
        } catch (e) {
          metadata = { notes: contentMetadata };
        }
      }
      
      // Add chapter_number and class_grade to metadata
      if (chapterNumber) metadata.chapter_number = chapterNumber;
      if (classGrade) metadata.class_grade = classGrade;
      if (title) metadata.title = title; // Keep in metadata for now, backend will handle

      // If both file and text are provided, upload file first then update with combined text
      if (file && contentText.trim()) {
        // Upload file first
        const fileResult = await api.admin.uploadContentFile({
          file: file,
          subject: subject,
          chapter: chapter || undefined,
          topic_ids: topicIds.length > 0 ? topicIds : undefined,
          class_grade: classGrade,
          difficulty: difficulty && difficulty !== "none" ? difficulty : undefined,
        });

        // Get the content ID from file upload response
        const contentId = fileResult.content?.id || fileResult.id;
        
        // Start polling for progress
        if (contentId) {
          setUploadProgress(prev => ({ ...prev, [contentId]: 0 }));
          setUploadStatus(prev => ({ ...prev, [contentId]: "pending" }));
          pollContentStatus(contentId);
        }
        
        // Fetch the extracted text from the file
        let extractedText = "";
        try {
          const contentResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/content/${contentId}`);
          if (contentResponse.ok) {
            const contentData = await contentResponse.json();
            extractedText = contentData.content_text || "";
          }
        } catch (e) {
          console.warn("Could not fetch extracted text:", e);
        }

        // Combine extracted text with user-provided text
        const combinedText = extractedText 
          ? `${extractedText}\n\n--- Additional Content ---\n\n${contentText}`
          : contentText;
        
        // Update content with combined text and other metadata
        try {
          await api.admin.updateContent({
            content_id: contentId,
            title: title || undefined,
            chapter: chapter || undefined,
            difficulty: difficulty && difficulty !== "none" ? difficulty : undefined,
            class_grade: classGrade,
            chapter_number: chapterNumber,
            metadata: metadata,
          });
        } catch (updateError) {
          console.warn('Failed to update content metadata:', updateError);
          // Continue with the process even if update fails
        }

        // Update content_text via direct Supabase call
        try {
          const { error: updateError } = await supabase
            .from("content")
            .update({ content_text: combinedText })
            .eq("id", contentId);

          if (updateError) {
            console.warn("Failed to update content_text:", updateError);
          }
        } catch (updateError) {
          console.warn("Failed to update content text:", updateError);
        }

        const isOfflineMode = contentId && contentId.startsWith('content_');
        toast({
          title: "Success",
          description: isOfflineMode 
            ? "File and content saved locally! (Backend temporarily unavailable)" 
            : "File and content uploaded successfully!",
        });
      } 
      // If only file is provided
      else if (file) {
        const result = await api.admin.uploadContentFile({
          file: file,
          subject: subject,
          chapter: chapter || undefined,
          topic_ids: topicIds.length > 0 ? topicIds : undefined,
          class_grade: classGrade,
          difficulty: difficulty && difficulty !== "none" ? difficulty : undefined,
        });

        // Update with metadata if provided
        if (Object.keys(metadata).length > 0 || title || chapter || difficulty) {
          try {
            await api.admin.updateContent({
              content_id: result.content?.id || result.id,
              title: title || undefined,
              chapter: chapter || undefined,
              difficulty: difficulty && difficulty !== "none" ? difficulty : undefined,
              class_grade: classGrade,
              chapter_number: chapterNumber,
              metadata: metadata,
            });
          } catch (updateError) {
            console.warn('Failed to update content metadata:', updateError);
            // Continue with the process even if update fails
          }
        }

        // Start polling for progress
        const resultId = result.content?.id || result.id;
        if (resultId) {
          setUploadProgress(prev => ({ ...prev, [resultId]: 0 }));
          setUploadStatus(prev => ({ ...prev, [resultId]: "pending" }));
          pollContentStatus(resultId);
        }

        const isOfflineMode = resultId && resultId.startsWith('content_');
        toast({
          title: "Success",
          description: isOfflineMode 
            ? "File saved locally! (Backend temporarily unavailable)" 
            : (result.message || "File uploaded successfully! Indexing in progress..."),
        });
      } 
      // If only text is provided
      else {
        // Prepare the request body matching ContentUploadRequest model
        const requestBody: any = {
          type: contentType,
          subject: subject,
          content_text: contentText,
          metadata: metadata,
        };
        
        if (chapter) requestBody.chapter = chapter;
        if (title) requestBody.title = title;
        if (difficulty && difficulty !== "none") requestBody.difficulty = difficulty;
        if (topicIds.length > 0) requestBody.topic_ids = topicIds;
        if (classGrade) requestBody.metadata = { ...metadata, class_grade: classGrade };
        if (chapterNumber) requestBody.metadata = { ...requestBody.metadata, chapter_number: chapterNumber };

        // Get content ID from response if available
        const responseData = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/content/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to upload content' }));
            throw new Error(errorData.detail || errorData.message || 'Failed to upload content');
          }
          return response.json();
        });

        // Start polling for progress
        if (responseData.id) {
          setUploadProgress(prev => ({ ...prev, [responseData.id]: 0 }));
          setUploadStatus(prev => ({ ...prev, [responseData.id]: "pending" }));
          pollContentStatus(responseData.id);
        }

        const isOfflineMode = responseData.id && responseData.id.startsWith('content_');
        toast({
          title: "Success",
          description: isOfflineMode 
            ? "Content saved locally! (Backend temporarily unavailable)" 
            : "Content uploaded successfully! Indexing in progress...",
        });
      }

      // Reset form
      setContentText("");
      setContentMetadata("");
      setTitle("");
      setChapter("");
      setChapterNumber(undefined);
      setDifficulty("");
      setTopicIds([]);
      setFile(null);
      setClassGrade(undefined);
      setSubject("");
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error.data?.error?.message || error.data?.detail || error.message || "Failed to upload content";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReindex = async () => {
    setUploading(true);
    try {
      await api.admin.reindexContent();
      toast({
        title: "Success",
        description: "Content reindexing started!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reindex content",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Content Management</h1>
                <p className="text-muted-foreground">Upload and manage educational content</p>
              </div>
              <Button asChild variant="outline">
                <Link to="/dashboard/admin/content/manage">
                  <FileText className="h-4 w-4 mr-2" />
                  Manage All Content
                </Link>
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="upload">Upload Content</TabsTrigger>
              <TabsTrigger value="manage" onClick={() => navigate("/dashboard/admin/content/manage")}>
                Manage All Content
              </TabsTrigger>
              <TabsTrigger value="reindex">Reindex Content</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              {/* Unified Content Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Content
                  </CardTitle>
                  <CardDescription>
                    Upload a file, write content text, or do both together. At least one is required.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content Type *</label>
                      <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ncert">NCERT</SelectItem>
                          <SelectItem value="pyq">Previous Year Question</SelectItem>
                          <SelectItem value="hots">HOTS Question</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject *</label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="physics">Physics</SelectItem>
                          <SelectItem value="chemistry">Chemistry</SelectItem>
                          <SelectItem value="biology">Biology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title (Optional)</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Content title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chapter Name (Optional)</label>
                      <Input
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                        placeholder="Chapter name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chapter Number (Optional)</label>
                      <Input
                        type="number"
                        value={chapterNumber || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          setChapterNumber(value);
                        }}
                        placeholder="Chapter number"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Class/Grade (Optional)</label>
                      <Input
                        type="number"
                        placeholder="e.g., 8, 9, 10, 11, 12"
                        value={classGrade || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          setClassGrade(value);
                        }}
                        min="1"
                        max="12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Difficulty (Optional)</label>
                      <Select value={difficulty || undefined} onValueChange={setDifficulty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Topic IDs (Optional)</label>
                      <Input
                        placeholder="topic-id-1, topic-id-2"
                        value={topicIds.join(", ")}
                        onChange={(e) => {
                          const ids = e.target.value.split(",").map(id => id.trim()).filter(Boolean);
                          setTopicIds(ids);
                        }}
                      />
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">File Upload (Optional)</label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" asChild>
                          <span>Choose File</span>
                        </Button>
                      </label>
                      {file && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">{file.name}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFile(null)}
                            className="mt-1"
                          >
                            Remove File
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload PDF, DOCX, or TXT file. Text will be extracted automatically.
                      </p>
                    </div>
                  </div>

                  {/* Content Text Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Content Text (Optional - Required if no file is uploaded)
                    </label>
                    <Textarea
                      placeholder="Enter content here... (or upload a file, or do both)"
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      rows={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      {file 
                        ? "You can add additional text content here. It will be combined with the file content."
                        : "Enter your content text here, or upload a file above, or do both together."
                      }
                    </p>
                  </div>

                  {/* Metadata Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Metadata (JSON, Optional)</label>
                    <Textarea
                      placeholder='{"author": "Name", "source": "Source"}'
                      value={contentMetadata}
                      onChange={(e) => setContentMetadata(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Upload Button */}
                  <Button 
                    onClick={handleUpload}
                    disabled={uploading || (!file && !contentText.trim()) || !subject}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {file && contentText.trim() 
                          ? "Upload File & Content" 
                          : file 
                          ? "Upload File" 
                          : "Upload Content"}
                      </>
                    )}
                  </Button>

                  {/* Helper Text */}
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      <strong>Tip:</strong> You can upload a file, write text content, or do both together. 
                      If both are provided, the file will be uploaded first and then updated with your additional text content.
                    </p>
                  </div>

                  {/* Indexing Progress Display */}
                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-sm font-medium">Indexing Progress</h3>
                      {Object.entries(uploadProgress).map(([contentId, progress]) => {
                        const status = uploadStatus[contentId] || "pending";
                        return (
                          <div key={contentId} className="space-y-2 p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                Content ID: {contentId.substring(0, 8)}...
                              </span>
                              <span className="text-muted-foreground">
                                {status === "completed" && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Complete
                                  </span>
                                )}
                                {status === "failed" && (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <XCircle className="h-4 w-4" />
                                    Failed
                                  </span>
                                )}
                                {status === "processing" && (
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing
                                  </span>
                                )}
                                {status === "pending" && (
                                  <span className="text-yellow-600">Pending</span>
                                )}
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Status: {status}</span>
                              <span>{progress}% indexed</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reindex">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Reindex Content
                  </CardTitle>
                  <CardDescription>
                    Reindex all content in the vector database for better search results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        <strong>Warning:</strong> Reindexing may take some time and will update all content embeddings.
                        This operation should be performed during low-traffic periods.
                      </p>
                    </div>
                    <Button 
                      onClick={handleReindex}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Reindexing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Start Reindexing
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ContentManagement;

