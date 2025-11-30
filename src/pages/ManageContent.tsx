import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  FileText,
  Search,
  Filter,
  Calendar,
  Tag,
  Loader2,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Folder,
  Download,
  MoreVertical,
  Plus,
  Upload
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ManageContent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editChapter, setEditChapter] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editClassGrade, setEditClassGrade] = useState<number | undefined>(undefined);
  const [editChapterNumber, setEditChapterNumber] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState("ncert");
  const [createSubject, setCreateSubject] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createChapter, setCreateChapter] = useState("");
  const [createChapterNumber, setCreateChapterNumber] = useState<number | undefined>(undefined);
  const [createContentText, setCreateContentText] = useState("");
  const [createDifficulty, setCreateDifficulty] = useState("");
  const [createClassGrade, setCreateClassGrade] = useState<number | undefined>(undefined);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingCell, setSavingCell] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchContent();
    }
  }, [user, selectedSubject, selectedType, selectedStatus]);

  const fetchContent = async () => {
    if (!user) return;
    
    setLoadingContent(true);
    try {
      // Use API endpoint for consistency
      const data = await api.admin.listAllContent({
        subject: selectedSubject !== "all" ? selectedSubject : undefined,
        content_type: selectedType !== "all" ? selectedType : undefined,
        processing_status: selectedStatus !== "all" ? selectedStatus : undefined,
        limit: 100,
      });

      // Ensure metadata is parsed correctly
      const processedData = (data || []).map((item: any) => ({
        ...item,
        metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {}),
      }));

      setContent(processedData);
    } catch (error: any) {
      console.error("Error fetching content:", error);
      // Fallback to direct Supabase query
      try {
        let query = supabase
          .from("content")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (selectedSubject !== "all") {
          query = query.eq("subject", selectedSubject);
        }
        if (selectedType !== "all") {
          query = query.eq("type", selectedType);
        }
        if (selectedStatus !== "all") {
          query = query.eq("processing_status", selectedStatus);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Ensure metadata is parsed correctly
        const processedData = (data || []).map((item: any) => ({
          ...item,
          metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {}),
        }));
        
        setContent(processedData);
      } catch (fallbackError: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load content",
        });
      }
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
      item.chapter?.toLowerCase().includes(query) ||
      item.folder_path?.toLowerCase().includes(query)
    );
  });

  const handleEdit = (item: any) => {
    setSelectedContent(item);
    setEditTitle(item.title || "");
    setEditChapter(item.chapter || "");
    setEditDifficulty(item.difficulty || "");
    setEditClassGrade(item.class_grade || item.metadata?.class_grade || undefined);
    setEditChapterNumber(item.chapter_number || item.metadata?.chapter_number || undefined);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedContent) return;

    setSaving(true);
    try {
      // Get current metadata and merge with updates (keep other metadata fields)
      const currentMetadata = selectedContent.metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        // Keep class_grade and chapter_number in metadata for backward compatibility
        class_grade: editClassGrade || undefined,
        chapter_number: editChapterNumber || undefined,
      };
      
      // Remove title from metadata - title should be in the title column, not metadata
      if ("title" in updatedMetadata) {
        delete updatedMetadata.title;
      }

      // Update both direct columns and metadata via API
      await api.admin.updateContent({
        content_id: selectedContent.id,
        title: editTitle || undefined,
        chapter: editChapter || undefined,
        difficulty: editDifficulty && editDifficulty !== "none" ? editDifficulty : undefined,
        class_grade: editClassGrade,
        chapter_number: editChapterNumber,
        metadata: updatedMetadata,
      });

      toast({
        title: "Success",
        description: "Content updated successfully",
      });

      setEditDialogOpen(false);
      fetchContent();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update content",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field });
    setEditingValue(currentValue || "");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const handleSaveCell = async (rowId: string, field: string) => {
    setSavingCell(true);
    try {
      const updateData: any = {};
      
      if (field === "title") {
        updateData.title = editingValue || undefined;
        // Remove title from metadata if it exists - title should be in title column
        const currentItem = content.find((c) => c.id === rowId);
        const currentMetadata = currentItem?.metadata || {};
        const cleanedMetadata = { ...currentMetadata };
        if ("title" in cleanedMetadata) {
          delete cleanedMetadata.title;
        }
        updateData.metadata = cleanedMetadata;
      } else if (field === "chapter") {
        updateData.chapter = editingValue || undefined;
      } else if (field === "difficulty") {
        updateData.difficulty = editingValue && editingValue !== "none" ? editingValue : undefined;
      } else if (field === "class") {
        // Get current metadata and update class_grade
        const currentItem = content.find((c) => c.id === rowId);
        const currentMetadata = currentItem?.metadata || {};
        const classGrade = editingValue ? parseInt(editingValue) : undefined;
        updateData.metadata = {
          ...currentMetadata,
          class_grade: classGrade || undefined,
        };
        updateData.class_grade = classGrade;
      } else if (field === "chapter_number") {
        // Get current metadata and update chapter_number
        const currentItem = content.find((c) => c.id === rowId);
        const currentMetadata = currentItem?.metadata || {};
        const chapterNumber = editingValue ? parseInt(editingValue) : undefined;
        updateData.metadata = {
          ...currentMetadata,
          chapter_number: chapterNumber || undefined,
        };
        updateData.chapter_number = chapterNumber;
      } else if (field === "subject") {
        updateData.metadata = { subject: editingValue };
      }

      await api.admin.updateContent({
        content_id: rowId,
        ...updateData,
      });

      toast({
        title: "Success",
        description: `${field === "class" ? "Class" : field === "chapter_number" ? "Chapter Number" : field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`,
      });

      setEditingCell(null);
      setEditingValue("");
      fetchContent();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update content",
      });
    } finally {
      setSavingCell(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContent) return;

    setSaving(true);
    try {
      await api.admin.deleteContent(selectedContent.id);

      toast({
        title: "Success",
        description: "Content deleted successfully",
      });

      setDeleteDialogOpen(false);
      setSelectedContent(null);
      fetchContent();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete content",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReindex = async (contentId: string) => {
    try {
      toast({
        title: "Reindexing",
        description: "Reindexing content...",
      });

      // Get content item
      const { data } = await supabase
        .from("content")
        .select("*")
        .eq("id", contentId)
        .single();

      if (!data) {
        throw new Error("Content not found");
      }

      // Trigger reindex via API
      await api.admin.reindexContent();

      toast({
        title: "Success",
        description: "Content reindexing started",
      });

      fetchContent();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reindex content",
      });
    }
  };

  const handleCreate = async () => {
    if (!createContentText.trim() || !createSubject) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields (Subject and Content)",
      });
      return;
    }

    setSaving(true);
    try {
      // Prepare metadata for class_grade and chapter_number
      const metadata: any = {};
      if (createClassGrade) metadata.class_grade = createClassGrade;
      if (createChapterNumber) metadata.chapter_number = createChapterNumber;

      // Call API with correct format
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/content/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: createType,
          subject: createSubject,
          chapter: createChapter || undefined,
          title: createTitle || undefined,
          difficulty: createDifficulty && createDifficulty !== "none" ? createDifficulty : undefined,
          content_text: createContentText,
          metadata: Object.keys(metadata).length > 0 ? metadata : {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create content' }));
        throw new Error(errorData.detail || errorData.message || 'Failed to create content');
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Content created successfully!",
      });

      // Reset form
      setCreateDialogOpen(false);
      setCreateTitle("");
      setCreateChapter("");
      setCreateChapterNumber(undefined);
      setCreateContentText("");
      setCreateDifficulty("");
      setCreateClassGrade(undefined);
      setCreateSubject("");
      setCreateType("ncert");

      // Refresh content list
      fetchContent();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create content",
      });
    } finally {
      setSaving(false);
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
        return "PYQ";
      case "hots":
        return "HOTS";
      default:
        return type?.toUpperCase() || "Content";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
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
      <AdminSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Manage Content</h1>
            <p className="text-muted-foreground">View, edit, and manage all uploaded content</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
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
                    {filteredContent.length} of {content.length} content items. Click on Title, Class, Chapter Name, Chapter Number, or Difficulty to edit inline.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New
                  </Button>
                  <Button onClick={() => navigate("/dashboard/admin/content")} variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <Button onClick={fetchContent} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredContent.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Content Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || selectedSubject !== "all" || selectedType !== "all" || selectedStatus !== "all"
                      ? "Try adjusting your filters"
                      : "No content has been uploaded yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Chapter Name</TableHead>
                        <TableHead>Chapter Number</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Folder</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {editingCell?.rowId === item.id && editingCell?.field === "title" ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveCell(item.id, "title");
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit();
                                    }
                                  }}
                                  className="h-8"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveCell(item.id, "title")}
                                  disabled={savingCell}
                                >
                                  {savingCell ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "✓"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  disabled={savingCell}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="font-medium cursor-pointer hover:bg-muted/50 p-1 rounded -m-1"
                                onClick={() => handleStartEdit(item.id, "title", item.title)}
                                title="Click to edit"
                              >
                                {item.title || `${getTypeLabel(item.type)} Content`}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground mt-1">
                              {truncateText(item.content_text, 80)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(item.type)}>
                              {getTypeLabel(item.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {item.subject}
                          </TableCell>
                          <TableCell>
                            {editingCell?.rowId === item.id && editingCell?.field === "class" ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveCell(item.id, "class");
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit();
                                    }
                                  }}
                                  className="h-8 w-20"
                                  min="1"
                                  max="12"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveCell(item.id, "class")}
                                  disabled={savingCell}
                                >
                                  {savingCell ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "✓"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  disabled={savingCell}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-muted/50 p-1 rounded -m-1 block"
                                onClick={() => handleStartEdit(item.id, "class", item.class_grade || item.metadata?.class_grade || "")}
                                title="Click to edit"
                              >
                                {item.class_grade || item.metadata?.class_grade ? `Class ${item.class_grade || item.metadata?.class_grade}` : "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCell?.rowId === item.id && editingCell?.field === "chapter" ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveCell(item.id, "chapter");
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit();
                                    }
                                  }}
                                  className="h-8"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveCell(item.id, "chapter")}
                                  disabled={savingCell}
                                >
                                  {savingCell ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "✓"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  disabled={savingCell}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-muted/50 p-1 rounded -m-1 block"
                                onClick={() => handleStartEdit(item.id, "chapter", item.chapter)}
                                title="Click to edit"
                              >
                                {item.chapter || "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCell?.rowId === item.id && editingCell?.field === "chapter_number" ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveCell(item.id, "chapter_number");
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit();
                                    }
                                  }}
                                  className="h-8 w-20"
                                  min="1"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveCell(item.id, "chapter_number")}
                                  disabled={savingCell}
                                >
                                  {savingCell ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "✓"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  disabled={savingCell}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-muted/50 p-1 rounded -m-1 block"
                                onClick={() => handleStartEdit(item.id, "chapter_number", item.chapter_number || item.metadata?.chapter_number || "")}
                                title="Click to edit"
                              >
                                {item.chapter_number || item.metadata?.chapter_number ? `Ch. ${item.chapter_number || item.metadata?.chapter_number}` : "-"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCell?.rowId === item.id && editingCell?.field === "difficulty" ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={editingValue || undefined}
                                  onValueChange={setEditingValue}
                                >
                                  <SelectTrigger className="h-8 w-[120px]">
                                    <SelectValue placeholder="Select difficulty" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveCell(item.id, "difficulty")}
                                  disabled={savingCell}
                                >
                                  {savingCell ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "✓"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  disabled={savingCell}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-muted/50 p-1 rounded -m-1 block capitalize"
                                onClick={() => handleStartEdit(item.id, "difficulty", item.difficulty || "none")}
                                title="Click to edit"
                              >
                                {item.difficulty ? (
                                  <Badge variant="outline" className="capitalize">
                                    {item.difficulty}
                                  </Badge>
                                ) : (
                                  "-"
                                )}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(item.processing_status || "pending")}
                          </TableCell>
                          <TableCell>
                            {item.folder_path ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Folder className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{item.folder_path}</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(item.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/student/content/${item.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit All Fields
                                </DropdownMenuItem>
                                {item.file_url && (
                                  <DropdownMenuItem onClick={() => window.open(item.file_url, "_blank")}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleReindex(item.id)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reindex
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedContent(item);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Content</DialogTitle>
              <DialogDescription>
                Update content metadata. Changes will be saved immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Content title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chapter Name</label>
                  <Input
                    value={editChapter}
                    onChange={(e) => setEditChapter(e.target.value)}
                    placeholder="Chapter name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chapter Number</label>
                  <Input
                    type="number"
                    value={editChapterNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setEditChapterNumber(value);
                    }}
                    placeholder="Chapter number"
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class/Grade</label>
                  <Input
                    type="number"
                    value={editClassGrade || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setEditClassGrade(value);
                    }}
                    placeholder="Class grade (1-12)"
                    min="1"
                    max="12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select value={editDifficulty || undefined} onValueChange={setEditDifficulty}>
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Content</DialogTitle>
              <DialogDescription>
                Add new educational content. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Type *</label>
                  <Select value={createType} onValueChange={setCreateType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ncert">NCERT</SelectItem>
                      <SelectItem value="pyq">Previous Year Question</SelectItem>
                      <SelectItem value="hots">HOTS Question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject *</label>
                  <Select value={createSubject} onValueChange={setCreateSubject}>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="Content title (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chapter Name</label>
                  <Input
                    value={createChapter}
                    onChange={(e) => setCreateChapter(e.target.value)}
                    placeholder="Chapter name (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chapter Number</label>
                  <Input
                    type="number"
                    value={createChapterNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setCreateChapterNumber(value);
                    }}
                    placeholder="Chapter number"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class/Grade</label>
                  <Input
                    type="number"
                    value={createClassGrade || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      setCreateClassGrade(value);
                    }}
                    placeholder="e.g., 8, 9, 10, 11, 12"
                    min="1"
                    max="12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <Select value={createDifficulty || undefined} onValueChange={setCreateDifficulty}>
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content Text *</label>
                <Textarea
                  value={createContentText}
                  onChange={(e) => setCreateContentText(e.target.value)}
                  placeholder="Enter content here..."
                  rows={10}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {createContentText.length} characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !createContentText.trim() || !createSubject}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Content
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the content
                "{selectedContent?.title || "this item"}" and remove it from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default ManageContent;

