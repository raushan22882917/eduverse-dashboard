import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { 
  MessageSquare, 
  Send,
  BookOpen,
  Video,
  FileText,
  Lightbulb,
  Loader2,
  Play,
  Pause,
  Volume2,
  Maximize,
  StickyNote,
  CreditCard,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const Classroom = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get("subject") || "mathematics");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [chapters, setChapters] = useState<any[]>([]);
  const [ncertContent, setNcertContent] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Notes and flashcards
  const [notes, setNotes] = useState<Array<{id: string; timestamp: number; note: string}>>([]);
  const [flashcards, setFlashcards] = useState<Array<{id: string; front: string; back: string}>>([]);
  const [newNote, setNewNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && selectedSubject) {
      fetchChapters();
      fetchVideos();
    }
  }, [user, selectedSubject]);

  useEffect(() => {
    if (selectedChapter) {
      fetchNcertContent();
    }
  }, [selectedChapter]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChapters = async () => {
    try {
      // Fetch topics/chapters for the selected subject
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("subject", selectedSubject)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setChapters(data || []);
      
      // Auto-select first chapter if available
      if (data && data.length > 0 && !selectedChapter) {
        setSelectedChapter(data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching chapters:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load chapters",
      });
    }
  };

  const fetchNcertContent = async () => {
    if (!selectedChapter) return;
    
    try {
      // Fetch NCERT content for the selected chapter
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("type", "ncert")
        .eq("subject", selectedSubject)
        .eq("topic_id", selectedChapter)
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      
      if (data) {
        // Check if PDF exists in Supabase Storage
        // Try to construct PDF URL from content ID or metadata
        let pdfUrl = data.metadata?.pdf_url || data.metadata?.file_url;
        
        // If no PDF URL in metadata, try to get from Supabase Storage
        if (!pdfUrl && data.id) {
          // Check if PDF exists in storage bucket
          const fileName = `content/${data.id}.pdf`;
          const { data: fileData } = await supabase.storage
            .from("content")
            .list(`content/${data.id}`, {
              limit: 1,
              search: ".pdf"
            });
          
          if (fileData && fileData.length > 0) {
            const { data: urlData } = supabase.storage
              .from("content")
              .getPublicUrl(fileName);
            if (urlData?.publicUrl) {
              pdfUrl = urlData.publicUrl;
            }
          }
        }
        
        // Update metadata with PDF URL if found
        if (pdfUrl && !data.metadata?.pdf_url) {
          data.metadata = {
            ...data.metadata,
            pdf_url: pdfUrl
          };
        }
        
        // Set default view mode based on PDF availability
        if (pdfUrl) {
          setViewMode("pdf");
        } else {
          setViewMode("text");
        }
      }
      
      setNcertContent(data || null);
    } catch (error: any) {
      console.error("Error fetching NCERT content:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const data = await api.videos.getBySubject(selectedSubject, 20);
      setVideos(data || []);
      
      // Auto-select first video if available
      if (data && data.length > 0 && !selectedVideo) {
        setSelectedVideo(data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching videos:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setSendingMessage(true);

    try {
      // Use RAG API to get answer
      const response = await api.rag.query({
        query: inputMessage,
        subject: selectedSubject as any,
        top_k: 5,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.generated_text || "I'm here to help!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedVideo) return;

    const note = {
      id: Date.now().toString(),
      timestamp: currentTime,
      note: newNote,
    };

    setNotes((prev) => [...prev, note]);
    setNewNote("");
    setShowNoteInput(false);
    
    toast({
      title: "Note Added",
      description: "Your note has been saved",
    });
  };

  const handleAddFlashcard = () => {
    // Create flashcard from current video content or user input
    const flashcard = {
      id: Date.now().toString(),
      front: `Video: ${selectedVideo?.title || "Content"}`,
      back: "Study this concept",
    };

    setFlashcards((prev) => [...prev, flashcard]);
    
    toast({
      title: "Flashcard Created",
      description: "Flashcard has been added",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
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
      <StudentSidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Classroom</h1>
              <p className="text-sm text-muted-foreground">Study, learn, and ask questions</p>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue />
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

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Chapters */}
          <aside className="w-64 border-r overflow-y-auto bg-card">
            <div className="p-4">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chapters
              </h2>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => setSelectedChapter(chapter.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedChapter === chapter.id
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "hover:bg-accent"
                      }`}
                    >
                      <p className="font-medium text-sm">{chapter.name}</p>
                      {chapter.chapter && (
                        <p className="text-xs text-muted-foreground mt-1">{chapter.chapter}</p>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="content">NCERT Content</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
                <TabsTrigger value="chat">AI Tutor Chat</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
              </TabsList>

              {/* NCERT Content Tab */}
              <TabsContent value="content" className="flex-1 overflow-y-auto p-6">
                {ncertContent ? (
                  <Card className="flex flex-col h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{ncertContent.title || "NCERT Content"}</CardTitle>
                          <CardDescription>
                            {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)} • Chapter Content
                          </CardDescription>
                        </div>
                        {/* View Mode Toggle */}
                        {(ncertContent.metadata?.pdf_url || ncertContent.metadata?.file_url) && (
                          <div className="flex gap-2">
                            <Button
                              variant={viewMode === "pdf" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setViewMode("pdf")}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              PDF View
                            </Button>
                            <Button
                              variant={viewMode === "text" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setViewMode("text")}
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              Text View
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col overflow-hidden">
                      {/* PDF Viewer */}
                      {viewMode === "pdf" && (ncertContent.metadata?.pdf_url || ncertContent.metadata?.file_url) && !pdfError ? (
                        <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between p-2 bg-muted border-b">
                            <span className="text-sm font-medium">PDF Viewer</span>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const pdfUrl = ncertContent.metadata.pdf_url || ncertContent.metadata.file_url;
                                  window.open(pdfUrl, "_blank");
                                }}
                              >
                                <Maximize className="h-4 w-4 mr-1" />
                                Open Fullscreen
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const pdfUrl = ncertContent.metadata.pdf_url || ncertContent.metadata.file_url;
                                  const link = document.createElement("a");
                                  link.href = pdfUrl;
                                  link.download = `${ncertContent.title || "ncert-content"}.pdf`;
                                  link.click();
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                          <iframe
                            src={`${ncertContent.metadata.pdf_url || ncertContent.metadata.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
                            className="w-full flex-1 border-0"
                            title="NCERT PDF"
                            style={{ minHeight: "600px" }}
                            onError={() => setPdfError(true)}
                            onLoad={() => setPdfError(false)}
                          />
                        </div>
                      ) : viewMode === "pdf" && (pdfError || (!ncertContent.metadata?.pdf_url && !ncertContent.metadata?.file_url)) ? (
                        <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/50">
                          <div className="text-center p-8">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">
                              {pdfError ? "PDF Failed to Load" : "PDF Not Available"}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {pdfError 
                                ? "There was an error loading the PDF. You can try opening it in a new tab or view the text content instead."
                                : "PDF file is not available for this content. Showing text view instead."}
                            </p>
                            <div className="flex gap-2 justify-center">
                              {ncertContent.metadata?.pdf_url || ncertContent.metadata?.file_url ? (
                                <>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      window.open(ncertContent.metadata.pdf_url || ncertContent.metadata.file_url, "_blank");
                                    }}
                                  >
                                    Open in New Tab
                                  </Button>
                                  <Button onClick={() => {
                                    setPdfError(false);
                                    setViewMode("text");
                                  }}>
                                    View as Text
                                  </Button>
                                </>
                              ) : (
                                <Button onClick={() => setViewMode("text")}>
                                  View as Text
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-6 rounded-lg">
                              {ncertContent.content_text}
                            </pre>
                          </div>
                        </div>
                      )}
                      <div className="mt-6 flex gap-2">
                        <Button
                          onClick={() => {
                            setInputMessage(`Explain this chapter: ${chapters.find(c => c.id === selectedChapter)?.name}`);
                            setActiveTab("chat");
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ask About This Chapter
                        </Button>
                        {(ncertContent.metadata?.pdf_url || ncertContent.metadata?.file_url) && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              window.open(ncertContent.metadata.pdf_url || ncertContent.metadata.file_url, "_blank");
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Open PDF in New Tab
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No Content Available</h3>
                      <p className="text-muted-foreground">
                        Select a chapter to view NCERT content
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Videos Tab */}
              <TabsContent value="video" className="flex-1 flex flex-col overflow-hidden p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                  {/* Video Player */}
                  <div className="lg:col-span-2 flex flex-col">
                    {selectedVideo ? (
                      <Card className="flex-1 flex flex-col">
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{selectedVideo.title}</CardTitle>
                          <CardDescription>{selectedVideo.channel_name}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                          {/* Video Player */}
                          <div className="relative bg-black rounded-lg mb-4 aspect-video">
                            <iframe
                              id={`youtube-player-${selectedVideo.id}`}
                              src={`https://www.youtube.com/embed/${selectedVideo.youtube_id}?enablejsapi=1&origin=${window.location.origin}`}
                              className="w-full h-full rounded-lg"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>

                          {/* Video Controls */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePlayPause}
                              >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(currentTime)}
                                </span>
                                <div className="flex-1 h-2 bg-muted rounded-full relative cursor-pointer"
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percent = x / rect.width;
                                    handleSeek(percent * duration);
                                  }}
                                >
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(duration)}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowNoteInput(!showNoteInput);
                                }}
                              >
                                <StickyNote className="h-4 w-4 mr-2" />
                                Add Note
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddFlashcard}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Create Flashcard
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setInputMessage(`Explain this video: ${selectedVideo.title}`);
                                  setActiveTab("chat");
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Ask About Video
                              </Button>
                            </div>

                            {/* Note Input */}
                            {showNoteInput && (
                              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    Note at {formatTime(currentTime)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowNoteInput(false)}
                                  >
                                    ×
                                  </Button>
                                </div>
                                <Textarea
                                  placeholder="Add your note here..."
                                  value={newNote}
                                  onChange={(e) => setNewNote(e.target.value)}
                                  rows={3}
                                />
                                <Button size="sm" onClick={handleAddNote}>
                                  Save Note
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Video Description */}
                          {selectedVideo.metadata?.description && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold mb-2">Description</h4>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {selectedVideo.metadata.description}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-xl font-semibold mb-2">No Video Selected</h3>
                          <p className="text-muted-foreground">
                            Select a video from the list to start watching
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Video List */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Related Videos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[600px]">
                          <div className="space-y-3">
                            {videos.map((video) => (
                              <div
                                key={video.id}
                                onClick={() => setSelectedVideo(video)}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedVideo?.id === video.id
                                    ? "border-primary bg-primary/10"
                                    : "hover:bg-accent"
                                }`}
                              >
                                <div className="flex gap-3">
                                  <div className="relative w-32 h-20 bg-muted rounded flex-shrink-0">
                                    <img
                                      src={video.metadata?.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                                      alt={video.title}
                                      className="w-full h-full object-cover rounded"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Play className="h-6 w-6 text-white drop-shadow-lg" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-2">
                                      {video.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {video.channel_name}
                                    </p>
                                    {video.duration_seconds && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, "0")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden p-6">
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      AI Tutor Chat
                    </CardTitle>
                    <CardDescription>
                      Ask questions about {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-4">
                        {messages.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Start a conversation with your AI tutor</p>
                            <p className="text-sm mt-2">Ask questions about the chapter or video you're studying</p>
                          </div>
                        )}
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-4 ${
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {sendingMessage && (
                          <div className="flex justify-start">
                            <div className="bg-muted rounded-lg p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask a question..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || sendingMessage}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="flex-1 overflow-y-auto p-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StickyNote className="h-5 w-5" />
                      My Notes
                    </CardTitle>
                    <CardDescription>
                      Notes you've taken while studying
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notes.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <StickyNote className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No notes yet</p>
                        <p className="text-sm mt-2">Add notes while watching videos</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notes.map((note) => (
                          <div key={note.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">
                                {formatTime(note.timestamp)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setNotes(notes.filter((n) => n.id !== note.id));
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                            <p className="text-sm">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Flashcards Tab */}
              <TabsContent value="flashcards" className="flex-1 overflow-y-auto p-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Flashcards
                    </CardTitle>
                    <CardDescription>
                      Study with flashcards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {flashcards.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No flashcards yet</p>
                        <p className="text-sm mt-2">Create flashcards from videos or content</p>
                      </div>
                    ) : (
                      <FlashcardViewer flashcards={flashcards} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

// Flashcard Viewer Component
const FlashcardViewer = ({ flashcards }: { flashcards: Array<{id: string; front: string; back: string}> }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div
          className="w-full max-w-md h-64 cursor-pointer"
          style={{ perspective: '1000px' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div 
              className="absolute inset-0"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center p-6">
                  <p className="text-lg font-semibold">{currentCard.front}</p>
                  <p className="text-sm text-muted-foreground mt-4">Click to flip</p>
                </CardContent>
              </Card>
            </div>
            <div 
              className="absolute inset-0"
              style={{ 
                backfaceVisibility: 'hidden', 
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <Card className="h-full flex items-center justify-center bg-primary text-primary-foreground">
                <CardContent className="text-center p-6">
                  <p className="text-lg font-semibold">{currentCard.back}</p>
                  <p className="text-sm opacity-80 mt-4">Click to flip back</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
            setIsFlipped(false);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {flashcards.length}
        </span>
        <Button
          variant="outline"
          onClick={() => {
            setCurrentIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
            setIsFlipped(false);
          }}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Classroom;

