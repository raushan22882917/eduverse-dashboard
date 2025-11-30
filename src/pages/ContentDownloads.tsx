import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  FileText,
  Search,
  Filter,
  BookOpen,
  FileQuestion,
  Brain,
  Video,
  Loader2,
  FileDown,
  Calendar,
  Tag
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SubjectType = "mathematics" | "physics" | "chemistry" | "biology";
type ContentType = "ncert" | "pyq" | "hots" | "video";

interface ContentItem {
  id: string;
  type: ContentType;
  subject: SubjectType;
  chapter: string | null;
  title: string | null;
  content_text: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  file_url?: string;
  file_type?: string;
}

const ContentDownloads = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchContent();
    }
  }, [user, selectedSubject, selectedType]);

  const fetchContent = async () => {
    try {
      setLoadingContent(true);
      let query = supabase
        .from("content")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedSubject !== "all") {
        query = query.eq("subject", selectedSubject);
      }

      if (selectedType !== "all") {
        query = query.eq("type", selectedType);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContent(data || []);
    } catch (error: any) {
      console.error("Error fetching content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load content",
      });
    } finally {
      setLoadingContent(false);
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case "ncert":
        return <BookOpen className="h-4 w-4" />;
      case "pyq":
        return <FileQuestion className="h-4 w-4" />;
      case "hots":
        return <Brain className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeBadge = (type: ContentType) => {
    const badges = {
      ncert: { label: "NCERT", variant: "default" as const },
      pyq: { label: "PYQ", variant: "secondary" as const },
      hots: { label: "HOTS", variant: "outline" as const },
      video: { label: "Video", variant: "default" as const },
    };
    return badges[type] || { label: type.toUpperCase(), variant: "outline" as const };
  };

  const getPdfUrl = (item: ContentItem): string | null => {
    if (item.file_url) {
      return item.file_url;
    }
    if (item.metadata?.file_url) {
      return item.metadata.file_url;
    }
    if (item.metadata?.pdf_url) {
      return item.metadata.pdf_url;
    }
    return null;
  };

  const handleDownload = async (item: ContentItem) => {
    try {
      const pdfUrl = getPdfUrl(item);
      
      if (pdfUrl) {
        // Open PDF in new tab for download
        window.open(pdfUrl, "_blank");
        toast({
          title: "Download Started",
          description: "The file will open in a new tab",
        });
      } else {
        // Download as text file
        const blob = new Blob([item.content_text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${item.title || item.type}_${item.subject}_${item.id.substring(0, 8)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Downloaded",
          description: "Content downloaded as text file",
        });
      }
    } catch (error: any) {
      console.error("Error downloading content:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message || "Failed to download content",
      });
    }
  };

  const filteredContent = content.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading || loadingContent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <h1 className="text-3xl font-bold mb-2">Content Downloads</h1>
            <p className="text-muted-foreground">
              Browse and download all available content (NCERT, PYQ, HOTS, Videos)
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title, chapter, or content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ncert">NCERT</SelectItem>
                    <SelectItem value="pyq">PYQ</SelectItem>
                    <SelectItem value="hots">HOTS</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Content</CardTitle>
                  <CardDescription>
                    {filteredContent.length} {filteredContent.length === 1 ? "item" : "items"} found
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredContent.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No content found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters or search query
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Chapter</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map((item) => {
                        const typeBadge = getContentTypeBadge(item.type);
                        const pdfUrl = getPdfUrl(item);
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {getContentTypeIcon(item.type)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[300px]">
                                <p className="font-medium truncate">
                                  {item.title || `${item.type.toUpperCase()} Content`}
                                </p>
                                {item.title && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">
                                    {item.content_text.substring(0, 60)}...
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.subject.charAt(0).toUpperCase() + item.subject.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.chapter ? (
                                <span className="text-sm">{item.chapter}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={typeBadge.variant}>
                                {typeBadge.label}
                              </Badge>
                              {pdfUrl && (
                                <Badge variant="secondary" className="ml-2">
                                  PDF
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.created_at)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(item)}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ContentDownloads;


