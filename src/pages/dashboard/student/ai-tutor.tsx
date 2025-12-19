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
import { generateSessionId, generateSessionName, formatSessionNameForDisplay } from '@/utils/sessionNaming';
import { 
  Bot, 
  User, 
  Send, 
  Loader2, 
  Plus, 
  BookMarked,
  BookOpen,
  Brain,
  AlertCircle,
  Languages,
  Volume2,
  VolumeX,
  Lightbulb,
  Target,
  TrendingUp,
  Clock,
  FileText,
  Settings,
  Mic,
  Image as ImageIcon,
  Download,
  Save,
  Trash2,
  MoreVertical,
  Edit2,
  MessageSquare,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';


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

interface LearningInsights {
  strong_subjects?: string[];
  weak_subjects?: string[];
  preferred_learning_style?: string;
  learning_velocity?: number;
  recent_topics?: string[];
  knowledge_gaps?: string[];
  recommendations?: Array<{
    concept: string;
    difficulty: string;
    reason: string;
    priority: number;
  }>;
}

interface UserProgress {
  overall_progress?: number;
  subject_progress?: Record<string, number>;
  recent_achievements?: string[];
  learning_streak?: number;
  total_study_time?: number;
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
  const [ttsEnabled, setTtsEnabled] = useState(false);
  
  // Enhanced features state
  const [learningInsights, setLearningInsights] = useState<LearningInsights>({});
  const [userProgress, setUserProgress] = useState<UserProgress>({});
  const [enhancedSessionId, setEnhancedSessionId] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [todaysMicroplan, setTodaysMicroplan] = useState<any>(null);
  
  // Session management state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);


  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchSessions();
      
      // Defer enhanced data loading to not block initial render
      setTimeout(() => {
        loadEnhancedData();
      }, 100);
    }
    synthRef.current = window.speechSynthesis;
    return () => {};
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



  const loadEnhancedData = async () => {
    if (!user?.id) return;
    
    // Load enhanced features with individual error handling
    // Each feature is completely optional and won't affect core functionality
    
    // Load learning insights (optional)
    setTimeout(() => {
      api.enhancedAiTutor.getLearningInsights(user.id)
        .then(insights => {
          if (insights && insights.insights) {
            setLearningInsights(insights.insights);
          }
        })
        .catch(error => {
          console.warn('Learning insights not available:', error.message);
        });
    }, 500);

    // Load user progress (optional)
    setTimeout(() => {
      api.progress.getUserProgress({ user_id: user.id })
        .then(progress => {
          if (progress && !Array.isArray(progress)) {
            setUserProgress(progress);
          }
        })
        .catch(error => {
          console.warn('User progress not available:', error.message);
        });
    }, 700);

    // Load notifications (optional)
    setTimeout(() => {
      api.notifications.get(user.id)
        .then(notifs => {
          if (notifs && notifs.notifications) {
            setNotifications(notifs.notifications);
          }
        })
        .catch(error => {
          console.warn('Notifications not available:', error.message);
        });
    }, 900);

    // Load recent notes (optional)
    setTimeout(() => {
      api.notes.getAll(user.id, { limit: 3 })
        .then(notes => {
          if (notes && notes.notes) {
            setRecentNotes(notes.notes);
          }
        })
        .catch(error => {
          console.warn('Notes not available:', error.message);
        });
    }, 1100);

    // Load today's microplan (optional)
    setTimeout(() => {
      api.microplan.getToday(user.id)
        .then(microplan => {
          if (microplan) {
            setTodaysMicroplan(microplan);
          }
        })
        .catch(error => {
          console.warn('Microplan not available:', error.message);
        });
    }, 1300);

    // Create enhanced AI tutor session (optional)
    setTimeout(() => {
      api.enhancedAiTutor.createSession(user.id)
        .then(enhancedSession => {
          if (enhancedSession && enhancedSession.session_id) {
            setEnhancedSessionId(enhancedSession.session_id);
          }
        })
        .catch(error => {
          console.warn('Enhanced AI tutor not available:', error.message);
        });
    }, 1500);
  };

  const fetchSessions = async () => {
    if (!user?.id) return;
    
    // Load from localStorage first for instant UI
    try {
      const localSessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
      if (localSessions.length > 0) {
        const sortedSessions = localSessions.sort((a: Session, b: Session) => 
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
      }
    } catch (error) {
      console.warn('Failed to load sessions from localStorage:', error);
    }

    // Sync with server in background (optional)
    setTimeout(() => {
      api.aiTutoring.getSessions({
        user_id: user.id,
        limit: 50
      }).then(response => {
        const serverSessions = (response.sessions || []).sort((a: Session, b: Session) => 
          new Date(b.last_message_at || b.created_at).getTime() - 
          new Date(a.last_message_at || a.created_at).getTime()
        );
        
        // Merge server sessions with local sessions
        if (serverSessions.length > 0) {
          setSessions(serverSessions);
          localStorage.setItem('ai-tutor-sessions', JSON.stringify(serverSessions));
        }
      }).catch(error => {
        console.warn('Server sync not available:', error.message);
        // App works perfectly with local sessions only
      });
    }, 1000); // Delay to not block initial render
  };

  const fetchMessages = async (sessionId: string) => {
    // Load from localStorage first for instant display
    try {
      const localMessages = JSON.parse(localStorage.getItem(`ai-tutor-messages-${sessionId}`) || '[]');
      setMessages(localMessages);
    } catch (error) {
      console.warn('Failed to load messages from localStorage:', error);
      setMessages([]);
    }

    // Sync with server in background (optional)
    setTimeout(() => {
      api.aiTutoring.getSessionMessages(sessionId, 100)
        .then(response => {
          const serverMessages = response.messages || [];
          if (serverMessages.length > 0) {
            setMessages(serverMessages);
            localStorage.setItem(`ai-tutor-messages-${sessionId}`, JSON.stringify(serverMessages));
          }
        })
        .catch(error => {
          console.warn('Server sync not available:', error.message);
          // App works perfectly with local messages only
        });
    }, 500); // Delay to not block message display
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
      
      // Create session locally first for instant UI response
      const sessionName = generateSessionName(subject.trim() || 'General');
      const newSession: Session = {
        id: generateSessionId(subject.trim() || 'General'),
        session_name: sessionName,
        subject: subject.trim(),
        is_active: true,
        started_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Update UI immediately
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);

      // Save to localStorage
      const existingSessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
      const updatedSessions = [newSession, ...existingSessions];
      localStorage.setItem('ai-tutor-sessions', JSON.stringify(updatedSessions));

      toast({
        title: 'New Chat Created',
        description: 'Start chatting with your AI tutor!'
      });

      // Try to sync with backend in background (completely optional)
      setTimeout(() => {
        api.aiTutoring.createSession({
          user_id: user.id,
          session_name: newSession.session_name,
          subject: subject.trim()
        }).then(response => {
          // Update with server response if successful
          const serverSession = response.session;
          if (serverSession) {
            setSessions(prev => prev.map(s => 
              s.id === newSession.id ? { ...serverSession, id: newSession.id } : s
            ));
          }
        }).catch(error => {
          console.warn('Server sync not available:', error.message);
          // Session works perfectly without server
        });
      }, 2000); // Delay to not interfere with UI

    } catch (error: any) {
      console.error('Failed to create session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create session. Please try again.',
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
      // Get conversation context from memory
      let memoryContext = '';
      try {
        const relevantMemory = await api.memory.recall(user.id, {
          context_type: 'learning',
          subject: subject,
          limit: 3,
          days_back: 30,
          min_importance: 0.6
        });

        if (relevantMemory.contexts && relevantMemory.contexts.length > 0) {
          const memoryItems = relevantMemory.contexts
            .map((ctx: any) => {
              const content = ctx.content;
              if (content.question && content.answer) {
                return `Previous Q&A: Q: ${content.question.substring(0, 100)}... A: ${content.answer.substring(0, 150)}...`;
              }
              return null;
            })
            .filter(Boolean)
            .slice(0, 2);

          if (memoryItems.length > 0) {
            memoryContext = `\n\nRelevant previous context:\n${memoryItems.join('\n')}`;
          }
        }
      } catch (error) {
        console.warn('Failed to load memory context:', error);
      }

      // Try enhanced AI tutor first with memory integration
      let finalResponse: any = null;
      let responseSource = 'enhanced_tutor';
      let confidence = 0;

      try {
        if (enhancedSessionId) {
          const enhancedResponse = await api.enhancedAiTutor.sendMessage(
            enhancedSessionId,
            questionText,
            { subject, context: memoryContext }
          );
          
          finalResponse = {
            content: enhancedResponse.generated_text || enhancedResponse.answer || enhancedResponse.content,
            sources: enhancedResponse.sources || [],
            metadata: {
              enhanced_tutor_used: true,
              memory_enhanced: true,
              confidence: enhancedResponse.confidence || 0.8,
              sources_count: enhancedResponse.sources?.length || 0
            }
          };
          confidence = enhancedResponse.confidence || 0.8;
        } else {
          throw new Error('No enhanced session available');
        }
      } catch (error) {
        console.warn('Enhanced AI tutor failed, using RAG fallback:', error);
        
        // Fallback to RAG Pipeline
        const ragResponse = await api.rag.queryDirect({
          query: questionText,
          subject: subject
        }).catch(err => {
          console.warn('RAG query failed, using offline system:', err);
          return api.rag.offlineQuery({
            query: questionText,
            subject: subject,
            top_k: 8,
            confidence_threshold: 0.2
          });
        });

        responseSource = 'rag';
        
        if (ragResponse) {
          const ragConfidence = ragResponse.confidence || 0;
          const hasGoodContent = ragResponse.answer || ragResponse.generated_text;
          
          if (hasGoodContent && !ragResponse.metadata?.no_content_available) {
            finalResponse = {
              content: ragResponse.generated_text || ragResponse.answer,
              sources: ragResponse.sources || [],
              metadata: {
                rag_used: true,
                confidence: ragConfidence,
                sources_count: ragResponse.sources?.length || 0,
                processing_time: ragResponse.metadata?.processing_time,
                offline_mode: ragResponse.metadata?.offline_mode,
                rag_match_found: ragResponse.metadata?.rag_match_found
              }
            };
            confidence = ragConfidence;
          }
        }
      }

      // If no response, provide helpful offline response
      if (!finalResponse) {
        finalResponse = {
          content: `I understand you're asking about "${questionText}". While I'm currently working in offline mode, I can still help you! 

Here are some general approaches to this topic:

1. **Break down the concept**: Try to identify the key components or parts of what you're asking about.

2. **Look for patterns**: See if this relates to other concepts you've learned in ${subject}.

3. **Practice examples**: Try working through similar problems or examples.

4. **Connect ideas**: Think about how this concept connects to other topics in your subject.

Would you like to rephrase your question or ask about a specific aspect? I'm here to help guide your learning process!`,
          sources: [],
          metadata: {
            offline_mode: true,
            helpful_response: true,
            confidence: 0.6
          }
        };
        confidence = 0.6;
      }

      // Create AI message
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: finalResponse.content,
        subject: subject,
        created_at: new Date().toISOString(),
        sources: finalResponse.sources?.length > 0 ? finalResponse.sources : undefined,
        sourcesCount: finalResponse.sources?.length || 0,
        metadata: {
          ...finalResponse.metadata,
          response_source: responseSource,
          final_confidence: confidence,
          processing_timestamp: new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-rename session based on first message
      if (currentSession && messages.length === 0) {
        const smartName = generateSmartSessionName(questionText);
        if (smartName !== currentSession.session_name && smartName !== 'GEN') {
          await handleRenameSession(currentSession.id, smartName);
        }
      }

      // Store interaction in memory for future context
      try {
        await api.memory.remember(user.id, {
          type: 'learning',
          content: {
            question: questionText,
            answer: finalResponse.content,
            subject: subject,
            confidence: confidence,
            sources: finalResponse.sources,
            timestamp: new Date().toISOString(),
            response_source: responseSource,
            session_id: enhancedSessionId || currentSession.id
          },
          subject: subject,
          topic: questionText.length > 50 ? questionText.substring(0, 50) + '...' : questionText,
          importance: Math.min(0.9, 0.5 + (finalResponse.content.length / 2000)),
          tags: [subject, 'ai_tutor', 'qa_pair', responseSource],
          source: 'ai_tutor_chat',
          session_id: enhancedSessionId || currentSession.id,
          component: 'AITutorPage'
        });

        // Update knowledge graph with concepts (in background, non-blocking)
        const extractedConcepts = extractConceptsFromText(finalResponse.content, subject);
        if (extractedConcepts.length > 0) {
          // Run knowledge graph updates in background without blocking UI
          Promise.all(
            extractedConcepts.slice(0, 3).map(async (concept) => {
              try {
                await api.knowledgeGraph.createConcept(concept);
                await api.knowledgeGraph.updateProgress(user.id, concept, Math.min(0.9, 0.3 + confidence * 0.6));
              } catch (error) {
                console.warn(`Failed to update knowledge graph for concept "${concept}":`, error);
              }
            })
          ).catch(error => {
            console.warn('Knowledge graph batch update failed:', error);
          });
        }
      } catch (error) {
        console.warn('Failed to store interaction in memory:', error);
      }

      // Update session in localStorage
      const sessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
      const sessionIndex = sessions.findIndex((s: any) => s.id === currentSession.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex].last_message_at = new Date().toISOString();
        localStorage.setItem('ai-tutor-sessions', JSON.stringify(sessions));
      }

      // Save messages to localStorage
      const existingMessages = JSON.parse(localStorage.getItem(`ai-tutor-messages-${currentSession.id}`) || '[]');
      existingMessages.push(userMessage, aiMessage);
      localStorage.setItem(`ai-tutor-messages-${currentSession.id}`, JSON.stringify(existingMessages));

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
    } catch (error: any) {
      console.error('Error in handleSend:', error);
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

  const extractConceptsFromText = (text: string, subject: string): string[] => {
    const concepts: string[] = [];
    
    const conceptPatterns: Record<string, RegExp[]> = {
      physics: [
        /\b(force|energy|momentum|velocity|acceleration|gravity|friction|pressure|temperature|heat|light|sound|electricity|magnetism|current|voltage|resistance|power|work|motion|wave|frequency|amplitude)\b/gi,
        /\b(newton|joule|watt|volt|ampere|ohm|pascal|kelvin|celsius|fahrenheit|hertz)\b/gi
      ],
      mathematics: [
        /\b(equation|function|derivative|integral|limit|matrix|vector|polynomial|logarithm|exponential|trigonometry|geometry|algebra|calculus|statistics|probability)\b/gi,
        /\b(sine|cosine|tangent|pi|infinity|theorem|proof|formula|variable|constant)\b/gi
      ],
      chemistry: [
        /\b(atom|molecule|element|compound|reaction|bond|electron|proton|neutron|ion|acid|base|salt|catalyst|oxidation|reduction|equilibrium|solution|concentration)\b/gi,
        /\b(hydrogen|oxygen|carbon|nitrogen|sodium|chlorine|periodic table|valence|isotope)\b/gi
      ],
      biology: [
        /\b(cell|DNA|RNA|protein|enzyme|gene|chromosome|mitosis|meiosis|photosynthesis|respiration|evolution|species|organism|tissue|organ|system)\b/gi,
        /\b(bacteria|virus|plant|animal|ecosystem|biodiversity|adaptation|mutation)\b/gi
      ]
    };

    const patterns = conceptPatterns[subject.toLowerCase()] || [];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const concept = match.toLowerCase().trim();
          if (concept.length > 2 && !concepts.includes(concept)) {
            concepts.push(concept);
          }
        });
      }
    });

    return concepts.slice(0, 8);
  };

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Not supported',
        description: 'Voice input is not supported in your browser',
        variant: 'destructive'
      });
      return;
    }

    setIsListening(true);
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = selectedLanguage === 'en' ? 'en-US' : selectedLanguage;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      inputRef.current?.focus();
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: 'Error',
        description: 'Voice recognition failed. Please try again.',
        variant: 'destructive'
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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

  // Generate smart session name from first message using first 3 letters
  const generateSmartSessionName = (firstMessage: string): string => {
    if (!firstMessage || firstMessage.trim() === '') {
      return 'GEN';
    }
    
    return generateSessionName(firstMessage);
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Remove from local storage
      const sessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
      const updatedSessions = sessions.filter((s: any) => s.id !== sessionId);
      localStorage.setItem('ai-tutor-sessions', JSON.stringify(updatedSessions));
      
      // Remove messages
      localStorage.removeItem(`ai-tutor-messages-${sessionId}`);
      
      // Update state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If deleting current session, switch to another or clear
      if (currentSession?.id === sessionId) {
        const remainingSessions = sessions.filter((s: any) => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSession(remainingSessions[0]);
        } else {
          setCurrentSession(null);
          setMessages([]);
        }
      }
      
      toast({
        title: 'Session deleted',
        description: 'Chat session has been removed successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete session. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Rename session
  const handleRenameSession = async (sessionId: string, newName: string) => {
    try {
      const sessions = JSON.parse(localStorage.getItem('ai-tutor-sessions') || '[]');
      const updatedSessions = sessions.map((s: any) => 
        s.id === sessionId ? { ...s, session_name: newName } : s
      );
      localStorage.setItem('ai-tutor-sessions', JSON.stringify(updatedSessions));
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, session_name: newName } : s
      ));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, session_name: newName } : null);
      }
      
      setEditingSessionId(null);
      setEditingSessionName('');
      
      toast({
        title: 'Session renamed',
        description: 'Chat session has been renamed successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rename session. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Start editing session name
  const startEditingSession = (session: Session) => {
    setEditingSessionId(session.id);
    setEditingSessionName(session.session_name);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  // Confirm delete
  const confirmDelete = (sessionId: string) => {
    setDeletingSessionId(sessionId);
    setShowDeleteDialog(true);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Enhanced Sidebar */}
      <div className="w-80 min-w-80 max-w-80 border-r bg-card flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Tutor</h1>
                <p className="text-xs text-muted-foreground">Enhanced with Memory</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="bg-background/50 border-primary/20">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mathematics">📐 Mathematics</SelectItem>
                <SelectItem value="physics">⚛️ Physics</SelectItem>
                <SelectItem value="chemistry">🧪 Chemistry</SelectItem>
                <SelectItem value="biology">🧬 Biology</SelectItem>
                <SelectItem value="english">📚 English</SelectItem>
                <SelectItem value="history">🏛️ History</SelectItem>
                <SelectItem value="geography">🌍 Geography</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={createNewSession} 
              disabled={loading} 
              className="w-full bg-primary hover:bg-primary/90 shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Chat
            </Button>
          </div>
        </div>



        {/* Enhanced Sidebar Content */}
        <Tabs defaultValue="sessions" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 bg-muted/30">
            <TabsTrigger value="sessions" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              💬 Chats
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              📊 Insights
            </TabsTrigger>
            <TabsTrigger value="tools" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              🛠️ Tools
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="flex-1 mt-2 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative rounded-lg transition-all duration-200 border",
                      currentSession?.id === session.id
                        ? "bg-primary/10 border-primary/20 shadow-sm"
                        : "border-transparent hover:bg-muted/70 hover:border-border/50 hover:shadow-sm"
                    )}
                  >
                    {editingSessionId === session.id ? (
                      // Editing mode
                      <div className="p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingSessionName}
                            onChange={(e) => setEditingSessionName(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Session name..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameSession(session.id, editingSessionName);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleRenameSession(session.id, editingSessionName)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Normal display mode
                      <div
                        className="p-3 cursor-pointer"
                        onClick={() => setCurrentSession(session)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 mt-0.5">
                              <MessageSquare className={cn(
                                "h-4 w-4",
                                currentSession?.id === session.id 
                                  ? "text-primary" 
                                  : "text-muted-foreground"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium text-sm truncate leading-tight",
                                currentSession?.id === session.id 
                                  ? "text-primary" 
                                  : "text-foreground"
                              )}>
                                {formatSessionNameForDisplay(session.session_name)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs px-1.5 py-0.5 h-5 font-normal"
                                >
                                  {session.subject}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(session.last_message_at || session.created_at)}
                                </span>
                                {(() => {
                                  const sessionMessages = JSON.parse(localStorage.getItem(`ai-tutor-messages-${session.id}`) || '[]');
                                  const messageCount = sessionMessages.length;
                                  return messageCount > 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                      • {messageCount} msg{messageCount !== 1 ? 's' : ''}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action menu */}
                          <div className="flex items-center gap-1">
                            {session.is_active && (
                              <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingSession(session);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDelete(session.id);
                                  }}
                                  className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {sessions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium mb-1">No conversations yet</p>
                    <p className="text-xs">Start a new chat to begin learning</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="insights" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Learning Progress */}
                {userProgress.overall_progress !== undefined && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Overall Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={userProgress.overall_progress} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {userProgress.overall_progress}% complete
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Learning Insights */}
                {learningInsights.strong_subjects && learningInsights.strong_subjects.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Strong Subjects
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {learningInsights.strong_subjects.map((subject, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {learningInsights.recommendations && learningInsights.recommendations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {learningInsights.recommendations.slice(0, 3).map((rec, idx) => (
                          <div key={idx} className="text-xs">
                            <p className="font-medium">{rec.concept.replace(/_/g, ' ')}</p>
                            <p className="text-muted-foreground">{rec.reason}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Today's Microplan */}
                {todaysMicroplan && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Today's Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs font-medium">{todaysMicroplan.concept_summary?.topic_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {todaysMicroplan.concept_summary?.summary?.substring(0, 100)}...
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Notes */}
                {recentNotes.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Recent Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {recentNotes.map((note, idx) => (
                          <div key={idx} className="text-xs">
                            <p className="font-medium truncate">{note.title}</p>
                            <p className="text-muted-foreground">{note.subject}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="tools" className="flex-1 mt-2">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Notes
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Chat
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Save className="h-4 w-4 mr-2" />
                  Save Session
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
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
                        Ask me anything about {subject} based on your curriculum materials!
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
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3",
                            message.role === 'student'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {message.role === 'assistant' && message.metadata?.response_source === 'rag' && (
                            <div className="mb-2 p-2 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                              <p className="text-xs flex items-center gap-1.5 text-green-700 dark:text-green-300">
                                <BookMarked className="h-3 w-3" />
                                <span className="font-medium">RAG Response:</span> 
                                {message.metadata.offline_mode ? 'Enhanced offline knowledge' : 'Found in uploaded materials'}
                                {message.metadata.final_confidence && message.metadata.final_confidence > 0.1 && (
                                  <span className="ml-1">({Math.round(message.metadata.final_confidence * 100)}% confidence)</span>
                                )}
                              </p>
                            </div>
                          )}
                          
                          {message.role === 'assistant' && message.metadata?.no_content_found && (
                            <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1.5">
                                <AlertCircle className="h-3 w-3" />
                                <span className="font-medium">No Content Found:</span> This topic wasn't found in the curriculum materials
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
                    <div className="bg-muted rounded-2xl px-4 py-3 min-w-[200px]">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm font-medium">Processing your question...</span>
                        </div>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <BookMarked className="h-3 w-3" />
                            <span>Searching curriculum materials</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Brain className="h-3 w-3" />
                            <span>Generating response</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Enhanced Input Area */}
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
                    placeholder="Ask me anything about your subjects..."
                    disabled={loading}
                    className="min-h-[52px] rounded-2xl pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleVoiceInput}
                      disabled={isListening || loading}
                      title="Voice input"
                    >
                      {isListening ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
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
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Enhanced AI tutor with memory</span>
                  <div className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    <span>Memory-enhanced responses</span>
                  </div>
                  {enhancedSessionId ? (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Enhanced mode active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Offline mode</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>AI Tutor Settings</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Text-to-Speech</label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTtsEnabled(!ttsEnabled)}
                          >
                            {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Input Language</label>
                          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger>
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
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat session? This action cannot be undone and all messages in this conversation will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setDeletingSessionId(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSessionId) {
                  handleDeleteSession(deletingSessionId);
                }
                setShowDeleteDialog(false);
                setDeletingSessionId(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}