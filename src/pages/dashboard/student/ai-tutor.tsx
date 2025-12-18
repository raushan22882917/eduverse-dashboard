import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  User, 
  Send, 
  Loader2, 
  Plus, 
  X, 
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
  Maximize2,
  Brain,
  History,
  Search,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  fromMemory?: boolean;
  memoryId?: string;
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

interface MemoryItem {
  id: string;
  user_id: string;
  type: 'ai_response' | 'explanation' | 'content';
  title: string;
  content: {
    question: string;
    answer: string;
    sources?: Source[];
    metadata?: any;
  };
  subject: string;
  topic?: string;
  created_at: string;
  updated_at: string;
  metadata: any;
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

// Helper function to normalize questions for similarity comparison
const normalizeQuestion = (question: string): string => {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper function to calculate similarity between two questions
const calculateSimilarity = (q1: string, q2: string): number => {
  const norm1 = normalizeQuestion(q1);
  const norm2 = normalizeQuestion(q2);
  
  // Simple word-based similarity
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
};

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
  
  return { sources: extractedSources, sourcesCount, cleanedContent };
};

export default function AITutorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('mathematics');
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
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [checkingMemory, setCheckingMemory] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchSessions();
      loadMemoryItems();
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

  const loadMemoryItems = async () => {
    if (!user?.id) return;
    
    try {
      // Load from localStorage for now (can be extended to use Supabase later)
      const stored = localStorage.getItem(`ai-tutor-memory-${user.id}`);
      if (stored) {
        setMemoryItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading memory items:', error);
    }
  };

  const saveToMemory = async (question: string, answer: string, sources?: Source[], metadata?: Record<string, any>) => {
    if (!user?.id) return;
    
    try {
      const memoryItem: MemoryItem = {
        id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        type: 'ai_response',
        title: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
        content: {
          question,
          answer,
          sources,
          metadata
        },
        subject,
        topic: extractTopicFromQuestion(question),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          language: selectedLanguage,
          session_id: currentSession?.id
        }
      };
      
      const updatedMemory = [memoryItem, ...memoryItems];
      setMemoryItems(updatedMemory);
      
      // Save to localStorage
      localStorage.setItem(`ai-tutor-memory-${user.id}`, JSON.stringify(updatedMemory));
      
      return memoryItem.id;
    } catch (error) {
      console.error('Error saving to memory:', error);
      return null;
    }
  };

  const searchMemory = async (question: string): Promise<MemoryItem | null> => {
    if (!user?.id || memoryItems.length === 0) return null;
    
    setCheckingMemory(true);
    
    try {
      // Find similar questions in memory
      const similarities = memoryItems.map(item => ({
        item,
        similarity: calculateSimilarity(question, item.content.question)
      }));
      
      // Sort by similarity and get the best match
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      const bestMatch = similarities[0];
      
      // If similarity is above threshold (e.g., 0.7), return the cached answer
      if (bestMatch && bestMatch.similarity > 0.7) {
        return bestMatch.item;
      }
      
      return null;
    } catch (error) {
      console.error('Error searching memory:', error);
      return null;
    } finally {
      setCheckingMemory(false);
    }
  };

  const extractTopicFromQuestion = (question: string): string => {
    // Simple topic extraction based on keywords
    const mathKeywords = ['equation', 'integral', 'derivative', 'algebra', 'geometry', 'calculus'];
    const physicsKeywords = ['force', 'energy', 'momentum', 'wave', 'electricity', 'magnetism'];
    const chemistryKeywords = ['molecule', 'atom', 'reaction', 'bond', 'element', 'compound'];
    
    const lowerQuestion = question.toLowerCase();
    
    if (mathKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'mathematics';
    } else if (physicsKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'physics';
    } else if (chemistryKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'chemistry';
    }
    
    return 'general';
  };

