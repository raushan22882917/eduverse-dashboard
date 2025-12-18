import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Minimize2, Maximize2, Save, StickyNote, Trash2, Bold, Italic, List, Heading1, Eye, Edit, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";

interface Note {
  id: string;
  note_text: string;
  content: string; // Alias for note_text for compatibility
  created_at: string;
  updated_at: string;
}

interface FloatingNoteMakerProps {
  userId: string;
  contentId?: string;
  subject?: string;
  onNoteSaved?: () => void;
  forceOpen?: boolean;
  onClose?: () => void;
}

export function FloatingNoteMaker({ userId, contentId, subject, onNoteSaved, forceOpen, onClose }: FloatingNoteMakerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Handle force open
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Insert markdown formatting at cursor position
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentNote.substring(start, end);
    const newText = 
      currentNote.substring(0, start) + 
      before + selectedText + after + 
      currentNote.substring(end);
    
    setCurrentNote(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Enhance note with AI
  const handleEnhanceNote = async () => {
    if (!currentNote.trim() || enhancing) return;

    setEnhancing(true);
    try {
      // Try improveMessage API first
      let enhancedText = currentNote;
      
      try {
        const response = await api.messages.improve({
          text: currentNote,
          tone: "professional",
          context: subject ? `This is a study note for ${subject}. Make it clear, well-structured, and professional.` : "This is a study note. Make it clear, well-structured, and professional."
        });
        
        if (response.improved_text || response.text) {
          enhancedText = response.improved_text || response.text;
        }
      } catch (error: any) {
        // Fallback to RAG queryDirect with enhancement prompt
        console.log("Improve API failed, trying RAG direct...");
        try {
          const enhancementPrompt = `Enhance and improve the following study note to make it more professional, clear, and well-structured. Keep the original meaning and key points, but improve:
- Grammar and spelling
- Clarity and readability
- Structure and organization
- Professional tone
- Use proper formatting with markdown

Original note:
${currentNote}

Enhanced note:`;

          const response = await api.rag.queryDirect({
            query: enhancementPrompt,
            subject: subject as any
          });
          
          if (response.generated_text) {
            enhancedText = response.generated_text.trim();
            // Remove any prefix like "Enhanced note:" or similar
            enhancedText = enhancedText.replace(/^(Enhanced note|Note|Here's the enhanced note):\s*/i, '').trim();
          }
        } catch (ragError: any) {
          console.error("RAG enhancement failed:", ragError);
          throw new Error("Failed to enhance note. Please try again.");
        }
      }

      setCurrentNote(enhancedText);
      toast({
        title: "Note Enhanced",
        description: "Your note has been improved with AI!",
      });
    } catch (error: any) {
      console.error("Error enhancing note:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to enhance note. Please try again.",
      });
    } finally {
      setEnhancing(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadNotes();
    }
  }, [isOpen, userId, contentId]);

  const loadNotes = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("classroom_notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (contentId) {
        query = query.eq("content_id", contentId);
      }

      const { data, error } = await query;

      if (error) {
        // Handle 404 or table not found errors gracefully
        const isTableNotFound = error.code === 'PGRST116' || 
                               error.code === '42P01' || 
                               error.status === 404 ||
                               error.message?.includes('does not exist') ||
                               error.message?.includes('relation') && error.message?.includes('does not exist');
        
        if (isTableNotFound) {
          // Table doesn't exist yet, just set empty notes
          setNotes([]);
          return;
        }
        throw error;
      }
      // Map note_text to content for compatibility
      const mappedNotes = (data || []).map((note: any) => ({
        ...note,
        content: note.note_text || note.content || ''
      }));
      setNotes(mappedNotes);
    } catch (error: any) {
      console.error("Error loading notes:", error);
      // Only show error if it's not a table-not-found error
      if (error.code !== 'PGRST116' && error.code !== '42P01' && !error.message?.includes('does not exist')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load notes",
        });
      }
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNote.trim() || !userId || saving) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("classroom_notes")
        .insert({
          user_id: userId,
          content_id: contentId || null,
          subject: subject || null,
          note_text: currentNote.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Handle table not found errors
        const isTableNotFound = error.code === 'PGRST116' || 
                               error.code === '42P01' || 
                               error.status === 404 ||
                               error.message?.includes('does not exist') ||
                               (error.message?.includes('relation') && error.message?.includes('does not exist'));
        
        if (isTableNotFound) {
          toast({
            variant: "destructive",
            title: "Database Setup Required",
            description: "The notes table needs to be created. Please run the migration file: 20251205_add_classroom_notes.sql",
          });
          return;
        }
        throw error;
      }

      setNotes(prev => [data, ...prev]);
      setCurrentNote("");
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully",
      });
      onNoteSaved?.();
    } catch (error: any) {
      console.error("Error saving note:", error);
      // Only show error if it's not already handled
      const isTableNotFound = error.code === 'PGRST116' || 
                             error.code === '42P01' || 
                             error.status === 404 ||
                             error.message?.includes('does not exist') ||
                             (error.message?.includes('relation') && error.message?.includes('does not exist'));
      
      if (!isTableNotFound) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save note",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("classroom_notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", userId);

      if (error) {
        // Handle table not found errors gracefully
        const isTableNotFound = error.code === 'PGRST116' || 
                               error.code === '42P01' || 
                               error.status === 404 ||
                               error.message?.includes('does not exist') ||
                               (error.message?.includes('relation') && error.message?.includes('does not exist'));
        
        if (isTableNotFound) {
          // Table doesn't exist, just remove from local state
          setNotes(prev => prev.filter(note => note.id !== noteId));
          return;
        }
        throw error;
      }

      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast({
        title: "Note deleted",
        description: "Note has been deleted",
      });
    } catch (error: any) {
      console.error("Error deleting note:", error);
      // Only show error if it's not a table-not-found error
      if (error.code !== 'PGRST116' && error.code !== '42P01' && !error.message?.includes('does not exist')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete note",
        });
      }
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 z-[9999] border-2 border-white animate-pulse"
        size="icon"
        title="Open Notes Maker"
      >
        <StickyNote className="h-8 w-8 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] shadow-2xl border-2 z-50 bg-background">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            My Notes
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isMinimized && (
        <CardContent className="p-4 space-y-4 max-h-[600px] overflow-hidden flex flex-col">
          {/* New Note Input */}
          <div className="space-y-2 shrink-0">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg border border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => insertMarkdown("**", "**")}
                title="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => insertMarkdown("*", "*")}
                title="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => insertMarkdown("# ", "")}
                title="Heading"
              >
                <Heading1 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => insertMarkdown("- ", "")}
                title="Bullet List"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleEnhanceNote}
                disabled={!currentNote.trim() || enhancing}
                title="Enhance with AI"
              >
                {enhancing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Enhance
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setShowPreview(!showPreview)}
                title={showPreview ? "Edit" : "Preview"}
              >
                {showPreview ? (
                  <>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Preview
                  </>
                )}
              </Button>
            </div>

            {/* Editor/Preview Tabs */}
            {showPreview ? (
              <div className="min-h-[150px] max-h-[300px] overflow-y-auto p-3 bg-muted/30 rounded-lg border border-border">
                {currentNote.trim() ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentNote}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Preview will appear here...</p>
                )}
              </div>
            ) : (
              <Textarea
                ref={textareaRef}
                placeholder="Write your note here... (Supports Markdown formatting)"
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                className="min-h-[150px] max-h-[300px] resize-none font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSaveNote();
                  }
                }}
              />
            )}

            <Button
              onClick={handleSaveNote}
              disabled={!currentNote.trim() || saving}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Note"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Use formatting buttons or Markdown syntax. Press Ctrl/Cmd + Enter to save.
            </p>
          </div>

          {/* Saved Notes List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading notes...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No notes yet. Start writing!
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {new Date(note.created_at).toLocaleDateString()}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {note.note_text || note.content || ''}
                    </ReactMarkdown>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

