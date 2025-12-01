import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  User, 
  Send, 
  Loader2, 
  Plus, 
  MessageSquare, 
  Menu, 
  X, 
  Trash2,
  Edit,
  MoreVertical,
  Sparkles,
  Mic,
  Image as ImageIcon,
  Languages,
  Volume2,
  VolumeX,
  Square,
  Calculator,
  TrendingUp,
  BookMarked,
  BookOpen,
  Eye,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Source {
  id?: string;
  type?: string;
  subject?: string;
  chapter?: string;
  similarity?: number;
  title?: string;
}

interface Message {
  id: string;
  role: 'student' | 'assistant';
  content: string;
  message_type?: string;
  subject?: string;
  created_at: string;
  metadata?: any;
  imageUrl?: string;
  sources?: Source[];
  sourcesCount?: number;
  wolframResult?: {
    answer: string;
    solution?: string;
    steps: Array<{ title: string; content: string }>;
    input_interpretation?: string;
    plots: Array<{ 
      title: string; 
      url: string; 
      description?: string;
      type?: string;
      width?: number;
      height?: number;
    }>;
    metadata?: any;
  };
}

interface Session {
  id: string;
  session_name: string;
  subject?: string;
  is_active: boolean;
  started_at: string;
  last_message_at: string;
  created_at: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' },
];