  const fetchSessions = async () => {
    if (!user?.id) return;
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
      
      if (!currentSession) {
        const activeSession = sortedSessions.find((s: Session) => s.is_active);
        if (activeSession) {
          setCurrentSession(activeSession);
        } else if (sortedSessions.length > 0) {
          setCurrentSession(sortedSessions[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await api.aiTutoring.getSessionMessages(sessionId, 100);
      setMessages(response.messages || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
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
      
      const payload = {
        user_id: user.id,
        session_name: `New Chat ${new Date().toLocaleDateString()}`,
        subject: subject.trim()
      };

      const response = await api.aiTutoring.createSession(payload);
      
      const newSession = response.session;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      
      toast({
        title: 'New Chat Created',
        description: 'Start chatting with your AI tutor!'
      });
    } catch (error: any) {
      console.error('Failed to create AI tutoring session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create session',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
      // Step 1: Check memory for similar questions
      const memoryResult = await searchMemory(questionText);
      
      if (memoryResult) {
        // Found in memory - return cached answer
        const aiMessage: Message = {
          id: `memory-${Date.now()}`,
          role: 'assistant',
          content: memoryResult.content.answer,
          subject: subject,
          created_at: new Date().toISOString(),
          sources: memoryResult.content.sources,
          fromMemory: true,
          memoryId: memoryResult.id,
          metadata: {
            ...memoryResult.content.metadata,
            from_memory: true,
            original_question: memoryResult.content.question,
            memory_created_at: memoryResult.created_at
          }
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: 'Answer from Memory',
          description: 'Found a similar question you asked before!',
          duration: 3000
        });
        
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
        
        fetchSessions();
        return;
      }

      // Step 2: Not in memory - use RAG pipeline
      let response = await api.aiTutoring.sendMessage({
        session_id: currentSession.id,
        user_id: user.id,
        content: questionText,
        subject: subject,
        message_type: 'text'
      });

      // Step 3: Check if RAG couldn't find content - fallback to direct Gemini query
      const content = response.ai_message?.content || '';
      const metadata = response.ai_message?.metadata as any || {};
      const isNoContentFound = content.includes("couldn't find relevant information") || 
                               content.includes("I couldn't find relevant information") ||
                               metadata.reason === "no_content_found" ||
                               (metadata.rag_used === false && metadata.confidence === 0);

      if (isNoContentFound) {
        try {
          const directResponse = await api.rag.queryDirect({
            query: questionText,
            subject: subject as any
          });
          
          if (directResponse.generated_text) {
            response = {
              ...response,
              ai_message: {
                ...response.ai_message!,
                content: directResponse.generated_text,
                metadata: {
                  ...(response.ai_message!.metadata as any || {}),
                  rag_used: false,
                  fallback_to_direct: true,
                  note: "Note: This answer is based on general knowledge as the specific topic wasn't found in the curriculum materials."
                } as any
              }
            };
          }
        } catch (fallbackError) {
          console.error('Direct query fallback failed:', fallbackError);
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
          sources: extractedSources.length > 0 ? extractedSources : undefined,
          sourcesCount: sourcesCount > 0 ? sourcesCount : undefined
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Step 4: Save to memory for future use
        const responseMetadata = response.ai_message.metadata as any || {};
        const memoryId = await saveToMemory(
          questionText,
          aiMessage.content,
          extractedSources,
          {
            rag_used: responseMetadata.rag_used,
            confidence: responseMetadata.confidence,
            fallback_to_direct: responseMetadata.fallback_to_direct,
            note: responseMetadata.note
          }
        );
        
        if (memoryId) {
          // Update the message with memory ID
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, memoryId }
              : msg
          ));
        }
        
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold">AI Tutor</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMemoryPanel(!showMemoryPanel)}
              className={cn(
                "h-8 w-8",
                showMemoryPanel && "bg-primary/10 text-primary"
              )}
            >
              <Database className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="geography">Geography</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={createNewSession} disabled={loading} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Memory Panel */}
        {showMemoryPanel && (
          <div className="p-4 border-b bg-muted/20">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Memory ({memoryItems.length})</span>
            </div>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {memoryItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-background border text-xs cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setInput(item.content.question);
                      setShowMemoryPanel(false);
                    }}
                  >
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(item.created_at)} • {item.subject}
                    </p>
                  </div>
                ))}
                {memoryItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No saved conversations yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Sessions List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors",
                  currentSession?.id === session.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                )}
                onClick={() => setCurrentSession(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {session.session_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.subject} • {formatDate(session.last_message_at || session.created_at)}
                    </p>
                  </div>
                  {session.is_active && (
                    <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentSession && (
              <>
                <div>
                  <h2 className="font-semibold">{currentSession.session_name}</h2>
                  <p className="text-sm text-muted-foreground">{currentSession.subject}</p>
                </div>
                {checkingMemory && (
                  <Badge variant="outline" className="text-xs">
                    <Search className="h-3 w-3 mr-1 animate-pulse" />
                    Checking memory...
                  </Badge>
                )}
              </>
            )}
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
              className={cn(
                "h-8 w-8",
                ttsEnabled && "bg-primary/10 text-primary"
              )}
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
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
                  Create a new chat to begin learning with your AI tutor. Your questions and answers are automatically saved for future reference.
                </p>
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
                      {memoryItems.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          I remember {memoryItems.length} previous conversation{memoryItems.length !== 1 ? 's' : ''} to help you better.
                        </p>
                      )}
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
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3",
                            message.role === 'student'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {message.role === 'assistant' && message.fromMemory && (
                            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                                <History className="h-3 w-3" />
                                <span className="font-medium">From Memory:</span> I found a similar question you asked before on {formatDate(message.metadata?.memory_created_at || '')}.
                              </p>
                            </div>
                          )}
                          
                          {message.role === 'assistant' && message.metadata?.fallback_to_direct && (
                            <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                              <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
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
                        
                        {/* Sources Display */}
                        {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                          <div className="mt-2 pt-3 border-t border-border/50 w-full">
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
                              {message.sources.map((source, idx) => {
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
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Badge variant="outline" className={`text-xs font-semibold h-5 ${sourceTypeColor}`}>
                                          {displayType}
                                        </Badge>
                                      </div>
                                      <p className="text-xs font-medium text-foreground truncate" title={displayChapter}>
                                        {displayChapter}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
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
                        <span className="text-sm">
                          {checkingMemory ? 'Checking memory...' : 'Thinking...'}
                        </span>
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
              <div className="relative flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask your AI tutor anything..."
                    disabled={loading}
                    className="min-h-[52px] rounded-2xl pr-16"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
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
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  AI can make mistakes. Check important info. • Memory: {memoryItems.length} saved conversations
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
    </div>
  );
}