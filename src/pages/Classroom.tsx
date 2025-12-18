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
  Bot,
  StickyNote,
  Save,
  Archive,
  Heart,
  FileQuestion,
  Hand
} from "lucide-react";
import { FloatingNoteMaker } from "@/components/FloatingNoteMaker";
import NotificationSystem from "@/components/NotificationSystem";
import EnhancedAITutorPage from "@/pages/classroom_ai";
import ClassroomMCQ from "@/components/ClassroomMCQ";
import PDFLensTool from "@/components/PDFLensTool";
// import TestPDFLens from "@/components/TestPDFLens";
import ClassroomDrawing from "@/components/ClassroomDrawing";



const Classroom = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // State
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get("subject") || "mathematics");

  const [ncertContent, setNcertContent] = useState<any>(null);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [allContent, setAllContent] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<any>(null);
  const [loadingFeaturedVideo, setLoadingFeaturedVideo] = useState(false);
  const [loadingRelatedVideos, setLoadingRelatedVideos] = useState(false);
  const [youtubeQuotaExceeded, setYoutubeQuotaExceeded] = useState(false);
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  

  
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

  const [rightPanelTab, setRightPanelTab] = useState<"videos" | "tutor" | "memory" | "mcq" | "draw">("tutor");
  
  // PDF container ref for lens tool
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  

  
  
  // Force show notes for debugging
  const [forceShowNotes, setForceShowNotes] = useState(false);
  


  
  // Video dialog state
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [videoNotes, setVideoNotes] = useState<string>("");
  const [generatingVideoNotes, setGeneratingVideoNotes] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  
  // Memory system state
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<any[]>([]);
  const [showMemoryDialog, setShowMemoryDialog] = useState(false);
  const [savingToMemory, setSavingToMemory] = useState(false);
  


  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && selectedSubject) {
      fetchAllContent();
    }
  }, [user, selectedSubject]);

  // Load saved memory when user is available
  useEffect(() => {
    if (user) {
      loadSavedMemory();
      loadSavedQuizzes();
    }
  }, [user]);

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
    
    // Remember session start interaction
    rememberInteraction('start_session', 'session_manager', {
      subject: selectedSubject,
      content_id: (selectedContent || ncertContent)?.id,
      content_title: (selectedContent || ncertContent)?.title || (selectedContent || ncertContent)?.chapter
    });

    // Create success notification
    if (user) {
      api.notifications.create(user.id, {
        type: 'success',
        title: '🎯 Study Session Started!',
        message: `Your ${selectedSubject} study session is now active. Progress tracking enabled.`,
        auto_dismiss: true,
        dismiss_after: 5000,
        importance: 0.7
      }).catch(console.debug);
    }
    
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



  // Track completion based on PDF viewing time and interactions - only when session is active
  useEffect(() => {
    if (!sessionStarted || !selectedContent && !ncertContent) return;
    
    // Increase completion based on time spent (max 60% from time)
    // 1% per minute, max 60%
    const timeBasedCompletion = Math.min(60, Math.floor(sessionTime / 60));
    
    // Increase based on interactions (max 25%)
    // 3% per interaction, max 25%
    const interactionBasedCompletion = Math.min(25, interactionsCount * 3);
    
    // Pages viewed (max 15%)
    // 3% per page viewed, max 15%
    const pagesBasedCompletion = Math.min(15, pagesViewed * 3);
    
    const totalCompletion = Math.min(100, 
      timeBasedCompletion + 
      interactionBasedCompletion + 
      pagesBasedCompletion
    );
    setCompletionPercentage(totalCompletion);
  }, [sessionStarted, sessionTime, interactionsCount, pagesViewed, selectedContent, ncertContent]);



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
    
    // Old quiz generation disabled - now using MCQ tab instead
    // if (exitCompletion >= 80) {
    //   setGeneratingQuiz(true);
    //   try {
    //     await generateQuiz();
    //   } catch (error: any) {
    //     toast({
    //       variant: "destructive",
    //       title: "Error",
    //       description: error.message || "Failed to generate quiz",
    //     });
    //   } finally {
    //     setGeneratingQuiz(false);
    //   }
    // }
    
    // Save session data
    await saveSessionData();
    navigate("/dashboard/student");
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



  const getPdfUrl = (content: any): string | null => {
    if (!content) return null;
    const metadata = content.metadata as { pdf_url?: string; file_url?: string } | null;
    return metadata?.pdf_url || metadata?.file_url || null;
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

  const handleContentSelect = async (content: any) => {
    setSelectedContent(content);
    setNcertContent(content);
    setPdfLoading(true);
    setPdfError(false);
    
    // Remember content selection interaction
    rememberInteraction('select_content', 'content_selector', {
      content_id: content.id,
      content_title: content.title || content.chapter,
      content_type: content.type,
      subject: selectedSubject,
      chapter: content.chapter,
      previous_content: selectedContent?.id
    });
    
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


  // Fetch single most relevant video for direct display
  const fetchFeaturedVideo = async (content: any) => {
    setLoadingFeaturedVideo(true);
    setFeaturedVideo(null);
    
    try {
      const subjectName = selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1);
      const contentTitle = content.title || content.chapter || "Educational Content";
      const classGrade = content.class_grade || (content.metadata as { class_grade?: number } | null)?.class_grade || 12;
      
      // Create the most specific search query for the best match
      const primaryQuery = `Class ${classGrade} ${subjectName} ${contentTitle} tutorial explanation`;
      
      console.log(`Fetching featured video with query: "${primaryQuery}"`);
      
      const videos = await api.videos.searchYouTube({
        query: primaryQuery.trim(),
        max_results: 5, // Get a few options to pick the best one
      });
      
      if (videos && videos.length > 0) {
        // Score and select the best video
        const scoredVideos = videos
          .filter(video => video.youtube_id) // Ensure valid video ID
          .map(video => ({
            ...video,
            relevanceScore: getVideoRelevanceScore(video, content, selectedSubject)
          }))
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        if (scoredVideos.length > 0) {
          const bestVideo = scoredVideos[0];
          console.log(`Selected featured video: "${bestVideo.title}" (Score: ${bestVideo.relevanceScore})`);
          setFeaturedVideo(bestVideo);
          setYoutubeQuotaExceeded(false);
          
          // Create video found notification
          if (user) {
            api.notifications.create(user.id, {
              type: 'info',
              title: '🎬 Educational Video Found!',
              message: `Found "${bestVideo.title}" by ${bestVideo.channel_name} for your current topic.`,
              auto_dismiss: true,
              dismiss_after: 3000,
              importance: 0.5
            }).catch(console.debug);
          }
          
          // Also generate notes for the featured video
          await generateVideoNotes(bestVideo);
          return;
        }
      }
      
      // If no videos found, try a fallback search
      const fallbackQuery = `${subjectName} ${contentTitle} Khan Academy Vedantu`;
      console.log(`Trying fallback query: "${fallbackQuery}"`);
      
      const fallbackVideos = await api.videos.searchYouTube({
        query: fallbackQuery.trim(),
        max_results: 3,
      });
      
      if (fallbackVideos && fallbackVideos.length > 0) {
        const bestFallback = fallbackVideos.find(video => video.youtube_id);
        if (bestFallback) {
          setFeaturedVideo(bestFallback);
          await generateVideoNotes(bestFallback);
          return;
        }
      }
      
      // No videos found
      setFeaturedVideo(null);
      
    } catch (error: any) {
      console.error('Error fetching featured video:', error);
      const errorMessage = error.message || "";
      const errorCode = error.data?.code || error.status || "";
      
      // Check for quota exceeded error
      const isQuotaError = errorMessage.includes("quota") || 
                          errorMessage.includes("quotaExceeded") ||
                          errorMessage.includes("QUOTA_EXCEEDED") ||
                          errorCode === "YOUTUBE_QUOTA_EXCEEDED";
      
      if (isQuotaError) {
        setYoutubeQuotaExceeded(true);
      }
      
      setFeaturedVideo(null);
    } finally {
      setLoadingFeaturedVideo(false);
    }
  };

  // Search YouTube based on content metadata and optional analysis
  const searchYouTubeFromAnalysis = async (content: any, analysis: string) => {
    setLoadingRelatedVideos(true);
    try {
      // Build enhanced search terms from content metadata
      const searchTerms = [];
      const educationalKeywords = [];
      
      // Add title with educational context
      if (content.title) {
        const cleanTitle = content.title.replace(/[^\w\s]/g, '').trim();
        searchTerms.push(cleanTitle);
        
        // Add educational context
        educationalKeywords.push(`${cleanTitle} tutorial`);
        educationalKeywords.push(`${cleanTitle} explained`);
        educationalKeywords.push(`${cleanTitle} lesson`);
      }
      
      // Add chapter information with educational context
      if (content.chapter) {
        searchTerms.push(content.chapter);
        educationalKeywords.push(`${content.chapter} tutorial`);
      }
      
      const chapterNumber = content.chapter_number || (content.metadata as { chapter_number?: number } | null)?.chapter_number;
      if (chapterNumber) {
        searchTerms.push(`Chapter ${chapterNumber}`);
      }
      
      // Add subject with educational terms
      const subjectName = selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1);
      searchTerms.push(subjectName);
      educationalKeywords.push(`${subjectName} tutorial`);
      educationalKeywords.push(`${subjectName} basics`);
      
      // Add class/grade if available - enhanced for Indian education system
      const classGrade = content.class_grade || (content.metadata as { class_grade?: number } | null)?.class_grade || 12; // Default to Class 12
      searchTerms.push(`Class ${classGrade}`);
      searchTerms.push(`Grade ${classGrade}`);
      educationalKeywords.push(`Class ${classGrade} ${subjectName}`);
      educationalKeywords.push(`CBSE Class ${classGrade} ${subjectName}`);
      educationalKeywords.push(`NCERT Class ${classGrade} ${subjectName}`);
      
      // Add board-specific terms for Indian education
      educationalKeywords.push(`CBSE ${subjectName}`);
      educationalKeywords.push(`NCERT ${subjectName}`);
      
      // Extract keywords from analysis
      if (analysis && analysis.includes("Keywords:")) {
        const keywordSection = analysis.split("Keywords:")[1]?.split(".")[0];
        if (keywordSection) {
          const extractedKeywords = keywordSection.split(",").map(k => k.trim()).filter(k => k.length > 2);
          searchTerms.push(...extractedKeywords.slice(0, 3));
        }
      }
      
      // Create multiple precise search queries for better results
      const searchQueries = [
        // Most specific: Class + Subject + Topic + Tutorial
        `Class ${classGrade} ${subjectName} ${content.title || content.chapter} tutorial`,
        // CBSE/NCERT specific
        `CBSE Class ${classGrade} ${subjectName} ${content.title || content.chapter} explained`,
        // Educational channels focus
        `${content.title || content.chapter} ${subjectName} Khan Academy Vedantu Unacademy`,
        // General educational search
        `${content.title || content.chapter} ${subjectName} tutorial explanation`,
        // Chapter specific if available
        chapterNumber ? `Class ${classGrade} ${subjectName} Chapter ${chapterNumber} ${content.chapter || content.title}` : null
      ].filter(Boolean); // Remove null entries
      
      // Try each search query until we get good results
      let allVideos: any[] = [];
      let lastError: any = null;
      
      for (const query of searchQueries) {
        if (allVideos.length >= 12) break; // Stop if we have enough videos
        
        try {
          console.log(`Searching YouTube with query: "${query}"`);
          const videos = await api.videos.searchYouTube({
            query: query.trim(),
            max_results: 6,
          });
          
          if (videos && videos.length > 0) {
            console.log(`Found ${videos.length} videos for query: "${query}"`);
            // Filter out duplicates and add to collection
            const newVideos = videos.filter(video => 
              video.youtube_id && !allVideos.some(existing => existing.youtube_id === video.youtube_id)
            );
            allVideos.push(...newVideos);
          }
        } catch (queryError) {
          console.debug(`Search query failed: ${query}`, queryError);
          lastError = queryError;
          continue; // Try next query
        }
      }
      
      // If no videos found but no critical errors, provide fallback suggestions
      if (allVideos.length === 0 && lastError) {
        // Generate fallback video suggestions based on content
        const fallbackVideos = generateFallbackVideoSuggestions(content, selectedSubject);
        setRelatedVideos(fallbackVideos);
        setYoutubeQuotaExceeded(false);
      } else {
        // Reset quota exceeded flag on successful fetch
        if (allVideos.length > 0) {
          setYoutubeQuotaExceeded(false);
        }
        
        // Sort videos by relevance (prefer educational content)
        const sortedVideos = allVideos.sort((a, b) => {
          const aScore = getVideoRelevanceScore(a, content, selectedSubject);
          const bScore = getVideoRelevanceScore(b, content, selectedSubject);
          return bScore - aScore;
        });
        
        setRelatedVideos(sortedVideos.slice(0, 12)); // Limit to 12 best videos
      }
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
      
      // Check for API key errors or backend configuration issues
      const isApiKeyError = errorMessage.includes("API key expired") || 
                           errorMessage.includes("YOUTUBE_API_KEY") ||
                           errorMessage.includes("API key has expired") ||
                           errorCode === "YOUTUBE_API_KEY_ERROR" ||
                           errorCode === "YOUTUBE_SEARCH_ERROR";
      
      if (isQuotaError) {
        // Set quota exceeded flag for UI display
        setYoutubeQuotaExceeded(true);
        console.warn("YouTube API quota exceeded. Videos feature temporarily unavailable.");
        setRelatedVideos([]);
      } else if (isApiKeyError) {
        // Provide fallback suggestions when API is unavailable
        console.debug("YouTube API unavailable. Providing fallback suggestions.");
        const fallbackVideos = generateFallbackVideoSuggestions(content, selectedSubject);
        setRelatedVideos(fallbackVideos);
        setYoutubeQuotaExceeded(false);
      } else {
        // Log other errors for debugging
        console.warn("Error fetching related videos:", errorMessage);
        const fallbackVideos = generateFallbackVideoSuggestions(content, selectedSubject);
        setRelatedVideos(fallbackVideos);
        setYoutubeQuotaExceeded(false);
      }
    } finally {
      setLoadingRelatedVideos(false);
    }
  };

  // Generate fallback video suggestions when YouTube API is unavailable
  const generateFallbackVideoSuggestions = (content: any, subject: string): any[] => {
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const contentTitle = content.title || content.chapter || "Educational Content";
    const classGrade = content.class_grade || (content.metadata as { class_grade?: number } | null)?.class_grade || 12;
    
    // Create search suggestions that users can manually search for
    const suggestions = [
      {
        id: 'suggestion-1',
        title: `Class ${classGrade} ${subjectName} - ${contentTitle}`,
        description: `Search for "Class ${classGrade} ${subjectName} ${contentTitle}" for grade-specific content`,
        channel_name: "Search Suggestion",
        thumbnail_url: null,
        youtube_id: null,
        search_query: `Class ${classGrade} ${subjectName} ${contentTitle} tutorial`,
        is_suggestion: true
      },
      {
        id: 'suggestion-2',
        title: `CBSE ${contentTitle} - Explained`,
        description: `Search for "CBSE Class ${classGrade} ${contentTitle}" for board-specific lessons`,
        channel_name: "Search Suggestion",
        thumbnail_url: null,
        youtube_id: null,
        search_query: `CBSE Class ${classGrade} ${subjectName} ${contentTitle} explained`,
        is_suggestion: true
      },
      {
        id: 'suggestion-3',
        title: `${contentTitle} - Khan Academy/Vedantu`,
        description: `Search for "${contentTitle} Khan Academy Vedantu" for trusted educational channels`,
        channel_name: "Search Suggestion",
        thumbnail_url: null,
        youtube_id: null,
        search_query: `${contentTitle} ${subjectName} Khan Academy Vedantu Unacademy`,
        is_suggestion: true
      },
      {
        id: 'suggestion-4',
        title: `NCERT ${contentTitle} - Solutions`,
        description: `Search for "NCERT Class ${classGrade} ${contentTitle}" for textbook-aligned content`,
        channel_name: "Search Suggestion",
        thumbnail_url: null,
        youtube_id: null,
        search_query: `NCERT Class ${classGrade} ${subjectName} ${contentTitle} solutions`,
        is_suggestion: true
      }
    ];

    // Add subject-specific suggestions
    if (subject === 'mathematics') {
      suggestions.push({
        id: 'suggestion-math',
        title: `${contentTitle} - Problem Solving`,
        description: `Search for "Class ${classGrade} ${contentTitle} problems" for practice questions`,
        channel_name: "Search Suggestion",
        thumbnail_url: null,
        youtube_id: null,
        search_query: `Class ${classGrade} mathematics ${contentTitle} problems solutions`,
        is_suggestion: true
      });
    } else if (subject === 'physics') {
      suggestions.push({
        id: 'suggestion-physics',
        title: `${contentTitle} - Physics Experiments`,
        description: `Search for "Class ${classGrade} ${contentTitle} experiments" for practical demonstrations`,
        channel_name: "Search Suggestion",
        thumbnail_url: null,
        youtube_id: null,
        search_query: `Class ${classGrade} physics ${contentTitle} experiments demonstration`,
        is_suggestion: true
      });
    } else if (subject === 'chemistry') {
      suggestions.push({
        id: 'suggestion-chemistry',
        title: `${contentTitle} - Chemical Reactions`,
        description: `Search for "Class ${classGrade} ${contentTitle} reactions" for chemical processes`,
        channel_name: "Search Suggestion",
        thumbnail_url: null,
        youtube_id: null,
        search_query: `Class ${classGrade} chemistry ${contentTitle} reactions mechanisms`,
        is_suggestion: true
      });
    } else if (subject === 'biology') {
      suggestions.push({
        id: 'suggestion-biology',
        title: `${contentTitle} - Biological Processes`,
        description: `Search for "Class ${classGrade} ${contentTitle} biology" for life science concepts`,
        channel_name: "Search Suggestion",
        thumbnail_url: null,
        youtube_id: null,
        search_query: `Class ${classGrade} biology ${contentTitle} processes diagrams`,
        is_suggestion: true
      });
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  };

  // Calculate relevance score for video sorting
  const getVideoRelevanceScore = (video: any, content: any, subject: string): number => {
    let score = 0;
    const title = video.title?.toLowerCase() || "";
    const description = video.description?.toLowerCase() || "";
    const channelName = video.channel_name?.toLowerCase() || "";
    
    // Educational keywords boost
    const educationalTerms = ["tutorial", "explained", "lesson", "learn", "education", "study", "guide", "how to"];
    educationalTerms.forEach(term => {
      if (title.includes(term)) score += 3;
      if (description.includes(term)) score += 1;
    });
    
    // Subject relevance
    if (title.includes(subject.toLowerCase())) score += 5;
    if (description.includes(subject.toLowerCase())) score += 2;
    
    // Content title relevance
    if (content.title) {
      const contentWords = content.title.toLowerCase().split(/\s+/);
      contentWords.forEach(word => {
        if (word.length > 3) {
          if (title.includes(word)) score += 2;
          if (description.includes(word)) score += 1;
        }
      });
    }
    
    // Trusted educational channels boost
    const trustedChannels = ["khan academy", "crash course", "ted-ed", "professor", "academy", "education"];
    trustedChannels.forEach(channel => {
      if (channelName.includes(channel)) score += 4;
    });
    
    // Duration preference (5-20 minutes is ideal)
    if (video.duration_seconds) {
      const minutes = video.duration_seconds / 60;
      if (minutes >= 5 && minutes <= 20) score += 2;
      else if (minutes >= 3 && minutes <= 30) score += 1;
    }
    
    return score;
  };

  const fetchRelatedVideos = async (content: any) => {
    // Fetch single featured video for direct display
    console.log('Fetching featured video for content:', content.title || content.chapter);
    await fetchFeaturedVideo(content);
    
    // Also fetch list for backup (optional)
    const topicAnalysis = analyzeContentForVideoSearch(content);
    await searchYouTubeFromAnalysis(content, topicAnalysis);
  };

  // Generate automatic notes for a video
  const generateVideoNotes = async (video: any) => {
    setGeneratingVideoNotes(true);
    try {
      const content = selectedContent || ncertContent;
      const prompt = `Generate comprehensive study notes for this educational video:

Video Title: ${video.title}
Channel: ${video.channel_name}
Subject: ${selectedSubject}
Topic: ${content?.title || content?.chapter || 'Educational Content'}
Class: ${content?.class_grade || 12}

Please provide:
1. Key concepts covered in the video
2. Important formulas or definitions (if applicable)
3. Main learning objectives
4. Summary of key points
5. Practice questions or examples mentioned
6. Additional study tips related to this topic

Format the notes in a clear, structured manner suitable for student revision.`;

      const response = await api.rag.query({
        query: prompt,
        subject: selectedSubject as any,
        top_k: 3,
      });

      const notes = response.generated_text || response.answer || `# Video Notes: ${video.title}

## Key Concepts
- Main topic: ${content?.title || content?.chapter}
- Subject: ${selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}
- Class: ${content?.class_grade || 12}

## Summary
This video covers important concepts related to ${content?.title || content?.chapter} in ${selectedSubject}. 

## Learning Objectives
- Understand the fundamental concepts
- Apply knowledge to solve problems
- Connect theory with practical applications

## Study Tips
- Take notes while watching
- Pause and practice examples
- Review key formulas and definitions
- Connect with textbook content

*Note: These are AI-generated notes. Please watch the video for complete understanding.*`;

      setVideoNotes(notes);
    } catch (error: any) {
      console.error('Error generating video notes:', error);
      // Provide fallback notes
      const content = selectedContent || ncertContent;
      const fallbackNotes = `# Video Notes: ${video.title}

## Video Information
- **Title**: ${video.title}
- **Channel**: ${video.channel_name}
- **Subject**: ${selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}
- **Topic**: ${content?.title || content?.chapter || 'Educational Content'}

## Study Guide
This video is related to your current study topic. While watching:

1. **Take Active Notes**: Write down key concepts and formulas
2. **Pause and Practice**: Try examples shown in the video
3. **Ask Questions**: Note any doubts for later clarification
4. **Connect to Textbook**: Relate video content to your study material

## Key Areas to Focus On
- Main concepts and definitions
- Problem-solving techniques
- Practical applications
- Common mistakes to avoid

*These are basic notes. The video content will provide detailed explanations.*`;
      
      setVideoNotes(fallbackNotes);
    } finally {
      setGeneratingVideoNotes(false);
    }
  };

  // Handle video selection and open dialog
  const handleVideoSelect = async (video: any) => {
    setSelectedVideo(video);
    setVideoNotes("");
    setShowVideoDialog(true);
    
    // Remember video selection interaction
    rememberInteraction('select_video', 'video_player', {
      video_id: video.youtube_id,
      video_title: video.title,
      channel: video.channel_name,
      duration: video.duration_seconds,
      subject: selectedSubject,
      topic: (selectedContent || ncertContent)?.title || (selectedContent || ncertContent)?.chapter
    });
    
    // Generate notes automatically
    await generateVideoNotes(video);
  };

  // Memory Intelligence System Functions
  const saveToMemory = async (content: any, type: 'quiz' | 'video_notes' | 'ai_response' | 'content' | 'explanation') => {
    if (!user) return;
    
    setSavingToMemory(true);
    try {
      const currentContent = selectedContent || ncertContent;
      const memoryType = type === 'quiz' ? 'learning' : 
                        type === 'video_notes' ? 'learning' :
                        type === 'ai_response' ? 'learning' :
                        type === 'content' ? 'learning' : 'general';

      // Calculate importance based on type and context
      const importance = type === 'quiz' ? 0.9 :
                        type === 'video_notes' ? 0.8 :
                        type === 'ai_response' ? 0.7 :
                        type === 'content' ? 0.6 : 0.5;

      // Generate contextual tags
      const tags = [
        type,
        selectedSubject,
        sessionStarted ? 'active_session' : 'standalone',
        ...(currentContent?.chapter ? [currentContent.chapter] : []),

      ];

      let response;
      try {
        // Try Memory Intelligence API first
        response = await api.memory.remember(user.id, {
          type: memoryType,
          content: {
            original_content: content,
            title: generateMemoryTitle(content, type),
            type: type,
            session_context: {
              session_time: sessionTime,
              completion_percentage: completionPercentage,
              interactions_count: interactionsCount,
              pages_viewed: pagesViewed
            }
          },
          subject: selectedSubject,
          topic: currentContent?.title || currentContent?.chapter || 'General Study',
          importance: importance,
          tags: tags,
          source: 'classroom_component',
          session_id: sessionStarted ? `session_${sessionStartTime?.getTime()}` : undefined,
          page_url: window.location.pathname,
          component: 'classroom'
        });
      } catch (apiError) {
        console.debug('Memory Intelligence API not available, using local storage:', apiError);
        // Fallback is already handled in the API layer
        response = {
          memory_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          stored_at: new Date().toISOString(),
          success: true
        };
      }

      // If it's a quiz, also save to the quizzes table
      if (type === 'quiz' && user && content.questions) {
        try {
          const quizData = {
            title: generateMemoryTitle(content, type),
            subject: selectedSubject,
            description: `Generated quiz for ${currentContent?.title || currentContent?.chapter || 'study session'}`,
            quiz_data: {
              questions: content.questions,
              title: content.title,
              generated_at: new Date().toISOString(),
              session_context: {
                session_time: sessionTime,
                completion_percentage: completionPercentage,
                content_id: currentContent?.id
              }
            },
            duration_minutes: Math.max(content.questions.length * 2, 10), // 2 minutes per question, minimum 10
            total_marks: content.questions.length * 4, // 4 marks per question
            class_grade: currentContent?.class_grade || 12,
            metadata: {
              generated_by: 'ai_classroom',
              source_content: currentContent?.title || currentContent?.chapter,
              memory_id: response.memory_id,
              tags: tags
            }
          };

          const quizResponse = await api.quizzes.create(quizData);
          
          // Create notification for quiz save
          if (user) {
            api.notifications.create(user.id, {
              type: 'success',
              title: '📝 Quiz Saved Successfully!',
              message: `Your ${selectedSubject} quiz has been saved and can be accessed anytime.`,
              action: {
                label: 'View Saved Quizzes',
                url: '/dashboard/teacher/quizzes'
              },
              auto_dismiss: false,
              importance: 0.8
            }).catch(console.debug);
          }
        } catch (quizSaveError) {
          console.warn('Failed to save quiz to database:', quizSaveError);
          // Still continue with memory save
        }
      }

      // Update local state for immediate UI feedback
      const memoryItem = {
        id: response.memory_id,
        memory_id: response.memory_id,
        type: type,
        title: generateMemoryTitle(content, type),
        content: content,
        subject: selectedSubject,
        topic: currentContent?.title || currentContent?.chapter || 'General',
        created_at: response.stored_at,
        tags: tags,
        importance: importance
      };
      
      setSavedItems(prev => [memoryItem, ...prev]);

      // Create save to memory notification
      if (user) {
        api.notifications.create(user.id, {
          type: 'success',
          title: '💾 Saved to Memory!',
          message: `${getTypeDisplayName(type)} has been intelligently stored and will help personalize your learning experience.`,
          action: {
            label: 'View Memory',
            url: window.location.pathname + '#memory'
          },
          auto_dismiss: true,
          dismiss_after: 4000,
          importance: 0.6
        }).catch(console.debug);
      }

      toast({
        title: "Saved to Memory!",
        description: `${getTypeDisplayName(type)} has been saved for future reference.`,
      });

    } catch (error) {
      console.error('Error saving to memory:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Unable to save to memory. Please try again.",
      });
    } finally {
      setSavingToMemory(false);
    }
  };

  const generateMemoryTitle = (content: any, type: string): string => {
    const topicName = (selectedContent || ncertContent)?.title || (selectedContent || ncertContent)?.chapter || 'Study Material';
    const subject = selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1);
    
    switch (type) {
      case 'quiz':
        return `Quiz: ${topicName} (${content.questions?.length || 0} questions)`;
      case 'video_notes':
        return `Video Notes: ${content.title || topicName}`;
      case 'ai_response':
        return `AI Explanation: ${topicName}`;
      case 'content':
        return `Study Content: ${topicName}`;
      case 'explanation':
        return `Explanation: ${topicName}`;
      default:
        return `${subject}: ${topicName}`;
    }
  };

  const getTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'quiz': return 'Quiz';
      case 'video_notes': return 'Video Notes';
      case 'ai_response': return 'AI Response';
      case 'content': return 'Study Content';
      case 'explanation': return 'Explanation';
      default: return 'Content';
    }
  };

  const loadSavedMemory = async () => {
    if (!user) return;

    try {
      // Load from Memory Intelligence API
      const response = await api.memory.recall(user.id, {
        limit: 50,
        days_back: 90, // Load last 3 months
        min_importance: 0.3 // Only load moderately important items
      });

      if (response.success && response.contexts) {
        // Transform Memory Intelligence format to our UI format
        const transformedItems = response.contexts.map((context: any) => ({
          id: context.memory_id,
          memory_id: context.memory_id,
          type: context.content?.type || 'general',
          title: context.content?.title || `${context.context_type}: ${context.subject || 'General'}`,
          content: context.content?.original_content || context.content,
          subject: context.subject || 'general',
          topic: context.topic || 'General',
          created_at: context.timestamp,
          tags: context.tags || [],
          importance: context.importance_score,
          access_count: context.access_count,
          metadata: context.metadata
        }));
        
        setSavedItems(transformedItems);
      }
    } catch (error) {
      console.error('Error loading memory intelligence:', error);
      // The API already has fallback to localStorage built-in
      setSavedItems([]);
    }
  };

  const loadSavedQuizzes = async () => {
    if (!user) return;

    try {
      // Load user's saved quizzes
      const response = await api.quizzes.list({
        limit: 20,
        subject: selectedSubject
      });

      if (response.quizzes) {
        setSavedQuizzes(response.quizzes);
      }
    } catch (error) {
      console.error('Error loading saved quizzes:', error);
      setSavedQuizzes([]);
    }
  };

  const deleteFromMemory = async (itemId: string) => {
    if (!user) return;

    try {
      // Note: Memory Intelligence API doesn't have delete endpoint in the documentation
      // So we'll remove from local state and localStorage fallback
      
      // Remove from local storage fallback
      const memoryKey = `memory_intelligence_${user.id}`;
      const localMemory = JSON.parse(localStorage.getItem(memoryKey) || '[]');
      const updatedMemory = localMemory.filter((item: any) => item.memory_id !== itemId);
      localStorage.setItem(memoryKey, JSON.stringify(updatedMemory));

      // Update local state
      setSavedItems(prev => prev.filter(item => item.memory_id !== itemId));

      toast({
        title: "Removed from Memory",
        description: "Item has been removed from your local memory.",
      });
    } catch (error) {
      console.error('Error deleting from memory:', error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Unable to delete item. Please try again.",
      });
    }
  };

  // Smart Suggestions Functions
  const getSmartSuggestions = async (suggestionType: 'next_action' | 'content_recommendation' | 'study_schedule' | 'review_suggestion' | 'learning_path') => {
    if (!user) return null;

    try {
      const currentContext = {
        page: 'classroom',
        subject: selectedSubject,
        topic: (selectedContent || ncertContent)?.title || (selectedContent || ncertContent)?.chapter,
        session_active: sessionStarted,
        session_time: sessionTime,
        completion_percentage: completionPercentage
      };

      const response = await api.memory.smartSuggestions(user.id, suggestionType, currentContext);
      return response;
    } catch (error) {
      console.debug('Memory Intelligence API not available, using fallback suggestions:', error);
      
      // Provide fallback suggestions based on current context
      return generateFallbackSuggestions(suggestionType);
    }
  };

  // Generate fallback suggestions when API is not available
  const generateFallbackSuggestions = (suggestionType: string) => {
    const currentContent = selectedContent || ncertContent;
    const subjectName = selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1);
    const topicName = currentContent?.title || currentContent?.chapter || 'current topic';

    switch (suggestionType) {
      case 'next_action':
        if (!sessionStarted) {
          return {
            success: true,
            suggestions: [{
              type: 'session_start',
              action: 'Start a study session',
              reason: 'Begin tracking your learning progress',
              confidence: 0.9
            }]
          };
        } else if (completionPercentage < 50) {
          return {
            success: true,
            suggestions: [{
              type: 'continue_studying',
              action: `Continue studying ${topicName}`,
              reason: 'You\'re making good progress, keep going!',
              confidence: 0.8
            }]
          };
        } else {
          return {
            success: true,
            suggestions: [{
              type: 'take_quiz',
              action: 'Take a quiz to test your knowledge',
              reason: 'You\'ve studied enough to test your understanding',
              confidence: 0.85
            }]
          };
        }

      case 'content_recommendation':
        return {
          success: true,
          suggestions: [
            {
              type: 'video_content',
              title: `Watch videos about ${topicName}`,
              reason: 'Visual learning can reinforce concepts',
              confidence: 0.7
            },
            {
              type: 'practice_problems',
              title: `Practice problems for ${subjectName}`,
              reason: 'Practice makes perfect',
              confidence: 0.75
            }
          ]
        };

      case 'review_suggestion':
        return {
          success: true,
          suggestions: [{
            type: 'review_notes',
            action: `Review your notes on ${topicName}`,
            reason: 'Reviewing helps consolidate learning',
            confidence: 0.7
          }]
        };

      default:
        return {
          success: true,
          suggestions: [{
            type: 'general',
            action: 'Keep learning!',
            reason: 'Consistent study leads to success',
            confidence: 0.6
          }]
        };
    }
  };

  // Remember user interactions automatically
  const rememberInteraction = async (action: string, component: string, result?: any) => {
    if (!user) return;

    try {
      await api.memory.remember(user.id, {
        type: 'interaction',
        content: {
          action: action,
          component: component,
          result: result,
          timestamp: new Date().toISOString(),
          page: 'classroom',
          session_active: sessionStarted
        },
        subject: selectedSubject,
        topic: (selectedContent || ncertContent)?.title || (selectedContent || ncertContent)?.chapter,
        importance: 0.4,
        tags: ['interaction', action, component],
        source: 'classroom_interaction_tracker',
        page_url: window.location.pathname,
        component: component
      });
    } catch (error) {
      // Silently fail for interaction tracking - API fallback handles storage
      console.debug('Interaction tracking failed, using fallback storage:', error);
    }
  };

  // Analyze content to extract better search terms for YouTube
  const analyzeContentForVideoSearch = (content: any): string => {
    const searchTerms: string[] = [];
    
    // Extract from title
    if (content.title) {
      const titleWords = content.title.split(/\s+/).filter(word => 
        word.length > 3 && !['the', 'and', 'for', 'with', 'from'].includes(word.toLowerCase())
      );
      searchTerms.push(...titleWords.slice(0, 3));
    }
    
    // Extract from chapter information
    if (content.chapter) {
      searchTerms.push(content.chapter);
    }
    
    // Add subject-specific terms
    const subjectTerms = {
      mathematics: ['math', 'algebra', 'calculus', 'geometry', 'trigonometry', 'equations'],
      physics: ['physics', 'mechanics', 'thermodynamics', 'optics', 'electricity', 'magnetism'],
      chemistry: ['chemistry', 'organic', 'inorganic', 'reactions', 'molecules', 'atoms'],
      biology: ['biology', 'cell', 'genetics', 'evolution', 'anatomy', 'physiology']
    };
    
    const relevantTerms = subjectTerms[selectedSubject as keyof typeof subjectTerms] || [];
    
    // Extract key concepts from content text if available
    if (content.content_text) {
      const text = content.content_text.toLowerCase();
      relevantTerms.forEach(term => {
        if (text.includes(term)) {
          searchTerms.push(term);
        }
      });
    }
    
    return `Keywords: ${searchTerms.join(', ')}. Topic: ${content.title || 'Educational content'}. Subject: ${selectedSubject}`;
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
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setForceShowNotes(true);
                          // Also try to trigger the floating note maker
                          const noteMakerButton = document.querySelector('[title="Open Notes Maker"]') as HTMLButtonElement;
                          if (noteMakerButton) {
                            noteMakerButton.click();
                          }
                        }}
                        className="border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all bg-gradient-to-r from-primary/5 to-primary/10"
                      >
                        <StickyNote className="h-4 w-4 mr-2" />
                        Take Notes
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const content = selectedContent || ncertContent;
                          if (content) {
                            const contentData = {
                              title: content.title,
                              chapter: content.chapter,
                              content_text: content.content_text,
                              metadata: content.metadata
                            };
                            saveToMemory(contentData, 'content');
                          }
                        }}
                        disabled={savingToMemory || !selectedContent && !ncertContent}
                        className="border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
                      >
                        {savingToMemory ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Content
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExitDialog(true)}
                        className="border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40 transition-all"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Exit Classroom
                      </Button>
                    </div>
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
                          const content = allContent.find(c => c.id === value);
                          if (content) {
                            handleContentSelect(content);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-64 border-2">
                          <SelectValue placeholder="Select content..." />
                        </SelectTrigger>
                        <SelectContent>
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
                          <span className="text-foreground">Interactive learning experience</span>
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
                              ref={pdfContainerRef}
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
                        <div className="flex items-center justify-between mb-2">
                          <Tabs value={rightPanelTab} onValueChange={(value) => {
                            const newTab = value as "videos" | "tutor" | "memory";
                            setRightPanelTab(newTab);
                            // Remember tab change interaction
                            rememberInteraction('change_tab', 'right_panel_tabs', {
                              from_tab: rightPanelTab,
                              to_tab: newTab,
                              subject: selectedSubject,
                              session_active: sessionStarted
                            });
                          }} className="flex-1">
                            <TabsList className="grid w-full grid-cols-5">
                              <TabsTrigger value="tutor" className="flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                AI Tutor
                              </TabsTrigger>
                              <TabsTrigger value="videos" className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                Videos
                              </TabsTrigger>
                              <TabsTrigger value="mcq" className="flex items-center gap-2">
                                <FileQuestion className="h-4 w-4" />
                                MCQ Quiz
                              </TabsTrigger>
                              <TabsTrigger value="draw" className="flex items-center gap-2">
                                <StickyNote className="h-4 w-4" />
                                Draw & Sketch
                              </TabsTrigger>
                              <TabsTrigger value="memory" className="flex items-center gap-2">
                                <Archive className="h-4 w-4" />
                                Memory
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                          {rightPanelTab === "videos" && (selectedContent || ncertContent) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const content = selectedContent || ncertContent;
                                if (content) {
                                  fetchFeaturedVideo(content);
                                }
                              }}
                              disabled={loadingFeaturedVideo}
                              className="ml-2 h-8 w-8 p-0"
                              title="Find new video"
                            >
                              {loadingFeaturedVideo ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Video className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0 bg-gradient-to-b from-background to-muted/10">
                        {rightPanelTab === "tutor" ? (
                          <div className="flex-1 overflow-hidden">
                            <EnhancedAITutorPage />
                          </div>
                        ) : rightPanelTab === "videos" ? (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            {loadingFeaturedVideo ? (
                              <div className="flex items-center justify-center h-full py-12">
                                <div className="text-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground font-medium">Finding best video...</p>
                                </div>
                              </div>
                            ) : featuredVideo ? (
                              <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                                {/* Video Player */}
                                <div className="flex-1 bg-black rounded-lg overflow-hidden min-h-0 relative">
                                  {videoLoading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                      <div className="text-center text-white">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                        <p className="text-sm">Loading video...</p>
                                      </div>
                                    </div>
                                  )}
                                  <iframe
                                    src={`https://www.youtube.com/embed/${featuredVideo.youtube_id}?autoplay=0&rel=0&modestbranding=1&fs=1&controls=1&cc_load_policy=1`}
                                    className="w-full h-full border-0"
                                    title={featuredVideo.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                    allowFullScreen
                                    loading="lazy"
                                    onLoad={() => setVideoLoading(false)}
                                    onLoadStart={() => setVideoLoading(true)}
                                  />
                                  {/* Video overlay for better UX */}
                                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    Educational Video
                                  </div>
                                </div>
                                
                                {/* Video Info */}
                                <Card className="shrink-0">
                                  <CardContent className="p-4">
                                    <div className="space-y-2">
                                      <h3 className="text-sm font-semibold line-clamp-2 text-foreground">
                                        {featuredVideo.title}
                                      </h3>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="secondary" className="text-xs">
                                          {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}
                                        </Badge>
                                        {featuredVideo.duration_seconds && (
                                          <Badge variant="outline" className="text-xs">
                                            {Math.floor(featuredVideo.duration_seconds / 60)}:{(featuredVideo.duration_seconds % 60).toString().padStart(2, "0")}
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          {featuredVideo.channel_name}
                                        </Badge>
                                      </div>
                                      {featuredVideo.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {featuredVideo.description}
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2 shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      window.open(`https://www.youtube.com/watch?v=${featuredVideo.youtube_id}`, "_blank");
                                    }}
                                    className="flex-1"
                                  >
                                    <Video className="h-4 w-4 mr-2" />
                                    Open in YouTube
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVideoSelect(featuredVideo)}
                                    className="flex-1"
                                  >
                                    <StickyNote className="h-4 w-4 mr-2" />
                                    View with Notes
                                  </Button>
                                </div>
                              </div>
                            ) : !youtubeQuotaExceeded ? (
                              <div className="flex items-center justify-center h-full py-12">
                                <div className="text-center p-6 max-w-md">
                                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Video className="h-8 w-8 text-muted-foreground opacity-50" />
                                  </div>
                                  <p className="text-sm font-medium text-foreground mb-1">No video found</p>
                                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                                    Unable to find a relevant video for this topic.
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const content = selectedContent || ncertContent;
                                      if (content) {
                                        fetchFeaturedVideo(content);
                                      }
                                    }}
                                    className="mt-2 mr-2"
                                  >
                                    Try Again
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const content = selectedContent || ncertContent;
                                      if (content) {
                                        const searchQuery = `Class 12 ${selectedSubject} ${content.title || content.chapter} tutorial`;
                                        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
                                        window.open(searchUrl, "_blank");
                                      }
                                    }}
                                    className="mt-2"
                                  >
                                    Search YouTube
                                  </Button>
                                </div>
                              </div>
                            ) : youtubeQuotaExceeded ? (
                              <div className="flex items-center justify-center h-full py-12">
                                <div className="text-center p-6 max-w-md">
                                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Video className="h-8 w-8 text-muted-foreground opacity-50" />
                                  </div>
                                  <p className="text-sm font-medium text-foreground mb-1">YouTube API Quota Exceeded</p>
                                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                                    The YouTube API quota has been exceeded for today. Videos will be available again after the quota resets.
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const content = selectedContent || ncertContent;
                                      if (content) {
                                        const searchQuery = `Class 12 ${selectedSubject} ${content.title || content.chapter} tutorial`;
                                        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
                                        window.open(searchUrl, "_blank");
                                      }
                                    }}
                                    className="mt-2"
                                  >
                                    Search YouTube Manually
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : rightPanelTab === "mcq" ? (
                          <div className="flex-1 flex flex-col overflow-hidden p-4">
                            <ClassroomMCQ
                              subject={selectedSubject}
                              chapter={(selectedContent || ncertContent)?.chapter || (selectedContent || ncertContent)?.title || 'Current Topic'}
                              contentTitle={(selectedContent || ncertContent)?.title || (selectedContent || ncertContent)?.chapter}
                              contentText={(selectedContent || ncertContent)?.content_text}
                            />
                          </div>
                        ) : rightPanelTab === "draw" ? (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4">
                              <ClassroomDrawing
                                subject={selectedSubject}
                                contentTitle={(selectedContent || ncertContent)?.title || (selectedContent || ncertContent)?.chapter}
                                onAnalysisComplete={(analysis) => {
                                  // Save analysis to memory
                                  if (user) {
                                    const analysisData = {
                                      analysis: analysis,
                                      subject: selectedSubject,
                                      content_title: (selectedContent || ncertContent)?.title || (selectedContent || ncertContent)?.chapter,
                                      sketch_type: 'classroom_drawing'
                                    };
                                    saveToMemory(analysisData, 'ai_response');
                                  }
                                }}
                              />
                            </div>
                          </div>
                        ) : rightPanelTab === "memory" ? (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-4 border-b">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Memory Intelligence</h3>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {savedItems.length} memories
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {savedQuizzes.length} quizzes
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                AI-powered memory with smart suggestions and saved quizzes
                              </p>
                              
                              {/* Smart Suggestions Section */}
                              <div className="mt-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Bot className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-semibold text-primary">Smart Suggestions</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const suggestions = await getSmartSuggestions('next_action');
                                      if (suggestions?.suggestions?.[0]) {
                                        toast({
                                          title: "💡 Smart Suggestion",
                                          description: suggestions.suggestions[0].action || suggestions.suggestions[0].reason,
                                        });
                                      } else {
                                        toast({
                                          title: "Keep Learning!",
                                          description: "Continue with your current study session.",
                                        });
                                      }
                                    }}
                                    className="text-xs h-7"
                                  >
                                    Next Action
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const suggestions = await getSmartSuggestions('content_recommendation');
                                      if (suggestions?.suggestions?.[0]) {
                                        toast({
                                          title: "📚 Content Recommendation",
                                          description: suggestions.suggestions[0].title || suggestions.suggestions[0].reason,
                                        });
                                      } else {
                                        toast({
                                          title: "Explore More",
                                          description: "Try watching related videos or taking a quiz.",
                                        });
                                      }
                                    }}
                                    className="text-xs h-7"
                                  >
                                    Recommendations
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const suggestions = await getSmartSuggestions('review_suggestion');
                                      if (suggestions?.suggestions?.[0]) {
                                        toast({
                                          title: "🔄 Review Suggestion",
                                          description: suggestions.suggestions[0].action || suggestions.suggestions[0].reason,
                                        });
                                      } else {
                                        toast({
                                          title: "Review Time",
                                          description: "Review your notes and saved content to reinforce learning.",
                                        });
                                      }
                                    }}
                                    className="text-xs h-7"
                                  >
                                    Review
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <ScrollArea className="flex-1">
                              <div className="p-4 space-y-4">
                                {/* Saved Quizzes Section */}
                                {savedQuizzes.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="p-1.5 rounded-md bg-primary/10">
                                        <FileText className="h-4 w-4 text-primary" />
                                      </div>
                                      <h4 className="text-sm font-semibold text-foreground">Saved Quizzes</h4>
                                      <Badge variant="secondary" className="text-xs">
                                        {savedQuizzes.length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {savedQuizzes.map((quiz, index) => (
                                        <Card key={quiz.id || index} className="p-3 hover:bg-accent/50 transition-colors">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="text-xs">
                                                  Quiz
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                  {quiz.subject}
                                                </Badge>
                                                {quiz.total_marks && (
                                                  <Badge variant="outline" className="text-xs">
                                                    {quiz.total_marks} marks
                                                  </Badge>
                                                )}
                                              </div>
                                              <h4 className="text-sm font-semibold line-clamp-2 mb-1">
                                                {quiz.title}
                                              </h4>
                                              <p className="text-xs text-muted-foreground mb-2">
                                                {quiz.description || 'Generated quiz'} • {new Date(quiz.created_at).toLocaleDateString()}
                                              </p>
                                              <div className="flex gap-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    // Old quiz functionality removed - use MCQ tab instead
                                                    toast({
                                                      title: "Use MCQ Tab",
                                                      description: "Please use the MCQ Quiz tab to take quizzes.",
                                                    });
                                                  }}
                                                  className="text-xs h-7"
                                                >
                                                  Take Quiz
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={async () => {
                                                    try {
                                                      await api.quizzes.delete(quiz.id);
                                                      setSavedQuizzes(prev => prev.filter(q => q.id !== quiz.id));
                                                      toast({
                                                        title: "Quiz Deleted",
                                                        description: "Quiz has been removed from your saved quizzes.",
                                                      });
                                                    } catch (error) {
                                                      toast({
                                                        variant: "destructive",
                                                        title: "Delete Failed",
                                                        description: "Unable to delete quiz. Please try again.",
                                                      });
                                                    }
                                                  }}
                                                  className="text-xs h-7 text-destructive hover:text-destructive"
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Memory Items Section */}
                                {savedItems.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className="p-1.5 rounded-md bg-primary/10">
                                        <Archive className="h-4 w-4 text-primary" />
                                      </div>
                                      <h4 className="text-sm font-semibold text-foreground">Memory Items</h4>
                                      <Badge variant="secondary" className="text-xs">
                                        {savedItems.length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {savedItems.map((item, index) => (
                                        <Card key={item.id || index} className="p-3 hover:bg-accent/50 transition-colors">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="text-xs">
                                                  {getTypeDisplayName(item.type)}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                  {item.subject}
                                                </Badge>
                                              </div>
                                              <h4 className="text-sm font-semibold line-clamp-2 mb-1">
                                                {item.title}
                                              </h4>
                                              <p className="text-xs text-muted-foreground mb-2">
                                                {item.topic} • {new Date(item.created_at).toLocaleDateString()}
                                              </p>
                                              <div className="flex gap-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    // Open item in appropriate dialog/view
                                                    if (item.type === 'quiz') {
                                                      // Old quiz functionality removed - use MCQ tab instead
                                                      toast({
                                                        title: "Use MCQ Tab",
                                                        description: "Please use the MCQ Quiz tab to take quizzes.",
                                                      });
                                                    } else if (item.type === 'video_notes') {
                                                      setSelectedVideo({
                                                        title: item.content.title,
                                                        youtube_id: item.content.video_id,
                                                        channel_name: item.content.channel,
                                                        duration_seconds: item.content.duration
                                                      });
                                                      setVideoNotes(item.content.notes);
                                                      setShowVideoDialog(true);
                                                    }
                                                  }}
                                                  className="text-xs h-7"
                                                >
                                                  View
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => deleteFromMemory(item.id)}
                                                  className="text-xs h-7 text-destructive hover:text-destructive"
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Empty State */}
                                {savedItems.length === 0 && savedQuizzes.length === 0 && (
                                  <div className="text-center py-12">
                                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                      <Archive className="h-8 w-8 text-muted-foreground opacity-50" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground mb-1">No saved items</p>
                                    <p className="text-xs text-muted-foreground">
                                      Save quizzes, notes, and explanations to access them later
                                    </p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
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


      

      {/* Video Dialog with Notes */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {selectedVideo?.title || "Educational Video"}
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Watch the video and review the automatically generated notes</span>
              <Badge variant="outline" className="text-xs px-2 py-1">
                {selectedVideo?.channel_name}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
            {/* Left Side: Video Player */}
            <div className="flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                  {selectedVideo?.youtube_id ? (
                    <div className="flex-1 bg-black rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${selectedVideo.youtube_id}?autoplay=0&rel=0&modestbranding=1`}
                        className="w-full h-full border-0"
                        title={selectedVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-muted rounded-lg">
                      <div className="text-center p-8">
                        <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">Video not available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Video Info */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}
                      </Badge>
                      {selectedVideo?.duration_seconds && (
                        <Badge variant="outline" className="text-xs">
                          {Math.floor(selectedVideo.duration_seconds / 60)}:{(selectedVideo.duration_seconds % 60).toString().padStart(2, "0")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Channel: {selectedVideo?.channel_name}
                    </p>
                    {selectedVideo?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {selectedVideo.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Side: Auto-Generated Notes */}
            <div className="flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Study Notes</CardTitle>
                    {generatingVideoNotes && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating notes...
                      </div>
                    )}
                  </div>
                  <CardDescription>
                    AI-generated notes based on video content and your study topic
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full p-4">
                    {videoNotes ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {videoNotes}
                        </ReactMarkdown>
                      </div>
                    ) : generatingVideoNotes ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Generating study notes...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">No notes available</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedVideo?.youtube_id) {
                      window.open(`https://www.youtube.com/watch?v=${selectedVideo.youtube_id}`, "_blank");
                    }
                  }}
                  className="flex-1"
                >
                  Open in YouTube
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateVideoNotes(selectedVideo)}
                  disabled={generatingVideoNotes}
                  className="flex-1"
                >
                  {generatingVideoNotes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    "Regenerate Notes"
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowVideoDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (user && videoNotes && selectedVideo) {
                  const videoNotesData = {
                    title: selectedVideo.title,
                    notes: videoNotes,
                    video_id: selectedVideo.youtube_id,
                    channel: selectedVideo.channel_name,
                    duration: selectedVideo.duration_seconds
                  };
                  saveToMemory(videoNotesData, 'video_notes');
                }
              }}
              disabled={savingToMemory || !videoNotes}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
            >
              {savingToMemory ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </>
              )}
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
          forceOpen={forceShowNotes}
          onClose={() => setForceShowNotes(false)}
        />
      )}

      {/* Notification System */}
      {user && (
        <NotificationSystem userId={user.id} />
      )}

      {/* PDF Lens Tool - Available when session is started */}
      {sessionStarted && (
        <PDFLensTool
          pdfContainerRef={pdfContainerRef}
          subject={selectedSubject}
          contentTitle={(selectedContent || ncertContent)?.title || (selectedContent || ncertContent)?.chapter}
        />
      )}
    </div>
  );
};

export default Classroom;