// Helper function to extract sources from API response
const extractSources = (response: any, contentText: string): { sources: Source[]; sourcesCount: number; cleanedContent: string } => {
  let extractedSources: Source[] = [];
  let sourcesCount = 0;
  let cleanedContent = contentText;
  
  // Try to get sources from response metadata
  if (response.sources && Array.isArray(response.sources)) {
    extractedSources = response.sources;
    sourcesCount = response.sources.length;
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
    
    // Extract source lines - look for patterns like "ncert - battery"
    const sourceLines: string[] = [];
    const lines = contentText.split('\n');
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      const sourcePattern = /^(\w+)\s*-\s*([^-]+)$/i;
      const match = trimmedLine.match(sourcePattern);
      
      if (match) {
        const [, type, chapter] = match;
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
        extractedSources = Array.from(uniqueSources.values());
        if (!sourcesCount) {
          sourcesCount = extractedSources.length;
        }
      }
    }
    
    // Clean content - remove source lines if they were embedded
    if (sourceLines.length > 0) {
      cleanedContent = contentText
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          const isSourceLine = /^(\w+)\s*-\s*([^-]+)$/i.test(trimmed);
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

export default function EnhancedAITutorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionsEndpointAvailable, setSessionsEndpointAvailable] = useState<boolean | null>(null);
  const [fetchingSessions, setFetchingSessions] = useState(false);
  const [sessionCreateRetryCount, setSessionCreateRetryCount] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('mathematics');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [useWolfram, setUseWolfram] = useState(true);
  const [processingWolfram, setProcessingWolfram] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<{ url: string; title: string; description?: string } | null>(null);
  const [wolframViewMode, setWolframViewMode] = useState<Record<string, 'extracted' | 'embedded'>>({}); // messageId -> view mode
  const [wolframEmbedUrl, setWolframEmbedUrl] = useState<Record<string, string>>({}); // messageId -> embed URL
  const [messageFormulas, setMessageFormulas] = useState<Record<string, Array<{
    name: string;
    formula: string;
    wolfram_query?: string;
    type?: string;
    description?: string;
  }>>>({});
  const [fetchingFormulas, setFetchingFormulas] = useState<Record<string, boolean>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const configErrorShownRef = useRef<boolean>(false);

  useEffect(() => {
    if (user?.id) {
      fetchSessions();
    }
    synthRef.current = window.speechSynthesis;
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [user]);

  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.id);
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchSessions = async (force = false) => {
    if (!user?.id) return;
    
    // If endpoint is known to be unavailable (503), skip unless forced
    if (sessionsEndpointAvailable === false && !force) {
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (fetchingSessions) {
      return;
    }
    
    setFetchingSessions(true);
    try {
      const response = await api.aiTutoring.getSessions({
        user_id: user.id,
        limit: 50
      });
      const sortedSessions = (response.sessions || []).sort((a: Session, b: Session) => 
        new Date(b.last_message_at || b.created_at).getTime() - 
        new Date(a.last_message_at || a.created_at).getTime()
      );
      setSessions(sortedSessions);
      setSessionsEndpointAvailable(true);
      
      if (!currentSession) {
        const activeSession = sortedSessions.find((s: Session) => s.is_active);
        if (activeSession) {
          setCurrentSession(activeSession);
        } else if (sortedSessions.length > 0) {
          setCurrentSession(sortedSessions[0]);
        }
      }
    } catch (error: any) {
      // Handle errors gracefully
      if (error.status === 503) {
        // Service temporarily unavailable - check if retryable
        const errorMsg = error.data?.error?.message || error.message || 'Service temporarily unavailable';
        const isRetryable = error.data?.error?.retryable !== false;
        
        if (sessionsEndpointAvailable === null) {
          console.warn(`AI Tutoring service temporarily unavailable: ${errorMsg}`);
        }
        
        // Mark as unavailable but allow retry if retryable
        if (!isRetryable) {
          setSessionsEndpointAvailable(false);
        }
        setSessions([]);
      } else if (error.status === 500) {
        // Backend server error
        const errorData = error.data || {};
        const errorMsg = errorData.error?.message || errorData.detail || error.message || 'Backend service error';
        const errorStr = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
        
        // Detect Supabase configuration errors (check first as they're configuration issues)
        const isSupabaseConfigError = errorStr.includes('supabase_url is required') ||
                                     errorStr.includes('supabase_url') ||
                                     errorStr.includes('SUPABASE_URL') ||
                                     errorStr.includes('Invalid API key') || 
                                     errorStr.includes('Supabase') ||
                                     errorStr.includes('anon') ||
                                     errorStr.includes('service_role') ||
                                     errorStr.includes('API key') ||
                                     errorStr.includes('authentication') ||
                                     errorStr.includes('JSON could not be generated');
        
        // Detect Python syntax/indentation errors
        const isPythonSyntaxError = errorStr.includes('unindent') || 
                                   errorStr.includes('indentation') || 
                                   errorStr.includes('IndentationError') ||
                                   errorStr.includes('f-string') || 
                                   errorStr.includes('backslash') ||
                                   errorStr.includes('SyntaxError') ||
                                   /\([^)]+\.py,\s*line\s*\d+\)/.test(errorStr);
        
        // Extract file and line number if available
        const fileMatch = errorStr.match(/\(([^)]+\.py),\s*line\s*(\d+)\)/);
        
        // Only log and show toast once to avoid spam
        if (sessionsEndpointAvailable === null && !configErrorShownRef.current) {
          if (isSupabaseConfigError) {
            if (errorStr.includes('supabase_url is required') || errorStr.includes('supabase_url')) {
              const errorMessage = 'Backend configuration error: The backend is missing the Supabase URL environment variable (SUPABASE_URL). This is a backend configuration issue that needs to be fixed by the development team.';
              console.warn('AI Tutoring service -', errorMessage);
              configErrorShownRef.current = true;
              toast({
                title: 'Backend Configuration Error',
                description: errorMessage,
                variant: 'destructive',
                duration: 8000
              });
            } else {
              const errorMessage = 'Backend authentication error: The backend is using an invalid Supabase API key or missing configuration. This is a backend configuration issue.';
              console.warn('AI Tutoring service -', errorMessage);
              configErrorShownRef.current = true;
              toast({
                title: 'Backend Configuration Error',
                description: errorMessage,
                variant: 'destructive',
                duration: 8000
              });
            }
          } else if (isPythonSyntaxError) {
            if (fileMatch) {
              console.warn(`AI Tutoring service - backend code error detected in ${fileMatch[1]} (line ${fileMatch[2]}). This needs to be fixed in the backend.`);
            } else {
              console.warn('AI Tutoring service - backend code error detected. This needs to be fixed in the backend.');
            }
          } else {
            console.warn('AI Tutoring service - backend error:', errorStr.substring(0, 200));
          }
        }
        
        // Don't mark as permanently unavailable for 500 errors - might be temporary
        // Allow retries since backend might be fixed
        setSessions([]);
      } else if (error.status === 404) {
        // Endpoint not found - should not happen with correct path, but handle gracefully
        console.warn('AI Tutoring sessions endpoint not found');
        setSessionsEndpointAvailable(false);
        setSessions([]);
      } else {
        console.error('Error fetching sessions:', error);
        setSessions([]);
      }
    } finally {
      setFetchingSessions(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await api.aiTutoring.getSessionMessages(sessionId, 100);
      setMessages(response.messages || response || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      // Only show toast for non-404 errors (404 might mean no messages yet)
      if (error.status !== 404) {
        const errorMsg = error.data?.error?.message || error.message || 'Failed to load messages';
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive'
        });
      } else {
        // 404 might mean no messages yet, which is fine
        setMessages([]);
      }
    }
  };

  const createNewSession = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create a new chat session.',
        variant: 'destructive'
      });
      return;
    }

    // Validate required fields
    if (!subject || subject.trim() === '') {
      toast({
        title: 'Subject Required',
        description: 'Please select a subject before creating a new chat.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Prepare request payload with validation
      const payload = {
        user_id: user.id,
        session_name: `New Chat ${new Date().toLocaleDateString()}`,
        subject: subject.trim()
      };

      // Log request for debugging (only in development)
      if (import.meta.env.DEV) {
        console.log('Creating AI tutoring session:', payload);
      }

      const response = await api.aiTutoring.createSession(payload);
      
      const newSession = response.session || response;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      setSessionCreateRetryCount(0);
      setSessionsEndpointAvailable(true);
      
      toast({
        title: 'New Chat Created',
        description: 'Start chatting with your AI tutor!'
      });
    } catch (error: any) {
      // Log error details for debugging
      console.error('Failed to create AI tutoring session:', {
        status: error.status,
        message: error.message,
        data: error.data
      });

      // Handle errors with appropriate messaging
      if (error.status === 503) {
        const errorData = error.data?.error || {};
        const errorMsg = errorData.message || error.message || 'Service temporarily unavailable';
        const isRetryable = errorData.retryable !== false;
        
        if (isRetryable && sessionCreateRetryCount < 2) {
          // Retry after a short delay if retryable
          setSessionCreateRetryCount(prev => prev + 1);
          setTimeout(() => {
            createNewSession();
          }, 2000);
          toast({
            title: 'Retrying...',
            description: `${errorMsg}. Retrying...`,
            variant: 'default'
          });
        } else {
          toast({
            title: 'Service Unavailable',
            description: errorMsg || 'AI Tutoring service is temporarily unavailable. Please try again later.',
            variant: 'destructive'
          });
          setSessionCreateRetryCount(0);
        }
      } else if (error.status === 500) {
        // Backend server error
        const errorData = error.data || {};
        const errorMsg = errorData.error?.message || errorData.detail || error.message || 'Backend service error';
        const errorStr = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
        
        // Detect Supabase configuration errors (check first as they're configuration issues)
        const isSupabaseConfigError = errorStr.includes('supabase_url is required') ||
                                     errorStr.includes('supabase_url') ||
                                     errorStr.includes('SUPABASE_URL') ||
                                     errorStr.includes('Invalid API key') || 
                                     errorStr.includes('Supabase') ||
                                     errorStr.includes('anon') ||
                                     errorStr.includes('service_role') ||
                                     errorStr.includes('API key') ||
                                     errorStr.includes('authentication') ||
                                     errorStr.includes('JSON could not be generated');
        
        // Detect Python syntax/indentation errors
        const isPythonSyntaxError = errorStr.includes('unindent') || 
                                   errorStr.includes('indentation') || 
                                   errorStr.includes('IndentationError') ||
                                   errorStr.includes('f-string') || 
                                   errorStr.includes('backslash') ||
                                   errorStr.includes('SyntaxError') ||
                                   /\([^)]+\.py,\s*line\s*\d+\)/.test(errorStr);
        
        // Extract file and line number if available
        const fileMatch = errorStr.match(/\(([^)]+\.py),\s*line\s*(\d+)\)/);
        let userMessage = '';
        
        if (isSupabaseConfigError) {
          if (errorStr.includes('supabase_url is required') || errorStr.includes('supabase_url')) {
            userMessage = 'Backend configuration error: The backend is missing the Supabase URL environment variable (SUPABASE_URL). This is a backend configuration issue that needs to be fixed by the development team.';
          } else {
            userMessage = 'Backend authentication error: The backend is using an invalid Supabase API key or missing configuration. This is a backend configuration issue that needs to be fixed by the development team.';
          }
        } else if (isPythonSyntaxError) {
          if (fileMatch) {
            userMessage = `Backend code error detected in ${fileMatch[1]} (line ${fileMatch[2]}). This is a backend issue that needs to be fixed by the development team.`;
          } else {
            userMessage = 'Backend code error detected. This is a backend issue that needs to be fixed by the development team.';
          }
        } else {
          userMessage = typeof errorMsg === 'string' ? errorMsg : 'Internal server error. Please try again later.';
        }
        
        toast({
          title: 'Service Error',
          description: userMessage,
          variant: 'destructive',
          duration: 6000 // Show longer for technical errors
        });
        setSessionCreateRetryCount(0);
      } else if (error.status === 404) {
        toast({
          title: 'Feature Not Available',
          description: 'Session creation endpoint not found. Please check your connection.',
          variant: 'default'
        });
      } else if (error.status === 400) {
        const errorMsg = error.data?.error?.message || error.data?.detail || error.message || 'Invalid request';
        toast({
          title: 'Invalid Request',
          description: errorMsg,
          variant: 'destructive'
        });
      } else {
        const errorMsg = error.data?.error?.message || error.message || 'Failed to create session';
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access to record voice messages',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    if (!currentSession || !user?.id) return;
    
    setLoading(true);
    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      
      // Call doubt solver voice endpoint
      const data = await api.doubt.voice({
        user_id: user.id,
        audio: audioFile,
        subject: subject as any
      });
      
      const extractedText = data.query_text || data.extracted_text || data.answer?.summary || '';
      
      if (!extractedText) {
        throw new Error('Could not extract text from audio');
      }
      
      // Translate if needed
      let finalText = extractedText;
      if (selectedLanguage !== 'en') {
        try {
          const translateResponse = await api.translation.translate({
            text: extractedText,
            source_language: selectedLanguage,
            target_language: 'en'
          });
          finalText = translateResponse.translated_text || extractedText;
        } catch (e) {
          console.error('Translation error:', e);
        }
      }
      
      // Send to AI tutor
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'student',
        content: finalText,
        message_type: 'voice',
        subject: subject,
        created_at: new Date().toISOString(),
        metadata: { original_text: extractedText, language: selectedLanguage }
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Check if it's a math query and use Wolfram if enabled
      const isMath = isMathQuery(finalText);
      let wolframResult = null;
      
      if (isMath && useWolfram) {
        try {
          setProcessingWolfram(true);
          wolframResult = await fetchWolframResult(finalText);
        } catch (e) {
          console.error('Wolfram error:', e);
        } finally {
          setProcessingWolfram(false);
        }
      }
      
      let aiResponse = await api.aiTutoring.sendMessage({
        session_id: currentSession.id,
        user_id: user.id,
        content: finalText,
        subject: subject,
        message_type: 'voice'
      });
      
      // Check if RAG couldn't find content - fallback to direct Gemini query
      const voiceContent = aiResponse.ai_message?.content || '';
      const isNoContentFoundVoice = voiceContent.includes("couldn't find relevant information") || 
                                    voiceContent.includes("I couldn't find relevant information") ||
                                    aiResponse.ai_message?.metadata?.reason === "no_content_found" ||
                                    (aiResponse.ai_message?.metadata?.rag_used === false && aiResponse.ai_message?.metadata?.confidence === 0);

      if (isNoContentFoundVoice) {
        try {
          const directResponse = await api.rag.queryDirect({
            query: finalText,
            subject: subject as any
          });
          
          if (directResponse.generated_text) {
            aiResponse = {
              ...aiResponse,
              ai_message: {
                ...aiResponse.ai_message!,
                content: directResponse.generated_text,
                metadata: {
                  ...aiResponse.ai_message!.metadata,
                  rag_used: false,
                  fallback_to_direct: true,
                  note: "Note: This answer is based on general knowledge as the specific topic wasn't found in the curriculum materials."
                }
              }
            };
          }
        } catch (fallbackError) {
          console.error('Direct query fallback failed:', fallbackError);
        }
      }
      
      if (aiResponse.ai_message) {
        // Extract sources from response
        const { sources: extractedSources, sourcesCount, cleanedContent } = extractSources(
          aiResponse,
          aiResponse.ai_message.content || ''
        );
        
        const aiMessage: Message = {
          ...aiResponse.ai_message,
          content: cleanedContent || aiResponse.ai_message.content,
          wolframResult: wolframResult || undefined,
          sources: extractedSources.length > 0 ? extractedSources : undefined,
          sourcesCount: sourcesCount > 0 ? sourcesCount : undefined
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Text-to-speech if enabled
        if (ttsEnabled && synthRef.current) {
          speakText(aiMessage.content, targetLanguage);
        }
      }
      
      // Refresh sessions after sending message
      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process voice message',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!currentSession || !user?.id) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 10MB',
        variant: 'destructive'
      });
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sendImageMessage = async () => {
    if (!imageFile || !currentSession || !user?.id) return;
    
    setLoading(true);
    try {
      const data = await api.doubt.image({
        user_id: user.id,
        image: imageFile,
        subject: subject as any
      });
      
      const extractedText = data.query_text || data.extracted_text || data.answer?.summary || '';
      
      if (!extractedText) {
        throw new Error('Could not extract text from image');
      }
      
      // Translate if needed
      let finalText = extractedText;
      if (selectedLanguage !== 'en') {
        try {
          const translateResponse = await api.translation.translate({
            text: extractedText,
            source_language: selectedLanguage,
            target_language: 'en'
          });
          finalText = translateResponse.translated_text || extractedText;
        } catch (e) {
          console.error('Translation error:', e);
        }
      }
      
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'student',
        content: finalText,
        message_type: 'image',
        subject: subject,
        created_at: new Date().toISOString(),
        imageUrl: imagePreview || undefined,
        metadata: { original_text: extractedText, language: selectedLanguage }
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Check if it's a math query and use Wolfram if enabled
      const isMath = isMathQuery(finalText);
      let wolframResult = null;
      
      if (isMath && useWolfram) {
        try {
          setProcessingWolfram(true);
          wolframResult = await fetchWolframResult(finalText);
        } catch (e) {
          console.error('Wolfram error:', e);
        } finally {
          setProcessingWolfram(false);
        }
      }
      
      let aiResponse = await api.aiTutoring.sendMessage({
        session_id: currentSession.id,
        user_id: user.id,
        content: finalText,
        subject: subject,
        message_type: 'image'
      });
      
      // Check if RAG couldn't find content - fallback to direct Gemini query
      const imageContent = aiResponse.ai_message?.content || '';
      const isNoContentFoundImage = imageContent.includes("couldn't find relevant information") || 
                                    imageContent.includes("I couldn't find relevant information") ||
                                    aiResponse.ai_message?.metadata?.reason === "no_content_found" ||
                                    (aiResponse.ai_message?.metadata?.rag_used === false && aiResponse.ai_message?.metadata?.confidence === 0);

      if (isNoContentFoundImage) {
        try {
          const directResponse = await api.rag.queryDirect({
            query: finalText,
            subject: subject as any
          });
          
          if (directResponse.generated_text) {
            aiResponse = {
              ...aiResponse,
              ai_message: {
                ...aiResponse.ai_message!,
                content: directResponse.generated_text,
                metadata: {
                  ...aiResponse.ai_message!.metadata,
                  rag_used: false,
                  fallback_to_direct: true,
                  note: "Note: This answer is based on general knowledge as the specific topic wasn't found in the curriculum materials."
                }
              }
            };
          }
        } catch (fallbackError) {
          console.error('Direct query fallback failed:', fallbackError);
        }
      }
      
      if (aiResponse.ai_message) {
        // Extract sources from response
        const { sources: extractedSources, sourcesCount, cleanedContent } = extractSources(
          aiResponse,
          aiResponse.ai_message.content || ''
        );
        
        const aiMessage: Message = {
          ...aiResponse.ai_message,
          content: cleanedContent || aiResponse.ai_message.content,
          wolframResult: wolframResult || undefined,
          sources: extractedSources.length > 0 ? extractedSources : undefined,
          sourcesCount: sourcesCount > 0 ? sourcesCount : undefined
        };
        setMessages(prev => [...prev, aiMessage]);
        
        if (ttsEnabled && synthRef.current) {
          speakText(aiMessage.content, targetLanguage);
        }
      }
      
      // Clear image
      setImagePreview(null);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh sessions after sending message
      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process image',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string, lang: string) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Extract plain text from markdown
    const plainText = text.replace(/[#*`_\[\]()]/g, '').substring(0, 500);
    
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = lang === 'en' ? 'en-US' : lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    synthRef.current.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSession || !user?.id || loading) return;

    let finalText = input;
    
    // Translate if needed
    if (selectedLanguage !== 'en') {
      try {
        const translateResponse = await api.translation.translate({
          text: input,
          source_language: selectedLanguage,
          target_language: 'en'
        });
        finalText = translateResponse.translated_text || input;
      } catch (e) {
        console.error('Translation error:', e);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'student',
      content: input,
      message_type: 'text',
      subject: subject,
      created_at: new Date().toISOString(),
      metadata: { translated_text: finalText, language: selectedLanguage }
    };

    setMessages(prev => [...prev, userMessage]);
    const questionText = finalText;
    setInput('');
    setLoading(true);

    try {
      // Check if it's a math query and use Wolfram if enabled
      const isMath = isMathQuery(questionText);
      let wolframResult = null;
      
      if (isMath && useWolfram) {
        try {
          setProcessingWolfram(true);
          wolframResult = await fetchWolframResult(questionText);
        } catch (e) {
          console.error('Wolfram error:', e);
          // Continue with AI response even if Wolfram fails
        } finally {
          setProcessingWolfram(false);
        }
      }

      // Get AI response
      let response = await api.aiTutoring.sendMessage({
        session_id: currentSession.id,
        user_id: user.id,
        content: questionText,
        subject: subject,
        message_type: 'text'
      });

      // Check if RAG couldn't find content - fallback to direct Gemini query
      const content = response.ai_message?.content || '';
      const isNoContentFound = content.includes("couldn't find relevant information") || 
                               content.includes("I couldn't find relevant information") ||
                               response.ai_message?.metadata?.reason === "no_content_found" ||
                               (response.ai_message?.metadata?.rag_used === false && response.ai_message?.metadata?.confidence === 0);

      if (isNoContentFound) {
        // Fallback to direct Gemini query
        try {
          const directResponse = await api.rag.queryDirect({
            query: questionText,
            subject: subject as any
          });
          
          if (directResponse.generated_text) {
            // Replace the no-content message with direct Gemini response
            response = {
              ...response,
              ai_message: {
                ...response.ai_message!,
                content: directResponse.generated_text,
                metadata: {
                  ...response.ai_message!.metadata,
                  rag_used: false,
                  fallback_to_direct: true,
                  note: "Note: This answer is based on general knowledge as the specific topic wasn't found in the curriculum materials."
                }
              }
            };
          }
        } catch (fallbackError) {
          console.error('Direct query fallback failed:', fallbackError);
          // Keep the original response but improve the message
          response = {
            ...response,
            ai_message: {
              ...response.ai_message!,
              content: `I couldn't find specific information about "${questionText}" in the uploaded curriculum materials. However, I can still help you!\n\n**Here's what I can do:**\n\n1. **Answer based on general knowledge** - I can provide explanations based on standard Class 12 curriculum\n2. **Help rephrase your question** - Sometimes asking differently helps find relevant content\n3. **Suggest related topics** - I can guide you to topics that are covered in the materials\n\nWould you like me to:\n- Provide a general explanation of this topic?\n- Help you rephrase your question?\n- Suggest related topics from the curriculum?\n\nJust let me know how you'd like to proceed!`
            }
          };
        }
      }

      if (response.ai_message) {
        // Extract sources from response
        const { sources: extractedSources, sourcesCount, cleanedContent } = extractSources(
          response,
          response.ai_message.content || ''
        );
        
        const aiMessage: Message = {
          ...response.ai_message,
          content: cleanedContent || response.ai_message.content,
          wolframResult: wolframResult || undefined,
          sources: extractedSources.length > 0 ? extractedSources : undefined,
          sourcesCount: sourcesCount > 0 ? sourcesCount : undefined
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Translate AI response if needed
        if (targetLanguage !== 'en') {
          try {
            const translateResponse = await api.translation.translate({
              text: aiMessage.content,
              source_language: 'en',
              target_language: targetLanguage
            });
            if (translateResponse.translated_text) {
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessage.id 
                  ? { ...msg, content: translateResponse.translated_text, metadata: { ...msg.metadata, translated: true } }
                  : msg
              ));
            }
          } catch (e) {
            console.error('Translation error:', e);
          }
        }
        
        // Text-to-speech if enabled
        if (ttsEnabled && synthRef.current) {
          const textToSpeak = targetLanguage !== 'en' && aiMessage.metadata?.translated 
            ? aiMessage.content 
            : aiMessage.content;
          speakText(textToSpeak, targetLanguage);
        }
      }

      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      });
      
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (imagePreview) {
        sendImageMessage();
      } else {
        handleSend();
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSessionPreview = (session: Session) => {
    return session.session_name;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isMathQuery = (text: string): boolean => {
    const mathPatterns = [
      /\d+\s*[\+\-\*/\^]\s*\d+/,  // Basic arithmetic
      /solve|calculate|compute|evaluate|find\s+the\s+value/i,  // Calculation keywords
      /equation|integral|derivative|limit|summation/i,  // Calculus operations
      /=\s*\?|\?\s*=/,  // Equation with unknown
      /\d+\s*x\s*\d+/,  // Multiplication notation
      /sin|cos|tan|log|ln|exp|sqrt/i,  // Mathematical functions
      /d\/dx|∫|∑|∏|lim/i,  // Mathematical symbols
      /matrix|determinant|eigenvalue/i,  // Linear algebra
      /differentiate|integrate/i,  // Calculus verbs
      /plot|graph|visualize|draw/i,  // Graph/plot keywords
      /x\^2|x\^3|y\s*=/i,  // Equations
      /quadratic|polynomial|factorial/i,  // Math terms
      /percent|percentage|\%/i,  // Percentage calculations
    ];
    
    const textLower = text.toLowerCase();
    return mathPatterns.some(pattern => pattern.test(textLower));
  };

  // Extract actual mathematical formula from descriptive text before sending to Wolfram
  const extractFormulaFromQuery = async (query: string): Promise<string> => {
    try {
      // Check if query already contains mathematical expressions/formulas
      const hasFormula = /[∫∑∏√∞±×÷=<>≤≥∈∉∑∏∂∇Δαβγδεζηθικλμνξοπρστυφχψω]/.test(query) || 
                         /\d+\s*[\+\-\*/\^]\s*\d+/.test(query) ||
                         /(integral|derivative|integrate|differentiate|solve|calculate|evaluate)\s+(of|for|the)?\s*[a-z]/i.test(query) ||
                         /[a-z]\(x\)|[a-z]\^[0-9]|sin|cos|tan|log|ln|exp|sqrt/i.test(query);
      
      // If it looks like a formula/expression already, use as-is
      if (hasFormula) {
        return query;
      }
      
      // Use Gemini to extract the REAL mathematical formula from the question/content
      // This extracts actual formulas, not hardcoded patterns
      const prompt = `Extract the ACTUAL mathematical formula or expression from this question. DO NOT use hardcoded formulas - extract what's really there.

Question: "${query}"

CRITICAL INSTRUCTIONS:
1. Look for ACTUAL formulas/equations in the question itself
2. If the question mentions a specific formula, extract it exactly as stated
3. If asking about a concept, find the REAL formula representation from mathematical literature
4. Format for Wolfram Alpha: use * for multiplication, ^ for exponentiation
5. Return ONLY the formula/expression - no descriptions, no explanations
6. If you cannot find a real formula, return "NONE"

DO NOT return hardcoded examples. Extract or construct the real mathematical formula.
If asking "Definite Integral Definition", return the actual integral notation like "∫[a to b] f(x) dx"

Formula:`;

      try {
        const response = await api.rag.queryDirect({
          query: prompt,
          subject: subject as any
        });
        
        if (response.generated_text) {
          let formula = response.generated_text.trim();
          // Clean up: take first line, remove quotes, remove markdown
          formula = formula.split('\n')[0].trim();
          formula = formula.replace(/^["']|["']$/g, '');
          formula = formula.replace(/^```[\w]*\n?|\n?```$/g, '');
          
          // If Gemini returned "NONE", use original query
          if (formula.toUpperCase() === 'NONE' || formula.length === 0) {
            return query;
          }
          
          // Validate it's a reasonable formula (not too long, has mathematical content)
          if (formula.length > 0 && formula.length < 200) {
            // Check if it contains mathematical notation/expressions
            const hasMathContent = /[∫∑∏√∞±×÷=<>≤≥∈∉∑∏∂∇Δαβγδεζηθικλμνξοπρστυφχψω\d\+\-\*/\^\(\)xysin|cos|tan|log|ln|exp|sqrt]/i.test(formula);
            if (hasMathContent) {
              return formula;
            }
          }
        }
      } catch (e) {
        console.error('Formula extraction error:', e);
      }
      
      // No hardcoded fallback - return original query if extraction fails
      // This allows Wolfram Alpha to interpret the query naturally
      return query;
    } catch (error) {
      console.error('Error extracting formula:', error);
      return query;
    }
  };

  const fetchWolframResult = async (query: string, context?: string) => {
    try {
      // First, extract the actual formula from descriptive text
      // If context is provided (e.g., AI response with formulas), use it to extract real formulas
      let formulaQuery = query;
      
      if (context) {
        // Try to extract actual formula from the context/response content
        try {
          const contextExtractionPrompt = `Extract the actual mathematical formula or expression from this content. Look for formulas written in mathematical notation.

Content:
${context}

Question: "${query}"

Instructions:
- Extract any actual formulas/equations mentioned in the content
- Look for mathematical expressions, equations, integrals, derivatives, etc.
- Format exactly as Wolfram Alpha expects
- Return ONLY the formula/expression ready for Wolfram Alpha
- If you find a formula, return it. If not, return "NONE"

Formula:`;

          const contextResponse = await api.rag.queryDirect({
            query: contextExtractionPrompt,
            subject: subject as any
          });
          
          if (contextResponse.generated_text) {
            let extractedFormula = contextResponse.generated_text.trim();
            extractedFormula = extractedFormula.split('\n')[0].trim();
            extractedFormula = extractedFormula.replace(/^["']|["']$/g, '');
            extractedFormula = extractedFormula.replace(/^```[\w]*\n?|\n?```$/g, '');
            
            if (extractedFormula.toUpperCase() !== 'NONE' && extractedFormula.length > 0 && extractedFormula.length < 200) {
              const hasMathContent = /[∫∑∏√∞±×÷=<>≤≥∈∉∑∏∂∇Δαβγδεζηθικλμνξοπρστυφχψω\d\+\-\*/\^\(\)xysin|cos|tan|log|ln|exp|sqrt]/i.test(extractedFormula);
              if (hasMathContent) {
                formulaQuery = extractedFormula;
              }
            }
          }
        } catch (e) {
          console.error('Context formula extraction error:', e);
        }
      }
      
      // If no formula found in context, extract from query itself
      if (formulaQuery === query) {
        formulaQuery = await extractFormulaFromQuery(query);
      }
      
      const response = await api.doubt.wolframChat({
        query: formulaQuery,
        include_steps: true
      });
      
      if (response.success && response.result) {
        return response.result;
      }
      return null;
    } catch (error: any) {
      console.error('Wolfram Alpha error:', error);
      return null;
    }
  };

  const handleFetchFormulas = async (messageId: string, messageContent: string) => {
    if (fetchingFormulas[messageId] || messageFormulas[messageId]) return;
    
    setFetchingFormulas(prev => ({ ...prev, [messageId]: true }));
    
    try {
      // Extract formulas using Gemini via RAG query with specialized prompt
      const extractionPrompt = `You are a specialized mathematical content extractor. Extract ALL important mathematical formulas, equations, problems, and scientific content from this text and format them EXACTLY as they should be used with Wolfram Alpha.

Text:
${messageContent}

CRITICAL: Format ALL formulas and equations EXACTLY as Wolfram Alpha expects them. Use proper Wolfram Alpha syntax.

WOLFRAM ALPHA FORMATTING RULES:
- Use * for multiplication (e.g., 2*x not 2x)
- Use ^ for exponentiation (e.g., x^2)
- Use proper function names: sin, cos, tan, log, ln, exp, sqrt
- Use parentheses for clarity: (2*x + 3)
- For integrals: "integrate x^2, x"
- For derivatives: "d/dx(x^2)" or "derivative of x^2"
- For solving: "solve x^2 + 5*x + 6 = 0"
- For plots: "plot sin(x), x from -pi to pi"

Return ONLY a valid JSON array with this EXACT format (no markdown, just JSON):
[
  {
    "name": "Formula name or description",
    "formula": "Mathematical formula in standard notation (e.g., E = mc²)",
    "wolfram_query": "Exact query formatted for Wolfram Alpha (e.g., E = m*c^2)",
    "type": "formula|equation|calculation|derivative|integral|plot",
    "description": "Brief description"
  }
]

IMPORTANT: The "wolfram_query" field MUST be formatted exactly as it should be entered into Wolfram Alpha - copy-paste ready. Return ONLY the JSON array, no other text.`;

      const response = await api.rag.queryDirect({
        query: extractionPrompt,
        subject: subject as any
      });

      const responseText = response.generated_text || "";
      
      // Try to parse JSON from response
      let formulas: Array<{
        name: string;
        formula: string;
        wolfram_query?: string;
        type?: string;
        description?: string;
      }> = [];

      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || 
                         responseText.match(/(\[[\s\S]*?\])/);
        
        const jsonText = jsonMatch ? jsonMatch[1] : responseText;
        const parsed = JSON.parse(jsonText);
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          formulas = parsed.map((f: any) => ({
            name: f.name || "Formula",
            formula: f.formula || f.equation || "",
            wolfram_query: f.wolfram_query || f.problem || f.formula || "",
            type: f.type || "formula",
            description: f.description || ""
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse formulas:', parseError);
        toast({
          title: 'Error',
          description: 'Failed to extract formulas. Please try again.',
          variant: 'destructive'
        });
      }

      if (formulas.length > 0) {
        setMessageFormulas(prev => ({ ...prev, [messageId]: formulas }));
        toast({
          title: 'Formulas Extracted',
          description: `Found ${formulas.length} formula(s) ready for Wolfram Alpha`
        });
      } else {
        toast({
          title: 'No Formulas Found',
          description: 'No formulas were found in this response.',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error fetching formulas:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to extract formulas',
        variant: 'destructive'
      });
    } finally {
      setFetchingFormulas(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const handleUseFormulaWithWolfram = async (formula: { wolfram_query?: string; formula: string; name?: string }) => {
    const query = formula.wolfram_query || formula.formula;
    if (!query) return;

    setProcessingWolfram(true);
    try {
      const wolframResult = await fetchWolframResult(query);
      
      if (wolframResult) {
        // Create a new message with Wolfram result
        const wolframMessage: Message = {
          id: `wolfram-${Date.now()}`,
          role: 'assistant',
          content: `Wolfram Alpha solution for: **${formula.name || formula.formula}**`,
          subject: subject,
          created_at: new Date().toISOString(),
          wolframResult: wolframResult
        };
        
        setMessages(prev => [...prev, wolframMessage]);
        
        toast({
          title: 'Wolfram Alpha Result',
          description: 'Solution computed successfully!'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to compute with Wolfram Alpha',
        variant: 'destructive'
      });
    } finally {
      setProcessingWolfram(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-card border-r transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        {sidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="p-3 border-b">
              <Button
                onClick={createNewSession}
                className="w-full justify-start gap-2"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {sessions.length === 0 && fetchingSessions ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Loading sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No chats yet. Start a new conversation!
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group relative rounded-lg p-3 cursor-pointer transition-colors",
                        currentSession?.id === session.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent"
                      )}
                      onClick={() => setCurrentSession(session)}
                    >
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingSessionName}
                            onChange={(e) => setEditingSessionName(e.target.value)}
                            onBlur={() => setEditingSessionId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingSessionId(null);
                              }
                            }}
                            className="h-8 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {getSessionPreview(session)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(session.last_message_at || session.created_at)}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(session.id);
                                  setEditingSessionName(session.session_name);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast({
                                    title: 'Delete Session',
                                    description: 'Session deletion will be implemented',
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Sidebar Footer */}
            <div className="p-3 border-t space-y-2">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="h-8 text-xs">
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
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">AI Tutor</h1>
                <p className="text-xs text-muted-foreground">
                  {currentSession ? currentSession.session_name : 'Select or create a chat'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="h-8 w-32">
                <Languages className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant={useWolfram ? "default" : "ghost"}
              size="icon"
              onClick={() => setUseWolfram(!useWolfram)}
              title={useWolfram ? 'Disable Wolfram Alpha' : 'Enable Wolfram Alpha for math'}
            >
              <Calculator className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          {!currentSession ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-md">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Start a new conversation</h2>
                <p className="text-muted-foreground">
                  Create a new chat to begin learning with your AI tutor. Ask questions, get help with homework, or request explanations on any topic.
                </p>
                {sessionsEndpointAvailable === false && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Service Temporarily Unavailable</p>
                    <p className="text-xs mt-1">The AI Tutoring service is experiencing technical issues. Please try again in a moment.</p>
                  </div>
                )}
                <Button onClick={createNewSession} disabled={loading} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto p-4 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">How can I help you today?</h3>
                      <p className="text-sm text-muted-foreground">
                        Ask me anything about {subject} or any other subject!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-4",
                        message.role === 'student' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "flex flex-col gap-2 max-w-[85%]",
                          message.role === 'student' ? 'items-end' : 'items-start'
                        )}
                      >
                        {message.imageUrl && (
                          <div className="rounded-lg overflow-hidden border">
                            <img 
                              src={message.imageUrl} 
                              alt="Uploaded" 
                              className="max-w-full h-auto max-h-64 object-contain"
                            />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3",
                            message.role === 'student'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {message.role === 'assistant' && message.metadata?.fallback_to_direct && (
                            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3" />
                                <span className="font-medium">General Knowledge Response:</span> This answer is based on general knowledge as the specific topic wasn't found in the uploaded curriculum materials.
                              </p>
                            </div>
                          )}
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        {/* Fetch Formulas Button for Assistant Messages */}
                        {message.role === 'assistant' && !messageFormulas[message.id] && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFetchFormulas(message.id, message.content)}
                              disabled={fetchingFormulas[message.id]}
                              className="text-xs h-7"
                            >
                              {fetchingFormulas[message.id] ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Extracting...
                                </>
                              ) : (
                                <>
                                  <Calculator className="h-3 w-3 mr-1" />
                                  Fetch Formulas
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        {/* Display Extracted Formulas */}
                        {message.role === 'assistant' && messageFormulas[message.id] && messageFormulas[message.id].length > 0 && (
                          <div className="mt-3 space-y-2 p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-foreground">
                                  Extracted Formulas ({messageFormulas[message.id].length})
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newFormulas = { ...messageFormulas };
                                  delete newFormulas[message.id];
                                  setMessageFormulas(newFormulas);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {messageFormulas[message.id].map((formula, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-background rounded-lg border border-primary/20 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group"
                                  onClick={() => handleUseFormulaWithWolfram(formula)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {formula.name && (
                                          <Badge variant="outline" className="text-xs border-primary/30">
                                            {formula.name}
                                          </Badge>
                                        )}
                                        {formula.type && (
                                          <Badge variant="secondary" className="text-xs">
                                            {formula.type}
                                          </Badge>
                                        )}
                                      </div>
                                      {formula.formula && (
                                        <div className="mb-1.5">
                                          <p className="text-xs text-muted-foreground mb-0.5">Formula:</p>
                                          <p className="text-sm font-mono font-bold text-primary">
                                            {formula.formula}
                                          </p>
                                        </div>
                                      )}
                                      {formula.wolfram_query && (
                                        <div className="mb-1.5">
                                          <p className="text-xs text-muted-foreground mb-0.5">Wolfram Query:</p>
                                          <p className="text-sm font-mono text-foreground bg-muted/50 px-2 py-1 rounded border border-primary/20 break-words">
                                            {formula.wolfram_query}
                                          </p>
                                        </div>
                                      )}
                                      {formula.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          {formula.description}
                                        </p>
                                      )}
                                      <p className="text-xs text-primary mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to solve with Wolfram Alpha →
                                      </p>
                                    </div>
                                    <Sparkles className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {message.wolframResult && (
                          <div className="mt-2 space-y-3">
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                    Wolfram Alpha Solution
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant={wolframViewMode[message.id] === 'embedded' ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      const currentMode = wolframViewMode[message.id] || 'extracted';
                                      setWolframViewMode(prev => ({
                                        ...prev,
                                        [message.id]: currentMode === 'embedded' ? 'extracted' : 'embedded'
                                      }));
                                      // Generate embed URL if not already generated
                                      if (currentMode === 'extracted' && !wolframEmbedUrl[message.id]) {
                                        const query = message.wolframResult?.input_interpretation || 
                                                     message.metadata?.translated_text || 
                                                     message.content.split('\n')[0].substring(0, 200);
                                        const encodedQuery = encodeURIComponent(query);
                                        setWolframEmbedUrl(prev => ({
                                          ...prev,
                                          [message.id]: `https://www.wolframalpha.com/input/?i=${encodedQuery}`
                                        }));
                                      }
                                    }}
                                  >
                                    {wolframViewMode[message.id] === 'embedded' ? (
                                      <>
                                        <Eye className="h-3 w-3 mr-1" />
                                        Full Page View
                                      </>
                                    ) : (
                                      <>
                                        <Maximize2 className="h-3 w-3 mr-1" />
                                        Full Page View
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Wolfram Alpha Full Page View - Opens in New Tab */}
                              {wolframViewMode[message.id] === 'embedded' && wolframEmbedUrl[message.id] && (
                                <div className="mb-3 rounded-lg overflow-hidden border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                                  <div className="p-6 text-center space-y-4">
                                    <div className="flex justify-center">
                                      <div className="h-16 w-16 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center">
                                        <Calculator className="h-8 w-8 text-white" />
                                      </div>
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                        View Full Wolfram Alpha Result
                                      </h3>
                                      <p className="text-sm text-muted-foreground mb-4">
                                        Wolfram Alpha cannot be embedded directly due to security restrictions, 
                                        but you can view the complete result page with all interactive features.
                                      </p>
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                      <Button
                                        variant="default"
                                        size="lg"
                                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                        onClick={() => window.open(wolframEmbedUrl[message.id], '_blank', 'noopener,noreferrer')}
                                      >
                                        <Maximize2 className="h-4 w-4 mr-2" />
                                        Open Full Result in New Tab
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setWolframViewMode(prev => ({
                                          ...prev,
                                          [message.id]: 'extracted'
                                        }))}
                                      >
                                        View Extracted Data
                                      </Button>
                                    </div>
                                    <div className="pt-2">
                                      <p className="text-xs text-muted-foreground">
                                        The full page includes interactive visualizations, step-by-step solutions, 
                                        and all Wolfram Alpha features.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Extracted Data View */}
                              {wolframViewMode[message.id] !== 'embedded' && (
                                <>
                              {message.wolframResult.input_interpretation && (
                                <div className="mb-3 text-xs text-muted-foreground">
                                  <span className="font-medium">Interpreted as:</span> {message.wolframResult.input_interpretation}
                                </div>
                              )}
                              
                              {message.wolframResult.answer && (
                                <div className="mb-3">
                                  <div className="text-sm font-semibold mb-1">Answer:</div>
                                  <div className="text-base font-mono bg-white dark:bg-gray-900 p-2 rounded border">
                                    {message.wolframResult.answer}
                                  </div>
                                </div>
                              )}
                              
                              {message.wolframResult.steps && message.wolframResult.steps.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Step-by-Step Solution:
                                  </div>
                                  <div className="space-y-2">
                                    {message.wolframResult.steps.map((step, idx) => (
                                      <div key={idx} className="bg-white dark:bg-gray-900 p-2 rounded border text-sm">
                                        <div className="font-medium text-xs mb-1">{step.title}:</div>
                                        <div className="font-mono text-xs whitespace-pre-wrap">{step.content}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {message.wolframResult.plots && message.wolframResult.plots.length > 0 && (
                                <div>
                                  <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Visualizations & Graphs ({message.wolframResult.plots.length})
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {message.wolframResult.plots.map((plot, idx) => (
                                      <div 
                                        key={idx} 
                                        className="group relative bg-white dark:bg-gray-900 rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 overflow-hidden transition-all cursor-pointer"
                                        onClick={() => setSelectedPlot({
                                          url: plot.url,
                                          title: plot.title,
                                          description: plot.description || plot.title
                                        })}
                                      >
                                        <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-blue-200 dark:border-blue-800">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                              {plot.type && (
                                                <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700">
                                                  {plot.type.replace('_', ' ')}
                                                </Badge>
                                              )}
                                              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100 truncate" title={plot.title}>
                                                {plot.title}
                                              </span>
                                            </div>
                                            <ImageIcon className="h-3 w-3 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-gray-900">
                                          <img 
                                            src={plot.url} 
                                            alt={plot.title || `Visualization ${idx + 1}`}
                                            className="w-full h-auto rounded-lg shadow-sm max-h-64 object-contain mx-auto transition-transform group-hover:scale-105"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              const parent = target.parentElement;
                                              if (parent) {
                                                parent.innerHTML = '<div class="p-8 text-center text-muted-foreground text-sm">Failed to load image</div>';
                                              }
                                            }}
                                            loading="lazy"
                                          />
                                          {plot.description && plot.description !== plot.title && (
                                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                              {plot.description}
                                            </p>
                                          )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors rounded-lg pointer-events-none" />
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3" />
                                    Click on any visualization to view in full size
                                  </p>
                                </div>
                              )}
                              </>
                              )}
                            </div>
                          </div>
                        )}
                        {message.metadata?.answer_data && (
                          <div className="mt-2 space-y-2 text-sm">
                            {message.metadata.answer_data.examples && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="font-semibold mb-2">Examples:</p>
                                <ul className="space-y-1 list-disc list-inside">
                                  {message.metadata.answer_data.examples.slice(0, 3).map((ex: any, i: number) => (
                                    <li key={i} className="text-muted-foreground">
                                      {typeof ex === 'string' ? ex : JSON.stringify(ex)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {message.metadata.answer_data.practice_suggestions && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="font-semibold mb-2">Practice Suggestions:</p>
                                <ul className="space-y-1 list-disc list-inside">
                                  {message.metadata.answer_data.practice_suggestions.slice(0, 3).map((sug: any, i: number) => (
                                    <li key={i} className="text-muted-foreground">
                                      {typeof sug === 'string' ? sug : JSON.stringify(sug)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Sources Display - Enhanced UI */}
                        {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/10">
                                  <BookMarked className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-foreground">Sources</p>
                                  {message.sourcesCount && (
                                    <p className="text-xs text-muted-foreground">
                                      {message.sourcesCount} section{message.sourcesCount !== 1 ? 's' : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              {(() => {
                                // Group sources by type and chapter to avoid duplicates
                                const groupedSources = new Map<string, { count: number; source: Source }>();
                                
                                message.sources!.forEach((source) => {
                                  const key = `${source.type || 'content'}-${source.chapter || 'unknown'}`;
                                  if (groupedSources.has(key)) {
                                    groupedSources.get(key)!.count += 1;
                                  } else {
                                    groupedSources.set(key, { count: 1, source });
                                  }
                                });
                                
                                return Array.from(groupedSources.values()).map((group, idx) => {
                                  const { source, count } = group;
                                  const displayType = source.type ? source.type.toUpperCase() : 'CONTENT';
                                  const displayChapter = source.chapter || 'General';
                                  const sourceTypeColor = source.type === 'ncert' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                                         source.type === 'pyq' ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                                                         source.type === 'hots' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                                                         'bg-muted border-border';
                                  
                                  return (
                                    <div
                                      key={idx}
                                      className="group relative flex items-start gap-2.5 p-2.5 rounded-lg bg-gradient-to-r from-background to-muted/30 border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                                    >
                                      <div className={`p-1.5 rounded-md ${sourceTypeColor} flex-shrink-0`}>
                                        <BookOpen className="h-3.5 w-3.5" />
                                      </div>
                                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                            <Badge variant="outline" className={`text-xs font-semibold h-5 ${sourceTypeColor}`}>
                                              {displayType}
                                            </Badge>
                                            {count > 1 && (
                                              <Badge variant="secondary" className="text-xs h-5 font-medium">
                                                {count}x
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate" title={displayChapter}>
                                            {displayChapter}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                        {/* Show sources count even if sources array is empty but count exists */}
                        {message.role === 'assistant' && (!message.sources || message.sources.length === 0) && message.sourcesCount && message.sourcesCount > 0 && (
                          <div className="mt-4 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                              <div className="p-1.5 rounded-lg bg-primary/10">
                                <BookMarked className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground">Content References</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Based on {message.sourcesCount} relevant content section{message.sourcesCount !== 1 ? 's' : ''} from the curriculum
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {message.role === 'student' && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-secondary">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex gap-4 justify-start">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                        {processingWolfram && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            <Calculator className="h-3 w-3 mr-1" />
                            Computing with Wolfram
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Area */}
        {currentSession && (
          <div className="border-t bg-card p-4">
            <div className="max-w-3xl mx-auto">
              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-xs h-auto rounded-lg border"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="relative flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={imagePreview ? "Add a message about this image..." : "Message AI Tutor..."}
                    disabled={loading || isRecording}
                    className="min-h-[52px] rounded-2xl pr-32"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || isRecording}
                      title="Upload image"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    {isRecording ? (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={stopRecording}
                        title="Stop recording"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          isRecording && "bg-destructive text-destructive-foreground animate-pulse"
                        )}
                        onClick={startRecording}
                        disabled={loading}
                        title="Record voice message"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={imagePreview ? sendImageMessage : handleSend}
                      disabled={(!input.trim() && !imagePreview) || loading || isRecording}
                      size="icon"
                      className="h-9 w-9 rounded-full"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              {isRecording && (
                <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  Recording: {formatTime(recordingTime)}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  AI can make mistakes. Check important info.
                </p>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Full-Size Graph/Visualization Dialog */}
      <Dialog open={!!selectedPlot} onOpenChange={(open) => !open && setSelectedPlot(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              {selectedPlot?.title || 'Wolfram Alpha Visualization'}
            </DialogTitle>
          </DialogHeader>
          {selectedPlot && (
            <div className="space-y-4">
              {selectedPlot.description && selectedPlot.description !== selectedPlot.title && (
                <p className="text-sm text-muted-foreground">
                  {selectedPlot.description}
                </p>
              )}
              <div className="relative bg-white dark:bg-gray-900 rounded-lg border-2 border-primary/20 p-4 overflow-auto">
                <img 
                  src={selectedPlot.url} 
                  alt={selectedPlot.title || 'Visualization'}
                  className="w-full h-auto max-w-full rounded-lg shadow-lg mx-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="p-12 text-center text-muted-foreground">Failed to load visualization</div>';
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedPlot?.url) {
                      window.open(selectedPlot.url, '_blank');
                    }
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedPlot?.url) {
                      navigator.clipboard.writeText(selectedPlot.url);
                      toast({
                        title: 'Copied!',
                        description: 'Image URL copied to clipboard',
                      });
                    }
                  }}
                >
                  Copy URL
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
