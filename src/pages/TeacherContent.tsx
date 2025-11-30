import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TeacherSidebar from "@/components/TeacherSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  BookOpen,
  Search,
  Loader2,
  Eye,
  FileText,
  FileQuestion,
  Sparkles,
  Filter
} from "lucide-react";

const TeacherContent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [content, setContent] = useState<any[]>([]);
  const [filteredContent, setFilteredContent] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchContent();
    }
  }, [user, subjectFilter, typeFilter]);

  useEffect(() => {
    filterContent();
  }, [searchQuery, content]);

  const fetchContent = async () => {
    try {
      setLoadingContent(true);
      const params: any = {
        limit: 100,
        offset: 0
      };

      if (subjectFilter !== "all") {
        params.subject = subjectFilter;
      }

      if (typeFilter !== "all") {
        params.content_type = typeFilter;
      }

      const data = await api.admin.listAllContent(params);
      setContent(data || []);
      setFilteredContent(data || []);
    } catch (error: any) {
      console.error("Error fetching content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch content",
      });
    } finally {
      setLoadingContent(false);
    }
  };

  const filterContent = () => {
    if (!searchQuery.trim()) {
      setFilteredContent(content);
      return;
    }

    const filtered = content.filter((item) =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chapter?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredContent(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ncert":
        return <BookOpen className="h-4 w-4" />;
      case "pyq":
        return <FileQuestion className="h-4 w-4" />;
      case "hots":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "ncert":
        return "bg-blue-500/10 text-blue-500";
      case "pyq":
        return "bg-purple-500/10 text-purple-500";
      case "hots":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-gray-500/10 text-gray-500";
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              View Content
            </h1>
            <p className="text-muted-foreground">
              Browse and view all learning content available to students
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Content Type" />
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

          {/* Content List */}
          <Card>
            <CardHeader>
              <CardTitle>Content Library ({filteredContent.length})</CardTitle>
              <CardDescription>All available learning content</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContent.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No content found
                    </div>
                  ) : (
                    filteredContent.map((item) => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={getTypeBadgeColor(item.type)}>
                                  {getTypeIcon(item.type)}
                                </div>
                                <Badge className={getTypeBadgeColor(item.type)}>
                                  {item.type.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {item.subject}
                                </Badge>
                                {item.difficulty && (
                                  <Badge variant="secondary" className="capitalize">
                                    {item.difficulty}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-lg mb-1">
                                {item.title || `Content ${item.id.slice(0, 8)}`}
                              </h3>
                              {item.chapter && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  Chapter: {item.chapter}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.content_text?.substring(0, 200)}...
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dashboard/student/content/${item.id}`)}
                              className="ml-4"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherContent;

