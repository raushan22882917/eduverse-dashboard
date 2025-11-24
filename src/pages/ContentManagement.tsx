import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { 
  Upload, 
  FileText, 
  Video,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";

const ContentManagement = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploading, setUploading] = useState(false);
  
  // Text content upload
  const [contentType, setContentType] = useState("text");
  const [subject, setSubject] = useState("");
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [contentText, setContentText] = useState("");
  const [contentMetadata, setContentMetadata] = useState("");
  
  // File upload
  const [file, setFile] = useState<File | null>(null);
  const [fileSubject, setFileSubject] = useState("");
  const [classGrade, setClassGrade] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleTextUpload = async () => {
    if (!contentText.trim() || !subject) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setUploading(true);
    try {
      let metadata = {};
      if (contentMetadata.trim()) {
        try {
          metadata = JSON.parse(contentMetadata);
        } catch (e) {
          metadata = { notes: contentMetadata };
        }
      }

      await api.admin.uploadContent({
        content_type: contentType,
        subject: subject,
        topic_ids: topicIds,
        content: contentText,
        metadata: metadata,
      });

      toast({
        title: "Success",
        description: "Content uploaded successfully!",
      });

      // Reset form
      setContentText("");
      setContentMetadata("");
      setTopicIds([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload content",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file || !fileSubject) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file and subject",
      });
      return;
    }

    setUploading(true);
    try {
      const result = await api.admin.uploadContentFile({
        file: file,
        subject: fileSubject,
        topic_ids: topicIds.length > 0 ? topicIds : undefined,
        class_grade: classGrade,
      });

      toast({
        title: "Success",
        description: result.message || "File uploaded successfully!",
      });

      // Reset form
      setFile(null);
      setTopicIds([]);
    } catch (error: any) {
      console.error("Upload error:", error);
      // Handle both old format (data.detail) and new format (data.error.message)
      const errorMessage = error.data?.error?.message || error.data?.detail || error.message || "Failed to upload file";
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
            <h1 className="text-3xl font-bold mb-2">Content Management</h1>
            <p className="text-muted-foreground">Upload and manage educational content</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="upload">Upload Content</TabsTrigger>
              <TabsTrigger value="reindex">Reindex Content</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              {/* Text Content Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Upload Text Content
                  </CardTitle>
                  <CardDescription>Add new educational content as text</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content Type</label>
                      <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="ncert">NCERT</SelectItem>
                          <SelectItem value="pyq">Previous Year Question</SelectItem>
                          <SelectItem value="hots">HOTS Question</SelectItem>
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic IDs (comma-separated)</label>
                    <Input
                      placeholder="topic-id-1, topic-id-2"
                      value={topicIds.join(", ")}
                      onChange={(e) => {
                        const ids = e.target.value.split(",").map(id => id.trim()).filter(Boolean);
                        setTopicIds(ids);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content *</label>
                    <Textarea
                      placeholder="Enter content here..."
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      rows={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Metadata (JSON, optional)</label>
                    <Textarea
                      placeholder='{"author": "Name", "source": "Source"}'
                      value={contentMetadata}
                      onChange={(e) => setContentMetadata(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleTextUpload}
                    disabled={uploading || !contentText.trim() || !subject}
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
                        Upload Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Upload File
                  </CardTitle>
                  <CardDescription>Upload content from a file (PDF, DOCX, etc.)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject *</label>
                      <Select value={fileSubject} onValueChange={setFileSubject}>
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
                      <p className="text-xs text-muted-foreground">
                        Files will be stored in: class_{classGrade || "general"}/{fileSubject || "subject"}/
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">File</label>
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
                        <p className="mt-2 text-sm text-muted-foreground">{file.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic ID (UUID, optional)</label>
                    <Input
                      placeholder="Enter topic UUID (leave empty if unknown)"
                      value={topicIds.join(", ")}
                      onChange={(e) => {
                        const ids = e.target.value.split(",").map(id => id.trim()).filter(Boolean);
                        setTopicIds(ids);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a valid topic UUID. Topic names are not supported. Leave empty if you don't have the UUID.
                    </p>
                  </div>

                  <Button 
                    onClick={handleFileUpload}
                    disabled={uploading || !file || !fileSubject}
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
                        Upload File
                      </>
                    )}
                  </Button>
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

