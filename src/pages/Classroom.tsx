import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import type { Json, Database } from "@/integrations/supabase/types";
import { TextSelectionPopup } from "@/components/TextSelectionPopup";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type SubjectType = Database["public"]["Enums"]["subject_type"];
import { 
  BookOpen,
  FileText,
  Loader2,
  Maximize,
  Video,
  Play,
  Clock,
  X,
  CheckCircle2,
  MessageSquare,
  Send,
  Sparkles,
  Mic,
  MicOff,
  Languages,
  Bot,
  User,
  BookMarked,
  Calculator,
  TrendingUp,
  Image as ImageIcon,
  Eye,
  Maximize2
} from "lucide-react";
import { FloatingNoteMaker } from "@/components/FloatingNoteMaker";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import EnhancedAITutorPage from "@/pages/classroom_ai";

// Source type for RAG
interface Source {
  id?: string;
  type?: string;
  subject?: string;
  chapter?: string;
  similarity?: number;
  title?: string;
}

// Helper function to extract sources from RAG API response
const extractSources = (response: any, contentText: string): { sources: Source[]; sourcesCount: number; cleanedContent: string } => {
  
  let extractedSources: Source[] = [];
  let sourcesCount = 0;
  let cleanedContent = contentText;
  
  // Try to get sources from response metadata or contexts
  if (response.sources && Array.isArray(response.sources)) {
    extractedSources = response.sources.map((src: any) => ({
      id: src.id || src.chunk_id || src.content_id,
      type: src.type || src.source_type || src.metadata?.type,
      subject: src.subject,
      chapter: src.chapter || src.metadata?.chapter,
      similarity: src.similarity || src.similarity_score,
      title: src.title || src.metadata?.title,
    }));
    sourcesCount = response.sources.length;
  } else if (response.contexts && Array.isArray(response.contexts)) {
    // Extract from RAG contexts
    extractedSources = response.contexts.map((ctx: any) => ({
      id: ctx.content_id || ctx.chunk_id,
      type: ctx.source_type || ctx.metadata?.type,
      subject: ctx.subject,
      chapter: ctx.metadata?.chapter,
      similarity: ctx.similarity_score,
      title: ctx.metadata?.title,
    }));
    sourcesCount = response.contexts.length;
  } else if (response.metadata?.sources && Array.isArray(response.metadata.sources)) {
    extractedSources = response.metadata.sources;
    sourcesCount = response.metadata.sources.length;
  } else if (response.metadata?.chunks_retrieved) {
    sourcesCount = response.metadata.chunks_retrieved;
  }
  
  // Parse sources from content if embedded
  if (contentText) {
    // Match patterns like "Based on X relevant content sections"
    const sectionCountMatch = contentText.match(/Based on (\d+) relevant content section/i);
    if (sectionCountMatch) {
      const count = parseInt(sectionCountMatch[1], 10);
      if (count > sourcesCount) {
        sourcesCount = count;
      }
    }
    
    // Extract source lines - look for patterns like "ncert - battery" or "[Source 1] (ncert - chapter)"
    const sourceLines: string[] = [];
    const lines = contentText.split('\n');
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      // Match patterns like: "[Source 1] (ncert - chapter name)"
      const sourcePattern1 = /^\[Source \d+\]\s*\(([^)]+)\)/i;
      // Match patterns like: "ncert - battery"
      const sourcePattern2 = /^(\w+)\s*-\s*([^-]+)$/i;
      
      const match1 = trimmedLine.match(sourcePattern1);
      const match2 = trimmedLine.match(sourcePattern2);
      
      if (match1) {
        sourceLines.push(match1[1]);
      } else if (match2) {
        const [, type, chapter] = match2;
        if (type.length >= 3 && chapter.trim().length >= 3) {
          sourceLines.push(trimmedLine);
        }
      }
    });
    
    // Parse source lines into Source objects
    if (sourceLines.length > 0) {
      const uniqueSources = new Map<string, Source>();
      
      sourceLines.forEach((line) => {
        const parts = line.split(/\s*-\s*/);
        if (parts.length >= 2) {
          const type = parts[0].trim().toLowerCase();
          const chapter = parts.slice(1).join(' - ').trim();
          
          if (type.length > 2 && chapter.length > 2) {
            const key = `${type}-${chapter}`;
            if (!uniqueSources.has(key)) {
              uniqueSources.set(key, {
                type: type,
                chapter: chapter,
              });
            }
          }
        }
      });
      
      if (uniqueSources.size > 0) {
        const parsedSources = Array.from(uniqueSources.values());
        extractedSources = [...extractedSources, ...parsedSources];
        if (!sourcesCount) {
          sourcesCount = parsedSources.length;
        }
      }
    }
    
    // Clean content - remove source lines if they were embedded
    if (sourceLines.length > 0) {
      cleanedContent = contentText
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          const isSourceLine = /^\[Source \d+\]\s*\(([^)]+)\)/i.test(trimmed) || 
                               /^(\w+)\s*-\s*([^-]+)$/i.test(trimmed);
          const isSourceHeader = /^Sources?:\s*$/i.test(trimmed);
          return !isSourceLine && !isSourceHeader;
        })
        .join('\n')
        .trim();
      
      // Remove "Based on X relevant content sections" if it's a standalone line
      cleanedContent = cleanedContent.replace(/^\s*Based on \d+ relevant content sections? from the curriculum\.?\s*$/gmi, '').trim();
    }
  }
  
  return { sources: extractedSources, sourcesCount, cleanedContent };
};

