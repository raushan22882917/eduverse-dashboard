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
  BookOpen, 
  FileText,
  Search,
  Filter,
  Calendar,
  Tag,
  Loader2,
  Eye
} from "lucide-react";

const ContentLibrary = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<any[]>([]);
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
    if (!user) return;
    
    setLoadingContent(true);
    try {
      let query = supabase
        .from("content")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      // Apply filters
      if (selectedSubject !== "all") {
        query = query.eq("subject", selectedSubject);
      }

      if (selectedType !== "all") {
        query = query.eq("type", selectedType);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

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

  const filteredContent = content.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.content_text?.toLowerCase().includes(query) ||
      item.chapter?.toLowerCase().includes(query)
    );
  });

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
        return "PYQ";
      case "hots":
        return "HOTS";
      default:
        return type?.toUpperCase() || "Content";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
            <h1 className="text-3xl font-bold mb-2">Content Library</h1>
            <p className="text-muted-foreground">Browse and access all available learning content</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                      placeholder="Search content..."
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
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid */}
          {filteredContent.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Content Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedSubject !== "all" || selectedType !== "all"
                    ? "Try adjusting your filters"
                    : "No content has been uploaded yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getTypeColor(item.type)}>
                        {getTypeLabel(item.type)}
                      </Badge>
                      {item.difficulty && (
                        <Badge variant="outline" className="text-xs">
                          {item.difficulty}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {item.title || `${getTypeLabel(item.type)} Content`}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-xs">
                      <span className="capitalize">{item.subject}</span>
                      {item.chapter && (
                        <>
                          <span>•</span>
                          <span>{item.chapter}</span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {truncateText(item.content_text)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                      {item.topic_id && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>Topic</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/dashboard/student/content/${item.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Content
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats */}
          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Showing {filteredContent.length} of {content.length} content items
                </span>
                {content.length >= 50 && (
                  <span className="text-muted-foreground">
                    Showing first 50 results
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ContentLibrary;