const Classroom = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // State
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get("subject") || "mathematics");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [chapters, setChapters] = useState<any[]>([]);
  const [ncertContent, setNcertContent] = useState<any>(null);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [allContent, setAllContent] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loadingRelatedVideos, setLoadingRelatedVideos] = useState(false);
  const [youtubeQuotaExceeded, setYoutubeQuotaExceeded] = useState(false);
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  
  // Text selection state
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showTextPopup, setShowTextPopup] = useState(false);
  
  // Classroom session state
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitCompletion, setExitCompletion] = useState<number>(50);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [pagesViewed, setPagesViewed] = useState<number>(0);
  const [interactionsCount, setInteractionsCount] = useState<number>(0);
  const [generatedQuiz, setGeneratedQuiz] = useState<{
    questions: Array<{
      question: string;
      options?: string[];
      correct_answer?: string;
      explanation?: string;
    }>;
    title?: string;
  } | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"videos" | "tutor">("tutor");
  
  // Saved explanations
  const [savedExplanations, setSavedExplanations] = useState<Array<{
    id: string;
    text: string;
    explanation: string;
    type: string;
    timestamp: Date;
  }>>([]);
  
  
  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState<string>(localStorage.getItem('preferred_language') || 'en');

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && selectedSubject) {
      fetchChapters();
      fetchAllContent();
    }
  }, [user, selectedSubject]);

  useEffect(() => {
    if (selectedChapter) {
      fetchNcertContent();
    }
  }, [selectedChapter]);

  useEffect(() => {
    if (selectedContent) {
      setNcertContent(selectedContent);
    }
  }, [selectedContent]);



  // Session timer effect - only runs when session is started
  useEffect(() => {
    if (!sessionStarted || !sessionStartTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
      setSessionTime(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted, sessionStartTime]);

  // Start session handler
  const handleStartSession = () => {
    setSessionStarted(true);
    setSessionStartTime(new Date());
    setCompletionPercentage(0);
    setPagesViewed(0);
    setInteractionsCount(0);
    toast({
      title: "Session Started",
      description: "Your study session has begun. Progress will be tracked automatically.",
    });
  };

  // Handle beforeunload to show exit confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      setShowExitDialog(true);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Text selection handler for PDF and Text view - only works when session is started
  const handleTextSelection = useCallback(() => {
    if (!sessionStarted) return;
    
    // Small delay to ensure selection is complete
    setTimeout(() => {
      // Check for selection in main document (works for text view)
      const selection = window.getSelection();
      let selectedText = "";
      let selectionRect: DOMRect | null = null;
      
      if (selection && selection.toString().trim().length > 0) {
        selectedText = selection.toString().trim();
        if (selectedText.length >= 3) {
          try {
            const range = selection.getRangeAt(0);
            selectionRect = range.getBoundingClientRect();
          } catch (e) {
            // Range might be invalid, continue without rect
          }
        }
      }
      
      // For PDF view, try to access iframe selection (may not work due to CORS)
      if (viewMode === "pdf") {
        try {
          const iframe = document.querySelector('iframe[title="Content PDF"]') as HTMLIFrameElement;
          if (iframe) {
            // Try to access iframe's document and selection
            try {
              if (iframe.contentWindow && iframe.contentDocument) {
                const iframeSelection = iframe.contentWindow.getSelection();
                if (iframeSelection && iframeSelection.toString().trim().length > 0) {
                  const text = iframeSelection.toString().trim();
                  if (text.length >= 3) {
                    selectedText = text;
                    try {
                      const range = iframeSelection.getRangeAt(0);
                      const rect = range.getBoundingClientRect();
                      const iframeRect = iframe.getBoundingClientRect();
                      
                      selectionRect = new DOMRect(
                        iframeRect.left + rect.left,
                        iframeRect.top + rect.top,
                        rect.width,
                        rect.height
                      );
                    } catch (e) {
                      // Use iframe center as fallback position
                      const iframeRect = iframe.getBoundingClientRect();
                      selectionRect = new DOMRect(
                        iframeRect.left + iframeRect.width / 2,
                        iframeRect.top + iframeRect.height / 2,
                        0,
                        0
                      );
                    }
                  }
                }
              }
            } catch (e) {
              // CORS error - try alternative approach
              // Check if there's any text in clipboard (user might have copied from PDF)
              // This is a fallback for when we can't access iframe directly
            }
            
            // Alternative: Check for selection by trying to access iframe's window
            // Even if contentDocument is blocked, we might be able to access selection
            if ((!selectedText || selectedText.length < 3) && iframe.contentWindow) {
              try {
                // Try accessing selection through contentWindow
                const win = iframe.contentWindow as any;
                if (win.getSelection) {
                  const iframeSel = win.getSelection();
                  if (iframeSel && iframeSel.toString && iframeSel.toString().trim().length > 0) {
                    const text = iframeSel.toString().trim();
                    if (text.length >= 3) {
                      selectedText = text;
                      const iframeRect = iframe.getBoundingClientRect();
                      // Use mouse position or iframe center
                      selectionRect = new DOMRect(
                        iframeRect.left + iframeRect.width / 2,
                        iframeRect.top + 100,
                        0,
                        0
                      );
                    }
                  }
                }
              } catch (e) {
                // CORS restriction - can't access iframe content
                console.debug("Cannot access iframe selection due to CORS:", e);
              }
            }
          }
        } catch (e) {
          // Cross-origin or other iframe access issues
          console.debug("Iframe selection access restricted (CORS):", e);
        }
      }
      
      // Show popup if we have valid selection
      if (selectedText && selectedText.length >= 3) {
        setSelectedText(selectedText);
        if (selectionRect) {
          setSelectionPosition({
            x: selectionRect.left + selectionRect.width / 2,
            y: selectionRect.top - 10
          });
        } else {
          // Fallback to center of viewport or iframe
          const iframe = viewMode === "pdf" ? document.querySelector('iframe[title="Content PDF"]') as HTMLIFrameElement : null;
          if (iframe) {
            const iframeRect = iframe.getBoundingClientRect();
            setSelectionPosition({
              x: iframeRect.left + iframeRect.width / 2,
              y: iframeRect.top + 100
            });
          } else {
            setSelectionPosition({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2
            });
          }
        }
        setShowTextPopup(true);
        setInteractionsCount(prev => prev + 1);
      } else if (!selectedText) {
        setShowTextPopup(false);
      }
    }, 50);
  }, [viewMode, sessionStarted]);

  // Add text selection listener for both PDF and text views
  useEffect(() => {
    if (sessionStarted && (selectedContent || ncertContent)) {
      // Handle mouseup for text selection
      document.addEventListener("mouseup", handleTextSelection);
      // Also listen for selection changes
      document.addEventListener("selectionchange", handleTextSelection);
      
      // Add double-click handler as fallback for PDF
      const handleDoubleClick = (e: MouseEvent) => {
        if (viewMode === "pdf" && sessionStarted) {
          // Small delay to let selection complete
          setTimeout(() => {
            handleTextSelection();
          }, 50);
        }
      };
      
      // Handle copy event as alternative for PDF text selection
      const handleCopy = (e: ClipboardEvent) => {
        if (viewMode === "pdf" && sessionStarted) {
          const copiedText = window.getSelection()?.toString().trim() || 
                           (e.clipboardData?.getData('text/plain') || '').trim();
          
          if (copiedText && copiedText.length >= 3) {
            // Get mouse position for popup
            const mouseEvent = e as any;
            setSelectedText(copiedText);
            setSelectionPosition({
              x: mouseEvent.clientX || window.innerWidth / 2,
              y: (mouseEvent.clientY || window.innerHeight / 2) - 50
            });
            setShowTextPopup(true);
            setInteractionsCount(prev => prev + 1);
          }
        }
      };
      
      // For PDF iframe, add listeners to the iframe container
      let iframeContainer: HTMLElement | null = null;
      let iframeSelectionInterval: NodeJS.Timeout | null = null;
      let lastMouseUpTime = 0;
      let handleIframeMouseUp: ((e: MouseEvent) => void) | null = null;
      
      if (viewMode === "pdf") {
        // Find the iframe container - use a more specific selector
        const pdfFrameDiv = document.querySelector('div.flex-1.overflow-y-auto.overflow-x-hidden.min-h-0.relative');
        iframeContainer = pdfFrameDiv as HTMLElement;
        
        if (iframeContainer) {
          // Add mouseup listener to iframe container
          handleIframeMouseUp = (e: MouseEvent) => {
            lastMouseUpTime = Date.now();
            // Check if click is on or near the iframe
            setTimeout(() => {
              handleTextSelection();
            }, 150);
          };
          
          iframeContainer.addEventListener("mouseup", handleIframeMouseUp, true);
          
          // Also add a periodic check for iframe selection (only when mouse was recently used)
          iframeSelectionInterval = setInterval(() => {
            if (viewMode === "pdf" && sessionStarted) {
              // Only check if mouse was used recently (within last 2 seconds)
              if (Date.now() - lastMouseUpTime < 2000) {
                handleTextSelection();
              }
            }
          }, 300); // Check every 300ms when active
          
        }
      }
      
      document.addEventListener("dblclick", handleDoubleClick);
      document.addEventListener("copy", handleCopy);
      
      return () => {
        document.removeEventListener("mouseup", handleTextSelection);
        document.removeEventListener("selectionchange", handleTextSelection);
        document.removeEventListener("dblclick", handleDoubleClick);
        document.removeEventListener("copy", handleCopy);
        if (iframeContainer && handleIframeMouseUp) {
          iframeContainer.removeEventListener("mouseup", handleIframeMouseUp, true);
        }
        if (iframeSelectionInterval) {
          clearInterval(iframeSelectionInterval);
        }
      };
    }
  }, [sessionStarted, selectedContent, ncertContent, viewMode, handleTextSelection]);

  // Track completion based on PDF viewing time and interactions - only when session is active
  useEffect(() => {
    if (!sessionStarted || !selectedContent && !ncertContent) return;
    
    // Increase completion based on time spent (max 40% from time)
    // 1% per minute, max 40%
    const timeBasedCompletion = Math.min(40, Math.floor(sessionTime / 60));
    
    // Increase based on saved explanations (max 25%)
    // 5% per explanation, max 25%
    const explanationBasedCompletion = Math.min(25, savedExplanations.length * 5);
    
    // Increase based on interactions (max 20%)
    // 2% per interaction, max 20%
    const interactionBasedCompletion = Math.min(20, interactionsCount * 2);
    
    // Pages viewed (max 15%)
    // 3% per page viewed, max 15%
    const pagesBasedCompletion = Math.min(15, pagesViewed * 3);
    
    const totalCompletion = Math.min(100, 
      timeBasedCompletion + 
      explanationBasedCompletion + 
      interactionBasedCompletion + 
      pagesBasedCompletion
    );
    setCompletionPercentage(totalCompletion);
  }, [sessionStarted, sessionTime, savedExplanations.length, interactionsCount, pagesViewed, selectedContent, ncertContent]);

  // Explanation handlers - only work with PDF content using RAG pipeline
  const handleExplain = async (text: string): Promise<string> => {
    const content = selectedContent || ncertContent;
    const hasPdf = content && getPdfUrl(content) && viewMode === "pdf";
    
    if (!hasPdf) {
      throw new Error("Please open a PDF content to use this feature.");
    }
    
    try {
      const response = await api.rag.query({
        query: `Explain this text from the PDF in detail: ${text}`,
        subject: selectedSubject as any,
        top_k: 5,
      });
      return response.generated_text || "Could not generate explanation.";
    } catch (error: any) {
      throw new Error(error.message || "Failed to explain text");
    }
  };

  const handleTranslate = async (text: string): Promise<string> => {
    const content = selectedContent || ncertContent;
    const hasPdf = content && getPdfUrl(content) && viewMode === "pdf";
    
    if (!hasPdf) {
      throw new Error("Please open a PDF content to use this feature.");
    }
    
    try {
      // Use RAG pipeline with translation prompt
      const response = await api.rag.query({
        query: `Translate this text from the PDF to Hindi and provide explanation: ${text}`,
        subject: selectedSubject as any,
        top_k: 5,
      });
      return response.generated_text || "Could not translate text.";
    } catch (error: any) {
      throw new Error(error.message || "Failed to translate text");
    }
  };

  const handleBetterExplain = async (text: string): Promise<string> => {
    const content = selectedContent || ncertContent;
    const hasPdf = content && getPdfUrl(content) && viewMode === "pdf";
    
    if (!hasPdf) {
      throw new Error("Please open a PDF content to use this feature.");
    }
    
    try {
      const response = await api.rag.query({
        query: `Explain this text from the PDF in a simpler and better way with examples: ${text}`,
        subject: selectedSubject as any,
        top_k: 5,
      });
      return response.generated_text || "Could not generate better explanation.";
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate better explanation");
    }
  };

  const handleSaveExplanation = async (text: string, explanation: string, type: string): Promise<void> => {
    if (!user) throw new Error("User not logged in");
    if (!sessionStarted) {
      toast({
        variant: "destructive",
        title: "Session Not Started",
        description: "Please start your study session first",
      });
      return;
    }
    
    const savedItem = {
      id: Date.now().toString(),
      text,
      explanation,
      type,
      timestamp: new Date(),
    };
    
    setSavedExplanations(prev => [...prev, savedItem]);
    setInteractionsCount(prev => prev + 1);
    
    // Save to database (you can create a table for this)
    try {
      const supabaseClient = supabase as any;
      await supabaseClient.from("saved_explanations").insert({
        user_id: user.id,
        content_id: selectedContent?.id || ncertContent?.id,
        selected_text: text,
        explanation: explanation,
        explanation_type: type,
        subject: selectedSubject as SubjectType,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save to database:", error);
      // Continue anyway - saved in local state
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExit = async () => {
    if (!sessionStarted) {
      navigate("/dashboard/student");
      return;
    }
    
    if (exitCompletion >= 80) {
      // Generate quiz if completion is high
      setGeneratingQuiz(true);
      try {
        await generateQuiz();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to generate quiz",
        });
      } finally {
        setGeneratingQuiz(false);
      }
    }
    
    // Save session data
    await saveSessionData();
    navigate("/dashboard/student");
  };

  const parseQuizFromText = (text: string): {
    questions: Array<{
      question: string;
      options?: string[];
      correct_answer?: string;
      explanation?: string;
    }>;
    title?: string;
  } => {
    const questions: Array<{
      question: string;
      options?: string[];
      correct_answer?: string;
      explanation?: string;
    }> = [];
    
    // Try to parse questions from markdown/text format
    // Look for patterns like "Q1:", "Question 1:", numbered lists, etc.
    const questionPatterns = [
      /(?:^|\n)(?:Q\d+|Question\s+\d+|^\d+[\.\)])\s*[:\-]?\s*(.+?)(?=(?:Q\d+|Question\s+\d+|^\d+[\.\)])|$)/gis,
      /(?:^|\n)\*\*(?:Q\d+|Question\s+\d+)\*\*\s*(.+?)(?=\*\*(?:Q\d+|Question\s+\d+)\*\*|$)/gis,
    ];
    
    let parsed = false;
    for (const pattern of questionPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        matches.forEach((match, index) => {
          const questionText = match[1]?.trim() || match[0]?.trim();
          if (questionText && questionText.length > 10) {
            // Try to extract options (A, B, C, D or a, b, c, d)
            const optionPattern = /([A-Da-d])[\.\)]\s*(.+?)(?=[A-Da-d][\.\)]|$)/g;
            const options: string[] = [];
            const optionMatches = [...questionText.matchAll(optionPattern)];
            
            optionMatches.forEach(optMatch => {
              if (optMatch[2]) {
                options.push(optMatch[2].trim());
              }
            });
            
            // Try to find correct answer indicator
            let correctAnswer: string | undefined;
            const answerPattern = /(?:correct|answer|right)[:\s]+([A-Da-d])/i;
            const answerMatch = questionText.match(answerPattern);
            if (answerMatch) {
              correctAnswer = answerMatch[1].toUpperCase();
            }
            
            questions.push({
              question: questionText,
              options: options.length > 0 ? options : undefined,
              correct_answer: correctAnswer,
            });
          }
        });
        parsed = true;
        break;
      }
    }
    
    // If parsing failed, split by paragraphs and create simple questions
    if (!parsed && questions.length === 0) {
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
      paragraphs.slice(0, 5).forEach((para, index) => {
        questions.push({
          question: para.trim(),
        });
      });
    }
    
    return {
      title: `Quiz: ${selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}`,
      questions: questions.length > 0 ? questions : [{
        question: text.substring(0, 500),
      }],
    };
  };

  const generateQuiz = async () => {
    if (!user || !selectedContent) return;
    
    const content = selectedContent || ncertContent;
    const contentText = content.content_text || "";
    
    // Generate quiz using backend API
    try {
      const quizPrompt = `Generate a quiz with 5 multiple choice questions based on this educational content. Format each question as:

Q1: [Question text]
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
Correct Answer: [Letter]

Content: ${contentText.substring(0, 2000)}`;
      
      const quizData = await api.rag.query({
        query: quizPrompt,
        subject: selectedSubject as any,
        top_k: 3,
      });
      
      // Parse quiz from response
      const quizText = quizData.generated_text || "";
      const parsedQuiz = parseQuizFromText(quizText);
      
      // Store quiz in state
      setGeneratedQuiz(parsedQuiz);
      setShowQuizDialog(true);
      
      // Save quiz session (gracefully handle if table doesn't exist)
      try {
        const supabaseClient = supabase as any;
        const { data, error } = await supabaseClient.from("quiz_sessions").insert({
          user_id: user.id,
          quiz_data: parsedQuiz,
          subject: selectedSubject as SubjectType,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          is_completed: true,
          metadata: { content_id: content.id },
        });
        
        if (error) {
          // Silently handle - quiz display works even if saving fails
          console.debug("Quiz session not saved (table may not exist):", error.message || error);
        }
      } catch (saveError: any) {
        console.warn("Error saving quiz session:", saveError);
      }
      
      toast({
        title: "Quiz Generated",
        description: "A quiz has been created based on your study session",
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate quiz");
    }
  };

  const saveSessionData = async () => {
    if (!user || !sessionStarted) return;
    
    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient.from("classroom_sessions").insert({
        user_id: user.id,
        content_id: selectedContent?.id || ncertContent?.id || null,
        subject: selectedSubject as SubjectType,
        duration_seconds: sessionTime,
        completion_percentage: exitCompletion,
        saved_explanations_count: savedExplanations.length,
        interactions_count: interactionsCount,
        pages_viewed: pagesViewed,
        started_at: sessionStartTime?.toISOString() || new Date().toISOString(),
        ended_at: new Date().toISOString(),
      });
      
      if (error) {
        console.warn("Failed to save session data (table may not exist):", error);
        // Don't throw - session tracking is optional
      }
    } catch (error) {
      console.warn("Error saving session data:", error);
      // Don't throw - session tracking is optional
    }
  };

  // Track PDF page views
  const handlePdfPageChange = () => {
    if (sessionStarted) {
      setPagesViewed(prev => prev + 1);
    }
  };

  const getPdfUrl = (content: any): string | null => {
    if (!content) return null;
    const metadata = content.metadata as { pdf_url?: string; file_url?: string } | null;
    return metadata?.pdf_url || metadata?.file_url || null;
  };

  const fetchChapters = async () => {
    try {
      // Fetch topics/chapters for the selected subject
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("subject", selectedSubject as SubjectType)
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

  const fetchAllContent = async () => {
    setLoadingContent(true);
    try {
      // Fetch all content for the selected subject
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("subject", selectedSubject as SubjectType)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setAllContent(data || []);
      
      // Auto-select first content if available and no content is selected
      if (data && data.length > 0 && !selectedContent) {
        setSelectedContent(data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching all content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load content",
      });
    } finally {
      setLoadingContent(false);
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
        .eq("subject", selectedSubject as SubjectType)
        .eq("topic_id", selectedChapter)
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      
      if (data) {
        // Check if PDF exists in Supabase Storage
        // Try to construct PDF URL from content ID or metadata
        const metadata = data.metadata as { pdf_url?: string; file_url?: string } | null;
        let pdfUrl = metadata?.pdf_url || metadata?.file_url;
        
        // If no PDF URL in metadata, try to get from Supabase Storage
        if (!pdfUrl && data.id) {
          // Check if PDF exists in storage bucket
          try {
            const fileName = `content/${data.id}.pdf`;
            const { data: fileData, error: listError } = await supabase.storage
              .from("content")
              .list(`content/${data.id}`, {
                limit: 1,
                search: ".pdf"
              });
            
            if (!listError && fileData && fileData.length > 0) {
              const { data: urlData } = supabase.storage
                .from("content")
                .getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                pdfUrl = urlData.publicUrl;
              }
            }
          } catch (storageError: any) {
            // Bucket might not exist or there's a storage error
            console.warn("Storage bucket access failed:", storageError?.message || storageError);
            // Continue without PDF URL - will use text view instead
          }
        }
        
        // Update metadata with PDF URL if found
        if (pdfUrl && !metadata?.pdf_url) {
          data.metadata = {
            ...(data.metadata as object || {}),
            pdf_url: pdfUrl
          } as Json;
        }
        
        // Set default view mode based on PDF availability
        if (pdfUrl) {
          setViewMode("pdf");
        } else {
          setViewMode("text");
        }
      }
      
      setNcertContent(data || null);
      setSelectedContent(data || null);
    } catch (error: any) {
      console.error("Error fetching NCERT content:", error);
    }
  };

  const handleContentSelect = async (content: any) => {
    setSelectedContent(content);
    setNcertContent(content);
    setPdfLoading(true);
    setPdfError(false);
    
    // Check if PDF exists
    const metadata = content.metadata as { pdf_url?: string; file_url?: string } | null;
    let pdfUrl = metadata?.pdf_url || metadata?.file_url;
    
    if (!pdfUrl && content.id) {
      // Try to get from storage
      try {
        const fileName = `content/${content.id}.pdf`;
        const { data: urlData } = supabase.storage
          .from("content")
          .getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          pdfUrl = urlData.publicUrl;
        }
      } catch (e) {
        console.error("Error getting PDF URL:", e);
      }
    }
    
    // Update metadata with PDF URL if found
    if (pdfUrl && !metadata?.pdf_url) {
      content.metadata = {
        ...(content.metadata as object || {}),
        pdf_url: pdfUrl
      } as Json;
    }
    
    // Set view mode based on PDF availability
    if (pdfUrl) {
      setViewMode("pdf");
      // Reset loading state after a short delay to allow iframe to start loading
      setTimeout(() => {
        // Loading will be handled by iframe onLoad/onError
      }, 100);
    } else {
      setViewMode("text");
      setPdfLoading(false);
    }
    
    // Fetch related YouTube videos based on content topic/chapter
    fetchRelatedVideos(content);
  };


  // Search YouTube based on content metadata and optional analysis
  const searchYouTubeFromAnalysis = async (content: any, analysis: string) => {
    setLoadingRelatedVideos(true);
    try {
      // Build search terms from content metadata
      const searchTerms = [];
      
      // Add title
      if (content.title) {
        searchTerms.push(content.title);
      }
      
      // Add chapter information
      if (content.chapter) {
        searchTerms.push(content.chapter);
      }
      
      const chapterNumber = content.chapter_number || (content.metadata as { chapter_number?: number } | null)?.chapter_number;
      if (chapterNumber) {
        searchTerms.push(`Chapter ${chapterNumber}`);
      }
      
      // Add subject
      searchTerms.push(selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1));
      
      // Add class/grade if available
      const classGrade = content.class_grade || (content.metadata as { class_grade?: number } | null)?.class_grade;
      if (classGrade) {
        searchTerms.push(`Class ${classGrade}`);
      }
      
      // Try to extract key terms from analysis if available
      if (analysis) {
        // Simple extraction of potential keywords
        const lines = analysis.split("\n").filter(line => line.trim().length > 0);
        const keywordLines = lines.filter(line => 
          line.toLowerCase().includes("keyword") || 
          line.toLowerCase().includes("topic") ||
          line.toLowerCase().includes("concept")
        );
        
        if (keywordLines.length > 0) {
          // Extract words after colons or dashes
          keywordLines.slice(0, 3).forEach(line => {
            const parts = line.split(/[:,-]/);
            if (parts.length > 1) {
              const keywords = parts[1].trim().split(/\s+/).slice(0, 2);
              searchTerms.push(...keywords.filter(k => k.length > 3));
            }
          });
        }
      }
      
      // Build final search query
      const searchQuery = searchTerms.slice(0, 5).join(" "); // Limit to 5 terms
      
      // Search YouTube for related videos
      const videos = await api.videos.searchYouTube({
        query: searchQuery,
        max_results: 15,
      });
      
      // Reset quota exceeded flag on successful fetch
      if (videos && videos.length > 0) {
        setYoutubeQuotaExceeded(false);
      }
      
      setRelatedVideos(videos || []);
    } catch (error: any) {
      // Handle YouTube API errors gracefully
      const errorMessage = error.message || "";
      const errorData = error.data || {};
      const errorCode = errorData.code || error.status || "";
      
      // Check for quota exceeded error
      const isQuotaError = errorMessage.includes("quota") || 
                          errorMessage.includes("quotaExceeded") ||
                          errorMessage.includes("QUOTA_EXCEEDED") ||
                          errorCode === "YOUTUBE_QUOTA_EXCEEDED" ||
                          (error.status === 503 && errorMessage.toLowerCase().includes("quota"));
      
      // Check for API key errors
      const isApiKeyError = errorMessage.includes("API key expired") || 
                           errorMessage.includes("YOUTUBE_API_KEY") ||
                           errorMessage.includes("API key has expired") ||
                           errorCode === "YOUTUBE_API_KEY_ERROR";
      
      if (isQuotaError) {
        // Set quota exceeded flag for UI display
        setYoutubeQuotaExceeded(true);
        console.warn("YouTube API quota exceeded. Videos feature temporarily unavailable.");
      } else if (isApiKeyError) {
        // Silently handle API key errors - videos feature is temporarily unavailable
        console.debug("YouTube API key expired. Videos feature temporarily unavailable.");
        setYoutubeQuotaExceeded(false);
      } else {
        // Log other errors for debugging
        console.warn("Error fetching related videos:", errorMessage);
        setYoutubeQuotaExceeded(false);
      }
      
      // Set empty videos array - UI will show friendly message
      setRelatedVideos([]);
    } finally {
      setLoadingRelatedVideos(false);
    }
  };

  const fetchRelatedVideos = async (content: any) => {
    await searchYouTubeFromAnalysis(content, "");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-medium">Loading classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      <StudentSidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
          <div className="p-4 md:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Classroom
                      </h1>
                      <p className="text-sm text-muted-foreground mt-1">Study, learn, and ask questions</p>
                    </div>
                    {/* Session Timer - Only show when session started */}
                    {sessionStarted && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/15 to-primary/10 rounded-lg border border-primary/20 shadow-sm">
                          <Clock className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-sm font-semibold text-primary">{formatTime(sessionTime)}</span>
                        </div>
                        {/* Completion Badge */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/15 to-emerald-500/10 rounded-lg border border-green-500/20 shadow-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                            {completionPercentage}% Complete
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {!sessionStarted ? (
                    <Button
                      onClick={handleStartSession}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Study Session
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExitDialog(true)}
                      className="border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40 transition-all"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Exit Classroom
                    </Button>
                  )}
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full sm:w-48 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              
              {/* Content Library Dropdown - Shows after subject selection */}
              {selectedSubject && (
                    <>
                      <div className="hidden sm:flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Content Library</span>
                      </div>
                      <Select
                        value={selectedContent?.id || ncertContent?.id || ""}
                        onValueChange={(value) => {
                          if (value === "ncert") {
                            setNcertContent({
                              id: "ncert",
                              title: `NCERT ${selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}`,
                              subject: selectedSubject,
                              type: "ncert",
                            } as any);
                            setSelectedContent(null);
                          } else {
                            const content = allContent.find(c => c.id === value);
                            if (content) {
                              setSelectedContent(content);
                              setNcertContent(null);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-64 border-2">
                          <SelectValue placeholder="Select content..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ncert">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <span>NCERT {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}</span>
                            </div>
                          </SelectItem>
                          {allContent
                            .filter(c => c.subject === selectedSubject)
                            .map((content) => {
                              const displayText = content.title || 
                                (content.chapter ? `${content.chapter}${content.chapter_number ? ` - ${content.chapter_number}` : ''}` : 'Untitled');
                              return (
                                <SelectItem key={content.id} value={content.id}>
                                  {displayText}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </div>
              
              {/* Mobile Content Library Label */}
              {selectedSubject && (
                <div className="sm:hidden flex items-center gap-2 pt-2 border-t">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Content Library</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
        
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Content Section */}
            <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 min-h-0 relative">
              {/* Start Session Overlay */}
              {!sessionStarted && (selectedContent || ncertContent) && (
                <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <Card className="max-w-md w-full mx-4 shadow-2xl border-2 bg-gradient-to-br from-background to-muted/30">
                    <CardHeader className="text-center space-y-3">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-2 shadow-lg border-2 border-primary/20">
                        <BookOpen className="h-10 w-10 text-primary" />
                      </div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Ready to Start?
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Click the button below to begin your study session. Your progress will be tracked automatically.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-foreground">Time tracking</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-foreground">Progress monitoring</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-foreground">Text selection & explanations</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-foreground">Quiz generation on completion</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleStartSession}
                        size="lg"
                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Start Study Session
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              
                {selectedContent || ncertContent ? (
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {/* Header Card */}
                    <Card className="shrink-0 shadow-lg border-2 bg-gradient-to-r from-background to-muted/20">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl md:text-2xl mb-3 break-words font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                              {(selectedContent || ncertContent).title || `${(selectedContent || ncertContent).type?.toUpperCase() || "Content"}`}
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="text-xs px-2.5 py-1 font-semibold shadow-sm">
                                {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}
                              </Badge>
                              <Badge variant="outline" className="text-xs px-2.5 py-1 font-semibold border-2">
                                {(selectedContent || ncertContent).type?.toUpperCase() || "CONTENT"}
                              </Badge>
                              {(selectedContent || ncertContent).chapter && (
                                <Badge variant="outline" className="text-xs px-2.5 py-1 font-semibold border-2">
                                  {(selectedContent || ncertContent).chapter}
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                          {/* View Mode Toggle */}
                          {getPdfUrl(selectedContent || ncertContent) && (
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant={viewMode === "pdf" ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setViewMode("pdf");
                                  setPdfError(false);
                                  setPdfLoading(true);
                                }}
                                className={viewMode === "pdf" ? "shadow-md" : ""}
                                title="View PDF and Text together"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                PDF + Text
                              </Button>
                              <Button
                                variant={viewMode === "text" ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setViewMode("text");
                                }}
                                className={viewMode === "text" ? "shadow-md" : ""}
                                title="View Text only"
                              >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Text Only
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Split View: PDF on Left, Chat/Videos/Wolfram on Right */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
                      {/* Left Side: PDF Content Viewer */}
                      <Card className="flex-1 flex flex-col overflow-hidden min-h-0 shadow-lg border-2">
                        <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
                        {/* PDF Viewer Only */}
                        {viewMode === "pdf" && getPdfUrl(selectedContent || ncertContent) && !pdfError ? (
                          <div className="flex flex-col bg-gradient-to-br from-muted/40 to-muted/20 flex-1 min-h-0 rounded-lg overflow-hidden">
                            {/* PDF Toolbar */}
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-background to-muted/30 border-b shadow-sm shrink-0">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="p-1.5 rounded-md bg-primary/10">
                                  <FileText className="h-4 w-4 text-primary shrink-0" />
                                </div>
                                <span className="text-sm font-semibold">PDF Viewer</span>
                                {process.env.NODE_ENV === 'development' && (
                                  <span className="text-xs text-muted-foreground truncate ml-2" title={getPdfUrl(selectedContent || ncertContent) || ""}>
                                    ({getPdfUrl(selectedContent || ncertContent)})
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const content = selectedContent || ncertContent;
                                    const pdfUrl = getPdfUrl(content);
                                    if (pdfUrl) window.open(pdfUrl, "_blank");
                                  }}
                                  className="h-8 hover:bg-primary/10 transition-colors"
                                >
                                  <Maximize className="h-4 w-4 mr-1.5" />
                                  Fullscreen
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const content = selectedContent || ncertContent;
                                    const pdfUrl = getPdfUrl(content);
                                    if (pdfUrl) {
                                    const link = document.createElement("a");
                                    link.href = pdfUrl;
                                    link.download = `${content.title || "content"}.pdf`;
                                    link.click();
                                    }
                                  }}
                                  className="h-8 hover:bg-primary/10 transition-colors"
                                >
                                  <FileText className="h-4 w-4 mr-1.5" />
                                  Download
                                </Button>
                              </div>
                            </div>
                            {/* PDF Viewer - Full Width */}
                            <div 
                              className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative bg-muted/20"
                              style={{ 
                                pointerEvents: sessionStarted ? 'auto' : 'none', 
                                opacity: sessionStarted ? 1 : 0.6,
                                filter: sessionStarted ? 'none' : 'blur(2px)'
                              }}
                            >
                              {pdfLoading && !pdfError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                                  <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Loading PDF...</p>
                                  </div>
                                </div>
                              )}
                              {(() => {
                                const content = selectedContent || ncertContent;
                                const pdfUrl = getPdfUrl(content);
                                
                                if (!pdfUrl) {
                                  return (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="text-center p-8">
                                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                        <p className="text-sm text-muted-foreground">No PDF URL available</p>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Log PDF URL in development for debugging
                                if (process.env.NODE_ENV === 'development') {
                                  console.log('Loading PDF:', pdfUrl);
                                }
                                
                                return (
                                  <iframe
                                    key={pdfUrl}
                                    src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-width`}
                                    className="w-full h-full border-0"
                                    title="Content PDF"
                                    allow="fullscreen"
                                    style={{ 
                                      display: pdfLoading ? 'none' : 'block'
                                    }}
                                    onError={() => {
                                      setPdfError(true);
                                      setPdfLoading(false);
                                      console.error("PDF iframe failed to load:", pdfUrl);
                                    }}
                                    onLoad={() => {
                                      setPdfError(false);
                                      setPdfLoading(false);
                                      if (process.env.NODE_ENV === 'development') {
                                        console.log('PDF loaded successfully');
                                      }
                                    }}
                                  />
                                );
                              })()}
                            </div>
                          </div>
                        ) : viewMode === "pdf" && (pdfError || !getPdfUrl(selectedContent || ncertContent)) ? (
                          <div className="flex items-center justify-center border-t bg-gradient-to-br from-muted/40 to-muted/20">
                            <div className="text-center p-8 max-w-md">
                              <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                <FileText className="h-10 w-10 text-muted-foreground opacity-50" />
                              </div>
                              <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {pdfError ? "PDF Failed to Load" : "PDF Not Available"}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-6">
                                {pdfError 
                                  ? "There was an error loading the PDF. You can try opening it in a new tab or view the text content instead."
                                  : "PDF file is not available for this content. Showing text view instead."}
                              </p>
                              <div className="flex gap-2 justify-center">
                                {getPdfUrl(selectedContent || ncertContent) ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        const content = selectedContent || ncertContent;
                                        const pdfUrl = getPdfUrl(content);
                                        if (pdfUrl) window.open(pdfUrl, "_blank");
                                      }}
                                      className="border-2"
                                    >
                                      Open in New Tab
                                    </Button>
                                    <Button 
                                      onClick={() => {
                                        setPdfError(false);
                                        setViewMode("text");
                                      }}
                                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md"
                                    >
                                      View as Text
                                    </Button>
                                  </>
                                ) : (
                                  <Button 
                                    onClick={() => setViewMode("text")}
                                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md"
                                  >
                                    View as Text
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 overflow-y-auto border-t bg-gradient-to-br from-muted/40 to-muted/20">
                            <div className="p-6">
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <div className="bg-background rounded-xl border-2 p-6 shadow-lg">
                                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground overflow-x-auto">
                                    {(selectedContent || ncertContent).content_text || "No content text available"}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Right Side: Tabs for Videos and AI Tutor */}
                    <Card className="flex-1 flex flex-col overflow-hidden min-h-0 shadow-lg border-2">
                      <CardHeader className="shrink-0 pb-2 bg-gradient-to-r from-background to-muted/20 border-b">
                        <Tabs value={rightPanelTab} onValueChange={(value) => setRightPanelTab(value as "videos" | "tutor")}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="tutor" className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              AI Tutor
                            </TabsTrigger>
                            <TabsTrigger value="videos" className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              Videos
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0 bg-gradient-to-b from-background to-muted/10">
                        {rightPanelTab === "tutor" ? (
                          <div className="flex-1 overflow-hidden">
                            <EnhancedAITutorPage />
                          </div>
                        ) : rightPanelTab === "videos" ? (
                          <>
                            {loadingRelatedVideos ? (
                              <div className="flex items-center justify-center h-full py-12">
                                <div className="text-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground font-medium">Searching YouTube...</p>
                                </div>
                              </div>
                            ) : relatedVideos.length === 0 ? (
                              <div className="flex items-center justify-center h-full py-12">
                                <div className="text-center p-6 max-w-md">
                                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Video className="h-8 w-8 text-muted-foreground opacity-50" />
                                  </div>
                                  {youtubeQuotaExceeded ? (
                                    <>
                                      <p className="text-sm font-medium text-foreground mb-1">YouTube API Quota Exceeded</p>
                                      <p className="text-xs text-muted-foreground mt-1 mb-3">
                                        The YouTube API quota has been exceeded for today. Videos will be available again after the quota resets (typically at midnight PST).
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-sm font-medium text-foreground mb-1">Related videos unavailable</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Videos are temporarily unavailable.
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <ScrollArea className="h-full">
                                <div className="p-4 space-y-3">
                                  {relatedVideos.slice(0, 3).map((video, index) => (
                                    <div
                                      key={video.youtube_id || index}
                                      onClick={() => {
                                            window.open(`https://www.youtube.com/watch?v=${video.youtube_id}`, "_blank");
                                      }}
                                      className="p-3 border-2 rounded-xl cursor-pointer transition-all hover:bg-accent hover:border-primary/50 hover:shadow-md group"
                                    >
                                      <div className="flex gap-3">
                                        <div className="relative w-40 h-24 bg-muted rounded-lg flex-shrink-0 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                                          <img
                                            src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                              <Play className="h-5 w-5 text-white ml-0.5" />
                                            </div>
                                          </div>
                                          {video.duration_seconds && (
                                            <div className="absolute bottom-1 right-1 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                                              {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, "0")}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold line-clamp-2 mb-1.5 text-foreground group-hover:text-primary transition-colors">
                                            {video.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                                            {video.channel_name}
                                          </p>
                                          {video.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                              {video.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            )}
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                    </div>

                  
                  </div>
                ) : (
                  <Card className="flex-1 shadow-lg border-2 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="flex items-center justify-center h-full py-12">
                      <div className="text-center max-w-md">
                        <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                          <BookOpen className="h-10 w-10 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          No Content Available
                        </h3>
                        <p className="text-muted-foreground text-base">
                          Select content from the dropdown above to view it here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                          </div>
                                </div>
                              </div>
      </main>
      
      {/* Text Selection Popup */}
      {showTextPopup && selectedText && (
        <TextSelectionPopup
          selectedText={selectedText}
          position={selectionPosition}
          onClose={() => {
            setShowTextPopup(false);
            setSelectedText("");
            // Clear selection in main document
            window.getSelection()?.removeAllRanges();
            // Try to clear selection in PDF iframe if accessible
            if (viewMode === "pdf") {
              try {
                const iframe = document.querySelector('iframe[title="Content PDF"]') as HTMLIFrameElement;
                if (iframe && iframe.contentWindow) {
                  iframe.contentWindow.getSelection()?.removeAllRanges();
                }
              } catch (e) {
                // Ignore CORS errors
              }
            }
          }}
          onExplain={handleExplain}
          onTranslate={handleTranslate}
          onBetterExplain={handleBetterExplain}
          onSave={handleSaveExplanation}
        />
      )}
      
      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Exit Classroom</DialogTitle>
            <DialogDescription className="text-base">
              How much of this content have you completed?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="completion" className="text-base font-semibold mb-3 block">Completion Percentage</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="completion"
                  type="number"
                  min="0"
                  max="100"
                  value={exitCompletion}
                  onChange={(e) => setExitCompletion(Number(e.target.value))}
                  className="w-24 border-2 text-center font-semibold"
                />
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={exitCompletion}
                    onChange={(e) => setExitCompletion(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1 font-medium">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
            {exitCompletion >= 80 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-primary/15 to-primary/10 rounded-lg border-2 border-primary/20">
                <p className="text-sm text-primary font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Great progress! A quiz will be generated to test your knowledge.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExitDialog(false)} className="border-2">
              Cancel
            </Button>
            <Button 
              onClick={handleExit} 
              disabled={generatingQuiz}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md"
            >
              {generatingQuiz ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                "Exit & Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Display Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {generatedQuiz?.title || "Generated Quiz"}
            </DialogTitle>
            <DialogDescription className="text-base">
              Test your knowledge with these questions based on your study session
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {generatedQuiz?.questions.map((q, index) => (
                <Card key={index} className="p-5 shadow-md border-2 bg-gradient-to-br from-background to-muted/20">
                      <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="shrink-0 mt-1 px-3 py-1 font-bold text-base border-2">
                        Q{index + 1}
                      </Badge>
                      <div className="flex-1">
                        <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {q.question}
                          </ReactMarkdown>
                          </div>
                        
                        {q.options && q.options.length > 0 ? (
                          <RadioGroup disabled className="space-y-2">
                            {q.options.map((option, optIndex) => {
                              const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D
                              const isCorrect = q.correct_answer === optionLabel;
                              return (
                                <div
                                  key={optIndex}
                                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                                    isCorrect
                                      ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 shadow-sm"
                                      : "bg-muted/50 border-transparent"
                                  }`}
                                >
                                  <RadioGroupItem
                                    value={optionLabel}
                                    id={`q${index}-opt${optIndex}`}
                                    checked={isCorrect}
                                  />
                                  <Label
                                    htmlFor={`q${index}-opt${optIndex}`}
                                    className={`flex-1 cursor-pointer flex items-center ${
                                      isCorrect ? "font-semibold text-green-700 dark:text-green-400" : ""
                                    }`}
                                  >
                                    <span className="font-bold mr-2 text-base">{optionLabel}.</span>
                                    <span>{option}</span>
                                    {isCorrect && (
                                      <CheckCircle2 className="inline-block h-5 w-5 ml-2 text-green-600 dark:text-green-400 shrink-0" />
                                    )}
                                  </Label>
                      </div>
                              );
                            })}
                          </RadioGroup>
                        ) : (
                          <div className="p-4 bg-muted rounded-lg border-2">
                            <p className="text-sm text-foreground font-medium">
                              {q.correct_answer ? (
                                <span>
                                  <strong className="text-primary">Answer:</strong> {q.correct_answer}
                                </span>
                              ) : (
                                "Short answer question"
                              )}
                            </p>
                      </div>
                    )}
                        
                        {q.explanation && (
                          <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                            <p className="text-sm">
                              <strong className="text-blue-700 dark:text-blue-400 font-semibold">Explanation:</strong>{" "}
                              <span className="text-blue-600 dark:text-blue-300">{q.explanation}</span>
                            </p>
                      </div>
                    )}
          </div>
        </div>
    </div>
              </Card>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4 gap-2">
        <Button
          variant="outline"
              onClick={() => setShowQuizDialog(false)}
          className="border-2"
        >
              Close
        </Button>
        <Button
          onClick={() => {
                setShowQuizDialog(false);
                navigate("/dashboard/student");
          }}
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md"
        >
              Go to Dashboard
        </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Floating Note Maker */}
      {user && (
        <FloatingNoteMaker
          userId={user.id}
          contentId={selectedContent?.id || ncertContent?.id}
          subject={selectedSubject}
        />
      )}
    </div>
  );
};

export default Classroom;

