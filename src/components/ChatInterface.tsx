import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Loader2, Mic, MicOff, Languages, ChevronRight, ChevronLeft, Eye, BookOpen, X, Lightbulb, Download, Save, FileText, Brain, Calculator, ClipboardList, Calendar, BookMarked, Sparkles, Image as ImageIcon, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MCQQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string; // 'A', 'B', 'C', or 'D'
  explanation: string;
}

interface Formula {
  name: string;
  formula: string; // Mathematical formula in standard notation
  wolfram_query?: string; // Wolfram Alpha formatted query (ready to use)
  type?: string; // formula|equation|calculation|derivative|integral|plot
  description?: string;
  graphUrl?: string; // Wolfram graph URL
}

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
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  subject?: string;
  suggestedActions?: string[]; // AI-suggested action buttons
  mcqQuestions?: MCQQuestion[]; // Structured MCQ questions
  formulas?: Formula[]; // Structured formulas with graphs
  sources?: Source[]; // RAG sources used for the response
  sourcesCount?: number; // Total number of sources/context sections
  answerData?: {
    answer?: string;
    explanation?: string;
    examples?: string[] | any[];
    step_by_step?: Array<{
      step_number?: number;
      description?: string;
      content?: string;
      source?: string;
      step?: string;
      reasoning?: string;
    }>;
    practice_suggestions?: string[] | any[];
    common_mistakes?: string[] | any[];
    connections?: string[] | any[];
    visual_aids?: Array<{
      type?: string;
      description?: string;
      url?: string;
    }>;
    teaching_tips?: string[] | string;
  };
  wolframUsed?: boolean;
  wolframResult?: {
    answer?: string;
    solution?: string;
    steps?: Array<{ title: string; content: string }>;
    input_interpretation?: string;
    plots?: Array<{ 
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

interface ChatInterfaceProps {
  userId: string;
  defaultSubject?: string;
}

// Component to render markdown with LaTeX support
const MarkdownWithLatex = ({ content }: { content: string }) => {
  // Process content to render LaTeX formulas
  const processContent = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Match block math ($$...$$) first
    const blockMathRegex = /\$\$([^$]+)\$\$/g;
    let blockMatch;
    const blockMatches: Array<{ start: number; end: number; formula: string }> = [];
    
    while ((blockMatch = blockMathRegex.exec(text)) !== null) {
      blockMatches.push({
        start: blockMatch.index,
        end: blockMatch.index + blockMatch[0].length,
        formula: blockMatch[1].trim()
      });
    }
    
    // Process text with block math
    blockMatches.forEach((match, idx) => {
      // Add text before block math
      if (match.start > lastIndex) {
        const beforeText = text.substring(lastIndex, match.start);
        result.push(<ReactMarkdown key={`text-${idx}`} remarkPlugins={[remarkGfm]} components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{processInlineMath(String(children))}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{processInlineMath(String(children))}</li>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <code className={className} {...props}>{children}</code>
            ) : (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
            );
          },
          pre: ({ children }) => <pre className="bg-muted p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
          strong: ({ children }) => <strong className="font-semibold">{processInlineMath(children)}</strong>,
          em: ({ children }) => <em className="italic">{processInlineMath(children)}</em>,
          h1: ({ children }) => <h1 className="text-lg font-semibold mt-4 mb-2">{processInlineMath(children)}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{processInlineMath(children)}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{processInlineMath(children)}</h3>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/50 pl-4 italic my-2">{processInlineMath(children)}</blockquote>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
        }}>{beforeText}</ReactMarkdown>);
      }
      // Add block math
      result.push(
        <div key={`block-${idx}`} className="my-3 text-center">
          <BlockMath math={match.formula} />
        </div>
      );
      lastIndex = match.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      result.push(<ReactMarkdown key="text-final" remarkPlugins={[remarkGfm]} components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{processInlineMath(children)}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="ml-2">{processInlineMath(children)}</li>,
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <code className={className} {...props}>{children}</code>
          ) : (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
          );
        },
        pre: ({ children }) => <pre className="bg-muted p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
        strong: ({ children }) => <strong className="font-semibold">{processInlineMath(children)}</strong>,
        em: ({ children }) => <em className="italic">{processInlineMath(children)}</em>,
        h1: ({ children }) => <h1 className="text-lg font-semibold mt-4 mb-2">{processInlineMath(children)}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{processInlineMath(children)}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{processInlineMath(children)}</h3>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/50 pl-4 italic my-2">{processInlineMath(children)}</blockquote>,
        a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
      }}>{remainingText}</ReactMarkdown>);
    }
    
    return result.length > 0 ? result : [<ReactMarkdown key="default" remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>];
  };
  
  // Helper to extract text content from React nodes
  const extractText = (children: React.ReactNode): string => {
    if (typeof children === 'string') {
      return children;
    }
    if (typeof children === 'number') {
      return String(children);
    }
    if (typeof children === 'boolean') {
      return String(children);
    }
    if (children === null || children === undefined) {
      return '';
    }
    if (Array.isArray(children)) {
      return children.map(extractText).join('');
    }
    if (children && typeof children === 'object') {
      // If it's a React element, extract from props
      if ('props' in children) {
        return extractText((children as any).props?.children || '');
      }
      // If it's a plain object, try to extract meaningful text
      const obj = children as any;
      if (obj.text) return String(obj.text);
      if (obj.content) return String(obj.content);
      if (obj.description) return String(obj.description);
      if (obj.name) return String(obj.name);
      // Avoid "[object Object]" by returning empty string or trying JSON.stringify
      try {
        const json = JSON.stringify(obj);
        // If JSON is too long or not meaningful, return empty
        if (json.length > 200) return '';
        return json;
      } catch {
        return '';
      }
    }
    return '';
  };

  // Helper to process inline math ($...$)
  const processInlineMath = (children: React.ReactNode): React.ReactNode[] => {
    const text = extractText(children);
    const parts = text.split(/(\$[^$\n]+\$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('$') && part.endsWith('$') && !part.includes('\n')) {
        return <InlineMath key={idx} math={part.slice(1, -1).trim()} />;
      }
      return <span key={idx}>{part}</span>;
    });
  };
  
  return <div>{processContent(content)}</div>;
};

export function ChatInterface({ userId, defaultSubject = 'mathematics' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [isListening, setIsListening] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);
  // Track current step index for each message (messageId -> stepIndex)
  const [currentStepIndex, setCurrentStepIndex] = useState<Record<string, number>>({});
  // Track if user wants to see all steps at once for each message
  const [showAllSteps, setShowAllSteps] = useState<Record<string, boolean>>({});
  const [showStudyGuide, setShowStudyGuide] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, Record<number, string>>>({}); // messageId -> questionIndex -> selectedAnswer
  const [showMcqAnswers, setShowMcqAnswers] = useState<Record<string, boolean>>({}); // messageId -> show answers
  const [selectedPlot, setSelectedPlot] = useState<{ url: string; title: string; description?: string } | null>(null);
  const [wolframViewMode, setWolframViewMode] = useState<Record<string, 'extracted' | 'embedded'>>({}); // messageId -> view mode
  const [wolframEmbedUrl, setWolframEmbedUrl] = useState<Record<string, string>>({}); // messageId -> embed URL
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Helper function to safely convert any value to a string
  const safeToString = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      // If it's an object with a text or content property, use that
      if (value.text) return String(value.text);
      if (value.content) return String(value.content);
      if (value.description) return String(value.description);
      // Otherwise stringify it
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI tutor powered by Gemini AI and Wolfram Alpha. I can help you:\n\n✨ Understand concepts with detailed explanations\n🧮 Solve math problems with step-by-step solutions\n📚 Connect ideas across different topics\n💡 Learn through examples and practice\n\nAsk me anything about your subjects - I\'m here to teach, not just answer!',
      timestamp: new Date(),
      suggestedActions: ['Save'] // Welcome message only needs Save
    }]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  }, [messages]);

  useEffect(() => {
    // Auto-scroll when step changes
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  }, [currentStepIndex, showAllSteps]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      subject,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const questionText = input;
    setInput('');
    setLoading(true);

    // Create placeholder assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      subject,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);

    try {
      // Get conversation context (last few messages)
      const context = messages
        .slice(-3)
        .map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`)
        .join('\n');

      // Get response from API
      const fullResponse = await api.aiTutoring.answerQuestion({
        user_id: userId,
        question: questionText,
        subject: subject as any,
        context: context || undefined
      });

      // Get answer content - prefer answer field, fallback to explanation
      // Safely convert to string to avoid "[object Object]" issues
      let answerContent = safeToString(fullResponse.answer?.answer) || 
                         safeToString(fullResponse.answer?.explanation) || 
                         'I apologize, but I couldn\'t generate a response. Please try again.';
      
      // If we have step_by_step, include a summary
      if (fullResponse.answer?.step_by_step) {
        if (Array.isArray(fullResponse.answer.step_by_step) && fullResponse.answer.step_by_step.length > 0) {
          const stepCount = fullResponse.answer.step_by_step.length;
          answerContent = `${answerContent}\n\n📚 I've provided a ${stepCount}-step solution below to help you understand the process.`;
        } else if (typeof fullResponse.answer.step_by_step === 'string') {
          answerContent = `${answerContent}\n\n📚 I've provided a step-by-step solution below to help you understand the process.`;
        }
      }
      
      // Display text incrementally (simulated streaming)
      if (answerContent) {
        const words = answerContent.split(' ');
        let currentText = '';
        
        for (let i = 0; i < words.length; i++) {
          currentText += (i > 0 ? ' ' : '') + words[i];
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: currentText }
              : msg
          ));
          
          // Small delay to simulate streaming (30ms per word)
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
      
      // Translate response if target language is set
      if (targetLanguage && targetLanguage !== 'en' && answerContent) {
        try {
          const translated = await api.translation.translate({
            text: answerContent,
            target_language: targetLanguage,
            source_language: 'en'
          });
          answerContent = translated.translated_text;
          // Update message with translated content
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: answerContent }
              : msg
          ));
        } catch (error) {
          console.error('Translation failed:', error);
        }
      }

      // Safely normalize answerData to ensure arrays are arrays
      const normalizeAnswerData = (data: any) => {
        if (!data) return undefined;
        const normalized: any = { ...data };
        
        // Ensure arrays are actually arrays
        if (normalized.step_by_step && !Array.isArray(normalized.step_by_step)) {
          normalized.step_by_step = normalized.step_by_step;
        }
        if (normalized.examples && !Array.isArray(normalized.examples)) {
          normalized.examples = typeof normalized.examples === 'string' 
            ? [normalized.examples] 
            : Array.isArray(normalized.examples) ? normalized.examples : [];
        }
        if (normalized.practice_suggestions && !Array.isArray(normalized.practice_suggestions)) {
          normalized.practice_suggestions = typeof normalized.practice_suggestions === 'string' 
            ? [normalized.practice_suggestions] 
            : Array.isArray(normalized.practice_suggestions) ? normalized.practice_suggestions : [];
        }
        if (normalized.common_mistakes && !Array.isArray(normalized.common_mistakes)) {
          normalized.common_mistakes = typeof normalized.common_mistakes === 'string' 
            ? [normalized.common_mistakes] 
            : Array.isArray(normalized.common_mistakes) ? normalized.common_mistakes : [];
        }
        if (normalized.connections && !Array.isArray(normalized.connections)) {
          normalized.connections = typeof normalized.connections === 'string' 
            ? [normalized.connections] 
            : Array.isArray(normalized.connections) ? normalized.connections : [];
        }
        if (normalized.teaching_tips && !Array.isArray(normalized.teaching_tips)) {
          normalized.teaching_tips = normalized.teaching_tips;
        }
        
        return normalized;
      };

      // Get AI-suggested actions for this response (run in parallel, don't block)
      let suggestedActions: string[] = [];
      const analyzeActions = async () => {
        try {
          const actionResponse = await api.aiTutoring.answerQuestion({
            user_id: userId,
            question: `Analyze this educational content and suggest which action buttons would be most useful. Available actions: "Fetch Formulas", "Create Flashcards", "Create Notes", "Save", "Download", "Generate MCQ".\n\nRespond with ONLY a JSON array like: ["Fetch Formulas", "Create Flashcards", "Save"]. Choose 2-4 most relevant actions.\n\nContent preview:\n${answerContent.substring(0, 300)}`,
            subject: subject as any,
            context: 'Return JSON array of action names only, no other text.'
          });

          // Try to parse suggested actions from response
          const actionText = actionResponse.answer?.answer || actionResponse.answer?.explanation || '';
          const jsonMatch = actionText.match(/\[.*?\]/);
          if (jsonMatch) {
            try {
              suggestedActions = JSON.parse(jsonMatch[0]);
            } catch {
              // Fallback: check for action names in text
              const actionNames = ['Fetch Formulas', 'Create Flashcards', 'Create Notes', 'Save', 'Download', 'Generate MCQ'];
              suggestedActions = actionNames.filter(action => 
                actionText.toLowerCase().includes(action.toLowerCase().substring(0, 10))
              );
            }
          }
        } catch (error) {
          console.error('Error getting suggested actions:', error);
        }
      };

      // Intelligent fallback based on content analysis (faster than waiting for AI)
      const contentLower = answerContent.toLowerCase();
      const hasFormulas = contentLower.includes('formula') || contentLower.includes('equation') || 
                         contentLower.match(/[a-z]\s*=\s*[a-z]/) || contentLower.includes('solve');
      const hasConcepts = contentLower.includes('concept') || contentLower.includes('definition') || 
                         contentLower.includes('term') || contentLower.includes('meaning');
      const isLongContent = answerContent.length > 200;
      const hasQuestions = contentLower.includes('question') || contentLower.includes('problem') || 
                          contentLower.includes('example') || fullResponse.answer?.step_by_step;

      // Set intelligent defaults
      if (hasFormulas) suggestedActions.push('Fetch Formulas');
      if (hasConcepts) suggestedActions.push('Create Flashcards');
      if (isLongContent) suggestedActions.push('Create Notes');
      if (hasQuestions) suggestedActions.push('Generate MCQ');
      suggestedActions.push('Save', 'Download'); // Always include these

      // Run AI analysis in background and update if it provides better suggestions
      analyzeActions().then(() => {
        if (suggestedActions.length > 0) {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, suggestedActions: suggestedActions }
              : msg
          ));
        }
      }).catch(() => {
        // If AI analysis fails, keep the intelligent defaults
      });

      // Extract sources from response
      let extractedSources: Source[] = [];
      let sourcesCount = 0;
      
      // Try to get sources from response metadata or RAG response
      if (fullResponse.sources && Array.isArray(fullResponse.sources)) {
        extractedSources = fullResponse.sources;
        sourcesCount = fullResponse.sources.length;
      } else if (fullResponse.metadata?.sources && Array.isArray(fullResponse.metadata.sources)) {
        extractedSources = fullResponse.metadata.sources;
        sourcesCount = fullResponse.metadata.sources.length;
      } else if (fullResponse.metadata?.chunks_retrieved) {
        sourcesCount = fullResponse.metadata.chunks_retrieved;
      }
      
      // Parse sources from content if embedded
      if (answerContent) {
        // Match patterns like "Based on X relevant content sections"
        const sectionCountMatch = answerContent.match(/Based on (\d+) relevant content section/i);
        if (sectionCountMatch) {
          const count = parseInt(sectionCountMatch[1], 10);
          if (count > sourcesCount) {
            sourcesCount = count;
          }
        }
        
        // Extract source lines - look for patterns like:
        // "ncert - battery"
        // "Sources: ncert - battery"
        const sourceLines: string[] = [];
        const lines = answerContent.split('\n');
        
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          
          // Check if line is a source pattern (type - chapter/topic)
          const sourcePattern = /^(\w+)\s*-\s*([^-]+)$/i;
          const match = trimmedLine.match(sourcePattern);
          
          if (match) {
            const [, type, chapter] = match;
            // Only consider if it looks like a source (not part of sentence)
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
                } else {
                  // Increment count for duplicate sources
                  const existing = uniqueSources.get(key)!;
                  // We'll handle counting in display component
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
        
        // Clean answer content - remove source lines if they were embedded
        if (sourceLines.length > 0) {
          // Remove the "Sources:" header if present
          answerContent = answerContent
            .split('\n')
            .filter(line => {
              const trimmed = line.trim();
              // Remove lines that match source patterns
              const isSourceLine = /^(\w+)\s*-\s*([^-]+)$/i.test(trimmed);
              const isSourceHeader = /^Sources?:\s*$/i.test(trimmed);
              return !isSourceLine && !isSourceHeader;
            })
            .join('\n')
            .trim();
          
          // Also remove "Based on X relevant content sections" if it's a standalone line
          answerContent = answerContent.replace(/^\s*Based on \d+ relevant content sections? from the curriculum\.?\s*$/gmi, '').trim();
        }
      }

      // Update the message with full data after streaming completes
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? {
              ...msg,
              content: answerContent || msg.content,
              answerData: normalizeAnswerData(fullResponse.answer),
              wolframUsed: fullResponse.wolfram_used || false,
              wolframResult: fullResponse.wolfram_result || undefined,
              suggestedActions: suggestedActions,
              sources: extractedSources.length > 0 ? extractedSources : undefined,
              sourcesCount: sourcesCount > 0 ? sourcesCount : undefined
            }
          : msg
      ));

      // Initialize step tracking for this message if it has steps
      const normalizedData = normalizeAnswerData(fullResponse.answer);
      if (normalizedData?.step_by_step && Array.isArray(normalizedData.step_by_step) && normalizedData.step_by_step.length > 0) {
        setCurrentStepIndex(prev => ({
          ...prev,
          [assistantMessageId]: 0
        }));
        setShowAllSteps(prev => ({
          ...prev,
          [assistantMessageId]: false
        }));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get answer. Please try again.',
        variant: 'destructive'
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: 'I apologize, but I encountered an error. Please try rephrasing your question.' }
          : msg
      ));
    } finally {
      setLoading(false);
      setStreamingMessageId(null);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
    recognition.lang = 'en-US';

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

  const handleTranslateInput = async () => {
    if (!input.trim()) return;

    try {
      const detected = await api.translation.detectLanguage(input);
      if (detected.detected_language !== 'en') {
        const translated = await api.translation.translate({
          text: input,
          target_language: 'en',
          source_language: detected.detected_language
        });
        setInput(translated.translated_text);
        toast({
          title: 'Translated',
          description: `Translated from ${detected.detected_language.toUpperCase()}`
        });
      } else {
        toast({
          title: 'Already in English',
          description: 'Your text is already in English'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Translation failed',
        description: error.message || 'Could not translate input',
        variant: 'destructive'
      });
    }
  };

  // Handle copying all formulas to clipboard
  const handleTakeAllFormulas = async (formulas: Formula[]) => {
    try {
      if (formulas.length === 0) {
        toast({
          title: "No Formulas Found",
          description: "No formulas available to copy.",
          variant: "default",
        });
        return;
      }

      // Format all formulas for copying with Wolfram queries
      const formulasText = formulas.map((formula, index) => {
        let text = `\n${'='.repeat(60)}\n`;
        text += `${index + 1}. ${formula.name || `Formula ${index + 1}`}`;
        if (formula.type) {
          text += ` (${formula.type})`;
        }
        text += `\n${'='.repeat(60)}\n`;
        
        // Formula in standard notation
        if (formula.formula) {
          text += `\nFormula: ${formula.formula}`;
        }
        
        // Wolfram-formatted query (ready to paste)
        if (formula.wolfram_query) {
          text += `\n\nWolfram Alpha Query:\n${formula.wolfram_query}`;
        }
        
        // Description
        if (formula.description) {
          text += `\n\nDescription: ${formula.description}`;
        }
        
        return text;
      }).join('\n\n');

      // Add header
      const header = `FORMULAS EXTRACTED\n${'='.repeat(60)}\n`;
      const fullText = header + formulasText;

      // Copy to clipboard
      await navigator.clipboard.writeText(fullText);
      
      toast({
        title: "Formulas Copied!",
        description: `${formulas.length} formula(s) copied to clipboard with Wolfram Alpha queries.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to copy formulas",
        variant: "destructive",
      });
    }
  };

  const handleFetchFormulas = async (message: Message) => {
    try {
      setLoading(true);
      // Extract formulas and request structured JSON format optimized for Wolfram Alpha
      const formulasResponse = await api.aiTutoring.answerQuestion({
        user_id: userId,
        question: `You are a specialized mathematical content extractor. Extract ALL important mathematical formulas, equations, problems, and scientific content from this content and format them EXACTLY as they should be used with Wolfram Alpha.

Content:
${message.content}

${message.answerData?.step_by_step ? `\nStep-by-step solution:\n${JSON.stringify(message.answerData.step_by_step)}` : ''}

CRITICAL: Format ALL formulas and equations EXACTLY as Wolfram Alpha expects them. Use proper Wolfram Alpha syntax.

WOLFRAM ALPHA FORMATTING RULES:
- Use * for multiplication (e.g., 2*x not 2x)
- Use ^ for exponentiation (e.g., x^2 not x²)
- Use proper function names: sin, cos, tan, log, ln, exp, sqrt
- Use parentheses for clarity: (2*x + 3) not 2x + 3
- For integrals: "integrate x^2, x" or "∫ x^2 dx"
- For derivatives: "d/dx(x^2)" or "derivative of x^2"
- For solving: "solve x^2 + 5*x + 6 = 0"
- For plots: "plot sin(x), x from -pi to pi"

Return ONLY a JSON array with this EXACT format (no markdown, just JSON):
[
  {
    "name": "Formula name or description",
    "formula": "Mathematical formula in standard notation (e.g., E = mc²)",
    "wolfram_query": "Exact query formatted for Wolfram Alpha (e.g., E = m*c^2)",
    "type": "formula|equation|calculation|derivative|integral|plot",
    "description": "Brief description"
  }
]

IMPORTANT: The "wolfram_query" field MUST be formatted exactly as it should be entered into Wolfram Alpha - copy-paste ready. Return ONLY the JSON array, no other text.`,
        subject: subject as any,
        context: 'Extract formulas and format them for Wolfram Alpha with wolfram_query field ready to use.'
      });

      // Parse formulas from response
      let extractedFormulas: Formula[] = [];
      const responseText = formulasResponse.answer?.answer || formulasResponse.answer?.explanation || '';
      
      // Try to extract JSON array
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          extractedFormulas = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Failed to parse formulas JSON:', parseError);
          // Fallback: extract formulas from text
          extractedFormulas = extractFormulasFromText(responseText);
        }
      } else {
        extractedFormulas = extractFormulasFromText(responseText);
      }

      // Get Wolfram graphs for each formula - use wolfram_query if available
      const formulasWithGraphs = await Promise.all(
        extractedFormulas.map(async (formula) => {
          try {
            // Use wolfram_query if available, otherwise format formula for plotting
            const wolframQuery = formula.wolfram_query || `plot ${formula.formula}`;
            
            // Only try to get graph if it's a plot type or if no wolfram_query was provided
            if (formula.type === 'plot' || !formula.wolfram_query) {
              const wolframResult = await api.aiTutoring.answerQuestion({
                user_id: userId,
                question: wolframQuery,
                subject: subject as any,
                context: 'Get graph visualization'
              });

              // Extract graph URL from Wolfram response
              if (wolframResult.answer?.visual_aids && Array.isArray(wolframResult.answer.visual_aids)) {
                const graphUrl = wolframResult.answer.visual_aids[0]?.url;
                if (graphUrl) {
                  return { ...formula, graphUrl };
                }
              }
            }
          } catch (error) {
            console.error('Failed to get Wolfram graph:', error);
          }
          return formula;
        })
      );

      // Create a new message with structured formulas
      const formulasMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## 📐 Formulas Extracted (${formulasWithGraphs.length} formulas)\n\nAll formulas have been extracted and displayed below with visualizations.`,
        subject,
        timestamp: new Date(),
        formulas: formulasWithGraphs
      };

      setMessages(prev => [...prev, formulasMessage]);
      toast({
        title: 'Formulas Extracted',
        description: `${formulasWithGraphs.length} formulas extracted with graphs`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to extract formulas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract formulas from text
  const extractFormulasFromText = (text: string): Formula[] => {
    const formulas: Formula[] = [];
    // Match LaTeX formulas in $...$ or $$...$$
    const latexMatches = text.match(/\$\$?([^$]+)\$\$?/g);
    
    if (latexMatches) {
      latexMatches.forEach((match, index) => {
        const formula = match.replace(/\$/g, '').trim();
        if (formula) {
          formulas.push({
            name: `Formula ${index + 1}`,
            formula: formula,
            description: ''
          });
        }
      });
    }
    
    return formulas;
  };

  const handleCreateFlashcards = async (message: Message) => {
    try {
      setLoading(true);
      // Generate flashcards from the message content
      const flashcards = await api.aiTutoring.answerQuestion({
        user_id: userId,
        question: `Create flashcards (question-answer pairs) from this content. Format as:\n\nQ: [Question]\nA: [Answer]\n\nContent:\n${message.content}\n\n${message.answerData?.step_by_step ? JSON.stringify(message.answerData.step_by_step) : ''}`,
        subject: subject as any,
        context: 'Create concise flashcards with clear questions and answers.'
      });

      // Create a new message with flashcards
      const flashcardsMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## 🧠 Flashcards Created:\n\n${flashcards.answer?.answer || flashcards.answer?.explanation || 'Flashcards generated.'}`,
        subject,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, flashcardsMessage]);
      toast({
        title: 'Flashcards Created',
        description: 'Flashcards have been generated successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create flashcards',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotes = async (message: Message) => {
    try {
      setLoading(true);
      // Generate structured notes from the message content
      const notes = await api.aiTutoring.answerQuestion({
        user_id: userId,
        question: `Create well-organized study notes from this content. Include:\n- Key concepts\n- Important points\n- Examples\n- Summary\n\nContent:\n${message.content}\n\n${message.answerData ? JSON.stringify(message.answerData) : ''}`,
        subject: subject as any,
        context: 'Create comprehensive, well-structured study notes.'
      });

      // Create a new message with notes
      const notesMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## 📝 Study Notes Created:\n\n${notes.answer?.answer || notes.answer?.explanation || 'Notes generated.'}`,
        subject,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, notesMessage]);
      toast({
        title: 'Notes Created',
        description: 'Study notes have been generated successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create notes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResponse = async (message: Message) => {
    try {
      // Save to localStorage or backend
      const savedResponses = JSON.parse(localStorage.getItem('saved_responses') || '[]');
      const responseToSave = {
        id: message.id,
        content: message.content,
        answerData: message.answerData,
        subject: message.subject,
        timestamp: message.timestamp,
        savedAt: new Date().toISOString()
      };
      
      // Check if already saved
      const existingIndex = savedResponses.findIndex((r: any) => r.id === message.id);
      if (existingIndex >= 0) {
        savedResponses[existingIndex] = responseToSave;
      } else {
        savedResponses.push(responseToSave);
      }
      
      localStorage.setItem('saved_responses', JSON.stringify(savedResponses));
      
      // Refresh saved responses in sidebar
      refreshSavedResponses();
      
      toast({
        title: 'Response Saved',
        description: 'This response has been saved successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save response',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadResponse = (message: Message) => {
    try {
      // Create downloadable content
      let content = `# AI Tutor Response\n\n`;
      content += `**Subject:** ${message.subject || 'General'}\n`;
      content += `**Date:** ${message.timestamp.toLocaleString()}\n\n`;
      content += `---\n\n`;
      content += `${message.content}\n\n`;
      
      if (message.answerData) {
        if (message.answerData.explanation) {
          content += `## Explanation\n\n${message.answerData.explanation}\n\n`;
        }
        if (message.answerData.examples && Array.isArray(message.answerData.examples)) {
          content += `## Examples\n\n${message.answerData.examples.map((ex: any) => `- ${typeof ex === 'string' ? ex : JSON.stringify(ex)}`).join('\n')}\n\n`;
        }
        if (message.answerData.step_by_step && Array.isArray(message.answerData.step_by_step)) {
          content += `## Step-by-Step Solution\n\n${message.answerData.step_by_step.map((step: any, i: number) => 
            `### Step ${i + 1}\n${step.description || step.step || ''}\n${step.content || step.reasoning || ''}\n`
          ).join('\n')}\n\n`;
        }
        if (message.answerData.practice_suggestions && Array.isArray(message.answerData.practice_suggestions)) {
          content += `## Practice Suggestions\n\n${message.answerData.practice_suggestions.map((sug: any) => 
            `- ${typeof sug === 'string' ? sug : JSON.stringify(sug)}`
          ).join('\n')}\n\n`;
        }
      }
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-tutor-response-${message.id}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Download Started',
        description: 'Response has been downloaded as markdown file'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to download response',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateMCQ = async (message: Message) => {
    try {
      setLoading(true);
      // Generate MCQs from the message content - request JSON format
      const mcqs = await api.aiTutoring.answerQuestion({
        user_id: userId,
        question: `Create exactly 5 multiple choice questions (MCQs) based on this content. Return ONLY a JSON array with this exact format:\n\n[\n  {\n    "question": "Question text here",\n    "options": {\n      "A": "Option A text",\n      "B": "Option B text",\n      "C": "Option C text",\n      "D": "Option D text"\n    },\n    "correctAnswer": "A",\n    "explanation": "Brief explanation"\n  }\n]\n\nContent:\n${message.content}\n\n${message.answerData ? JSON.stringify(message.answerData) : ''}\n\nReturn ONLY the JSON array, no other text.`,
        subject: subject as any,
        context: 'Return ONLY a JSON array of exactly 5 MCQ objects. Each MCQ must have question, options (A/B/C/D), correctAnswer (A/B/C/D), and explanation.'
      });

      // Parse MCQ questions from response
      let mcqQuestions: MCQQuestion[] = [];
      const responseText = mcqs.answer?.answer || mcqs.answer?.explanation || '';
      
      // Try to extract JSON array
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          mcqQuestions = JSON.parse(jsonMatch[0]);
          // Validate and limit to 5 questions
          if (Array.isArray(mcqQuestions)) {
            mcqQuestions = mcqQuestions.slice(0, 5).map((q: any) => ({
              question: q.question || '',
              options: {
                A: q.options?.A || q.options?.[0] || '',
                B: q.options?.B || q.options?.[1] || '',
                C: q.options?.C || q.options?.[2] || '',
                D: q.options?.D || q.options?.[3] || ''
              },
              correctAnswer: q.correctAnswer || q.answer || 'A',
              explanation: q.explanation || ''
            }));
          }
        } catch (parseError) {
          console.error('Failed to parse MCQ JSON:', parseError);
          // Fallback: try to parse from text format
          mcqQuestions = parseMCQsFromText(responseText);
        }
      } else {
        // Fallback: parse from text format
        mcqQuestions = parseMCQsFromText(responseText);
      }

      // Create a new message with structured MCQs
      const mcqMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## 📝 MCQ Test Generated (${mcqQuestions.length} questions)\n\nTest your understanding with these multiple choice questions!`,
        subject,
        timestamp: new Date(),
        mcqQuestions: mcqQuestions.length > 0 ? mcqQuestions : undefined
      };

      setMessages(prev => [...prev, mcqMessage]);
      toast({
        title: 'MCQ Test Generated',
        description: `${mcqQuestions.length} multiple choice questions have been created`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate MCQ test',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse MCQs from text format
  const parseMCQsFromText = (text: string): MCQQuestion[] => {
    const questions: MCQQuestion[] = [];
    const questionBlocks = text.split(/(?:Question|Q)\s*\d+[:.]/i);
    
    for (let i = 1; i < questionBlocks.length && questions.length < 5; i++) {
      const block = questionBlocks[i];
      const questionMatch = block.match(/^(.+?)(?:\n|$)/);
      if (!questionMatch) continue;
      
      const question = questionMatch[1].trim();
      const options: any = {};
      const optionMatches = block.match(/([A-D])[)\s:]+(.+?)(?=\n[A-D][)\s:]|$)/g);
      
      if (optionMatches) {
        optionMatches.forEach(match => {
          const optionMatch = match.match(/([A-D])[)\s:]+(.+)/);
          if (optionMatch) {
            options[optionMatch[1]] = optionMatch[2].trim();
          }
        });
      }
      
      const answerMatch = block.match(/(?:Answer|Correct)[:\s]+([A-D])/i);
      const explanationMatch = block.match(/(?:Explanation|Explain)[:\s]+(.+?)(?=\n(?:Question|Q)|$)/is);
      
      if (question && Object.keys(options).length >= 2) {
        questions.push({
          question,
          options: {
            A: options.A || '',
            B: options.B || '',
            C: options.C || '',
            D: options.D || ''
          },
          correctAnswer: answerMatch ? answerMatch[1].toUpperCase() : 'A',
          explanation: explanationMatch ? explanationMatch[1].trim() : ''
        });
      }
    }
    
    return questions.slice(0, 5);
  };

  const [showSidebar, setShowSidebar] = useState(true);
  const [savedResponses, setSavedResponses] = useState<any[]>([]);

  useEffect(() => {
    // Load saved responses from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('saved_responses') || '[]');
      setSavedResponses(saved);
    } catch (error) {
      console.error('Error loading saved responses:', error);
    }
  }, []);

  const refreshSavedResponses = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_responses') || '[]');
      setSavedResponses(saved);
    } catch (error) {
      console.error('Error loading saved responses:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Bot className="h-6 w-6 text-primary" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            <div>
              <h3 className="font-semibold">AI Tutor</h3>
              <p className="text-xs text-muted-foreground">Ask me anything</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={showStudyGuide} onOpenChange={setShowStudyGuide}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Study Guide
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>AI–Powered Study Plan for Class 12 Board Students (Maths)</SheetTitle>
                  <SheetDescription>
                    Follow this step-by-step sequence daily to maximize your board exam preparation
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">1. Start Each Chapter</h3>
                    <p className="text-sm text-muted-foreground mb-2">Ask AI:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Explain this chapter in simple language."</li>
                      <li>"Give me all formulas for this chapter."</li>
                      <li>"List all important board exam topics."</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">2. Learn Each Topic Properly</h3>
                    <p className="text-sm text-muted-foreground mb-2">For every topic inside the chapter, ask:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Explain this topic with simple examples."</li>
                      <li>"Give 3 solved examples (easy → medium → hard)."</li>
                      <li>"Show common mistakes students make."</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">3. Practice Daily</h3>
                    <p className="text-sm text-muted-foreground mb-2">Ask AI:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Give me 10 practice questions for this topic."</li>
                      <li>"Give me similar questions for more practice."</li>
                      <li>"Check my solution step-by-step."</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">4. Clear Doubts Immediately</h3>
                    <p className="text-sm text-muted-foreground mb-2">If stuck, ask:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Explain only this step."</li>
                      <li>"Why can't we use another method here?"</li>
                      <li>"Solve this question in an easier method."</li>
                      <li>"Solve this same question in 2 different methods."</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">5. Make Short Notes</h3>
                    <p className="text-sm text-muted-foreground mb-2">Ask AI:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Make short notes for this chapter."</li>
                      <li>"Convert this chapter into a one-page revision sheet."</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">6. Solve Board-Pattern Questions</h3>
                    <p className="text-sm text-muted-foreground mb-2">Ask:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Give me last 5 years previous year questions of this chapter."</li>
                      <li>"Give me expected questions for 2025 board exam."</li>
                      <li>"Make a 30-mark board-style test for this chapter."</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">7. Check Performance</h3>
                    <p className="text-sm text-muted-foreground mb-2">After solving:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Check my paper and give marks as per CBSE marking scheme."</li>
                      <li>"Tell me my weak areas and how to improve them."</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">8. Weekly Routine</h3>
                    <p className="text-sm text-muted-foreground mb-2">Every Sunday:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Make a weekly study plan for Class 12 Board Maths."</li>
                      <li>"Add revision + tests."</li>
                      <li>"Give me 20 mixed questions from all chapters covered this week."</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">9. Monthly Board Revision</h3>
                    <p className="text-sm text-muted-foreground mb-2">Ask:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Create a full revision plan for this month."</li>
                      <li>"Give a 50-question mixed board-level test."</li>
                      <li>"Give me frequently asked board exam questions."</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">10. Last 30 Days Board Preparation</h3>
                    <p className="text-sm text-muted-foreground mb-2">Ask:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                      <li>"Make a 30-day final board revision timetable."</li>
                      <li>"Give me 5 sample papers with solutions."</li>
                      <li>"Tell me high-scoring topics I must revise."</li>
                    </ul>
                  </div>

                  <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium mb-2">💡 Tip:</p>
                    <p className="text-sm text-muted-foreground">
                      Copy any of these prompts and paste them into the chat. The AI will guide you through each step of your board exam preparation!
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetLanguage || 'en'} onValueChange={(val) => setTargetLanguage(val === 'en' ? null : val)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={<Languages className="h-4 w-4" />} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto flex flex-col gap-4">
            {/* Subject Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setInput("Help me understand this concept better");
                    inputRef.current?.focus();
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                  Get Concept Explanation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setInput("Give me practice problems for this topic");
                    inputRef.current?.focus();
                  }}
                >
                  <ClipboardList className="h-4 w-4" />
                  Practice Problems
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setInput("Create a lesson plan for me");
                    inputRef.current?.focus();
                  }}
                >
                  <Calendar className="h-4 w-4" />
                  Generate Lesson Plan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setInput("Help me with my homework");
                    inputRef.current?.focus();
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Homework Help
                </Button>
              </CardContent>
            </Card>

            {/* Saved Responses */}
            {savedResponses.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Saved Responses ({savedResponses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {savedResponses.slice(0, 5).map((response: any) => (
                        <Button
                          key={response.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2 px-3"
                          onClick={() => {
                            setMessages([{
                              id: response.id + '-view',
                              role: 'assistant',
                              content: response.content,
                              subject: response.subject,
                              timestamp: new Date(response.savedAt),
                              answerData: response.answerData
                            }]);
                          }}
                        >
                          <div className="flex flex-col gap-1 w-full">
                            <p className="text-xs font-medium line-clamp-1">
                              {response.content.substring(0, 40)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(response.savedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tips for Better Answers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold mb-1">✨ Be Specific</p>
                  <p className="text-muted-foreground">
                    Ask detailed questions for better explanations
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">📚 Include Context</p>
                  <p className="text-muted-foreground">
                    Mention the topic or chapter you're studying
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">🧮 Math Problems</p>
                  <p className="text-muted-foreground">
                    I use Wolfram Alpha for verified step-by-step solutions
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">💡 Follow Up</p>
                  <p className="text-muted-foreground">
                    Ask follow-up questions to deepen understanding
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4" ref={scrollRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <Card
                  className={cn(
                    "max-w-[85%]",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground p-3'
                      : 'bg-card border shadow-sm p-4'
                  )}
                >
                <CardContent className="p-0 space-y-3">
                  {message.wolframUsed && (
                    <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded inline-flex items-center gap-1">
                      <span>✓</span>
                      <span>Verified with Wolfram Alpha</span>
                    </div>
                  )}
                  
                  {/* Wolfram Alpha Result Display */}
                  {message.wolframResult && (
                    <div className="mt-3 space-y-3">
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
                                  const query = message.wolframResult?.input_interpretation || message.content.split('\n')[0];
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
                          <div className="mb-3 text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950/20 p-2 rounded border border-orange-200 dark:border-orange-800">
                            <span className="font-medium">Input Interpretation:</span> {message.wolframResult.input_interpretation}
                          </div>
                        )}
                        
                        {message.wolframResult.answer && (
                          <div className="mb-3">
                            <div className="text-sm font-semibold mb-1">Answer:</div>
                            <div className="text-base font-mono bg-white dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-800">
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
                                <div key={idx} className="bg-white dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-800 text-sm">
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
                                  className="group relative bg-white dark:bg-gray-900 rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 overflow-hidden transition-all cursor-pointer shadow-sm hover:shadow-md"
                                  onClick={() => setSelectedPlot({
                                    url: plot.url,
                                    title: plot.title || `Visualization ${idx + 1}`,
                                    description: plot.description || plot.title || `Wolfram Alpha visualization ${idx + 1}`
                                  })}
                                >
                                  <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        {plot.type && (
                                          <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 shrink-0">
                                            {plot.type.replace('_', ' ')}
                                          </Badge>
                                        )}
                                        <span className="text-xs font-semibold text-blue-900 dark:text-blue-100 truncate" title={plot.title || `Visualization ${idx + 1}`}>
                                          {plot.title || `Visualization ${idx + 1}`}
                                        </span>
                                      </div>
                                      <ImageIcon className="h-3 w-3 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                                    </div>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-gray-900">
                                    <img 
                                      src={plot.url} 
                                      alt={plot.title || plot.description || `Visualization ${idx + 1}`}
                                      className="w-full h-auto rounded-lg shadow-sm max-h-80 object-contain mx-auto transition-transform group-hover:scale-105"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = '<div class="p-8 text-center text-muted-foreground text-sm">Failed to load visualization</div>';
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
                  
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-base prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1.5 prose-li:leading-relaxed prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-3 prose-strong:font-semibold prose-strong:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-3">
                    <MarkdownWithLatex content={message.content} />
                    {streamingMessageId === message.id && (
                      <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse">|</span>
                    )}
                  </div>
                  
                  {message.answerData?.step_by_step && (Array.isArray(message.answerData.step_by_step) || typeof message.answerData.step_by_step === 'string') && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📚</span>
                        <p className="text-sm font-semibold">Step-by-Step Solution</p>
                      </div>
                      {Array.isArray(message.answerData.step_by_step) && message.answerData.step_by_step.length > 0 ? (
                        <div className="space-y-3">
                          {(() => {
                            const steps = message.answerData.step_by_step;
                            const currentIndex = currentStepIndex[message.id] ?? 0;
                            const showAll = showAllSteps[message.id] ?? false;
                            const stepsToShow = showAll ? steps : [steps[currentIndex]];
                            
                            return (
                              <>
                                <div className="space-y-2">
                                  {stepsToShow.map((step: any, i: number) => {
                                    const actualIndex = showAll ? i : currentIndex;
                                    return (
                                      <div key={actualIndex} className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20 shadow-sm">
                                        <div className="font-semibold mb-3 flex items-center gap-2">
                                          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs font-bold">
                                            Step {step.step_number || actualIndex + 1} of {steps.length}
                                          </span>
                                          {step.source === 'wolfram' && (
                                            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md font-medium">✓ Wolfram Verified</span>
                                          )}
                                        </div>
                                        {(step.description || step.step) && (
                                          <div className="font-semibold mb-2 text-sm text-foreground">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                              {step.description || step.step}
                                            </ReactMarkdown>
                                          </div>
                                        )}
                                        <div className="mt-2 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:font-semibold">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {safeToString(step.content || step.reasoning || step || '')}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {!showAll && (
                                  <div className="flex items-center justify-between gap-2 pt-2">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          setCurrentStepIndex(prev => ({
                                            ...prev,
                                            [message.id]: Math.max(0, currentIndex - 1)
                                          }));
                                        }}
                                        disabled={currentIndex === 0}
                                      >
                                        <ChevronLeft className="h-3 w-3 mr-1" />
                                        Previous
                                      </Button>
                                      
                                      <span className="text-xs text-muted-foreground px-2">
                                        {currentIndex + 1} / {steps.length}
                                      </span>
                                      
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          if (currentIndex < steps.length - 1) {
                                            setCurrentStepIndex(prev => ({
                                              ...prev,
                                              [message.id]: currentIndex + 1
                                            }));
                                          } else {
                                            // Reached the end, show all steps
                                            setShowAllSteps(prev => ({
                                              ...prev,
                                              [message.id]: true
                                            }));
                                          }
                                        }}
                                      >
                                        {currentIndex < steps.length - 1 ? (
                                          <>
                                            Next
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                          </>
                                        ) : (
                                          <>
                                            <Eye className="h-3 w-3 mr-1" />
                                            Show All
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        setShowAllSteps(prev => ({
                                          ...prev,
                                          [message.id]: true
                                        }));
                                      }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Show All Steps
                                    </Button>
                                  </div>
                                )}
                                
                                {showAll && (
                                  <div className="pt-2 border-t border-border/30">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs w-full"
                                      onClick={() => {
                                        setShowAllSteps(prev => ({
                                          ...prev,
                                          [message.id]: false
                                        }));
                                        setCurrentStepIndex(prev => ({
                                          ...prev,
                                          [message.id]: steps.length - 1
                                        }));
                                      }}
                                    >
                                      <ChevronLeft className="h-3 w-3 mr-1" />
                                      Back to Step-by-Step View
                                    </Button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : typeof message.answerData.step_by_step === 'string' ? (
                        <div className="text-xs opacity-90 prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.answerData.step_by_step}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.explanation && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">💡</span>
                        <p className="text-sm font-semibold">Why This Works</p>
                      </div>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1.5 prose-strong:font-semibold bg-muted/50 p-4 rounded-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.answerData.explanation}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {message.answerData?.examples && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🌍</span>
                        <p className="text-sm font-semibold">Real-World Examples</p>
                      </div>
                      {Array.isArray(message.answerData.examples) && message.answerData.examples.length > 0 ? (
                        <div className="space-y-3">
                          {message.answerData.examples.map((ex: any, i: number) => {
                            let displayText = '';
                            if (typeof ex === 'string') {
                              displayText = ex;
                            } else if (ex && typeof ex === 'object') {
                              displayText = ex.title || ex.description || ex.name || JSON.stringify(ex);
                            } else {
                              displayText = String(ex);
                            }
                            return (
                              <div key={i} className="bg-muted/50 p-3 rounded-lg border border-border/30">
                                <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-p:leading-relaxed prose-strong:font-semibold">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {displayText}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : typeof message.answerData.examples === 'string' ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-4 rounded-lg prose-p:my-2 prose-p:leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.answerData.examples}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.connections && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🔗</span>
                        <p className="text-sm font-semibold">Related Concepts</p>
                      </div>
                      {Array.isArray(message.answerData.connections) && message.answerData.connections.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {message.answerData.connections.map((conn: any, i: number) => {
                            let displayText = '';
                            if (typeof conn === 'string') {
                              displayText = conn;
                            } else if (conn && typeof conn === 'object') {
                              displayText = conn.title || conn.description || conn.name || JSON.stringify(conn);
                            } else {
                              displayText = String(conn);
                            }
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                              >
                                {displayText}
                              </span>
                            );
                          })}
                        </div>
                      ) : typeof message.answerData.connections === 'string' ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-4 rounded-lg prose-p:my-2 prose-p:leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.answerData.connections}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.visual_aids && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📊</span>
                        <p className="text-sm font-semibold">Visual Aids & Graphs</p>
                      </div>
                      {Array.isArray(message.answerData.visual_aids) && message.answerData.visual_aids.length > 0 ? (
                        <div className="space-y-3">
                          {message.answerData.visual_aids.map((aid: any, i: number) => (
                            <div key={i} className="space-y-2">
                              {aid.url ? (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium flex items-center gap-1">
                                    {aid.source === 'wolfram' && <span className="text-blue-400">✓</span>}
                                    {aid.description || aid.title || 'Visualization'}
                                  </p>
                                  <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
                                    <img 
                                      src={aid.url} 
                                      alt={aid.description || aid.title || 'Graph or visualization'}
                                      className="w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(aid.url, '_blank')}
                                      onError={(e) => {
                                        // Fallback if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          const fallback = document.createElement('div');
                                          fallback.className = 'p-4 text-center text-xs text-muted-foreground';
                                          fallback.innerHTML = `<a href="${aid.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">View graph/visualization</a>`;
                                          parent.appendChild(fallback);
                                        }
                                      }}
                                      loading="lazy"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a 
                                      href={aid.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-xs text-blue-400 hover:underline"
                                    >
                                      Open in new tab
                                    </a>
                                    {aid.source === 'wolfram' && (
                                      <span className="text-xs text-muted-foreground">• From Wolfram Alpha</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs opacity-90 p-2 bg-muted/50 rounded">
                                  <p className="font-medium">{aid.description || aid.title || aid.name || 'Visualization'}</p>
                                  {aid.name && aid.name !== (aid.description || aid.title) && (
                                    <p className="text-muted-foreground mt-1">{aid.name}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : typeof message.answerData.visual_aids === 'string' ? (
                        <div className="text-xs opacity-90 prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.answerData.visual_aids}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.common_mistakes && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">⚠️</span>
                        <p className="text-sm font-semibold">Common Mistakes to Avoid</p>
                      </div>
                      {Array.isArray(message.answerData.common_mistakes) && message.answerData.common_mistakes.length > 0 ? (
                        <div className="space-y-2">
                          {message.answerData.common_mistakes.map((mistake: any, i: number) => {
                            let displayText = '';
                            if (typeof mistake === 'string') {
                              displayText = mistake;
                            } else if (mistake && typeof mistake === 'object') {
                              displayText = mistake.title || mistake.description || mistake.name || JSON.stringify(mistake);
                            } else {
                              displayText = String(mistake);
                            }
                            return (
                              <div key={i} className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/30">
                                <span className="text-red-500 mt-0.5">•</span>
                                <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-p:leading-relaxed prose-strong:font-semibold">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {displayText}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : typeof message.answerData.common_mistakes === 'string' ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900/30 prose-p:my-2 prose-p:leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.answerData.common_mistakes}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.practice_suggestions && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📝</span>
                        <p className="text-sm font-semibold">Practice Suggestions</p>
                      </div>
                      {Array.isArray(message.answerData.practice_suggestions) && message.answerData.practice_suggestions.length > 0 ? (
                        <div className="space-y-2">
                          {message.answerData.practice_suggestions.map((sug: any, i: number) => {
                            let displayText = '';
                            if (typeof sug === 'string') {
                              displayText = sug;
                            } else if (sug && typeof sug === 'object') {
                              displayText = sug.title || sug.description || sug.name || JSON.stringify(sug);
                            } else {
                              displayText = String(sug);
                            }
                            return (
                              <div key={i} className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900/30">
                                <span className="text-blue-500 mt-0.5 font-bold">{i + 1}.</span>
                                <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-p:leading-relaxed prose-strong:font-semibold">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {displayText}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : typeof message.answerData.practice_suggestions === 'string' ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900/30 prose-p:my-2 prose-p:leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.answerData.practice_suggestions}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.teaching_tips && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🎓</span>
                        <p className="text-sm font-semibold">Learning Tips</p>
                      </div>
                      {Array.isArray(message.answerData.teaching_tips) && message.answerData.teaching_tips.length > 0 ? (
                        <div className="space-y-2">
                          {message.answerData.teaching_tips.map((tip: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900/30">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-p:leading-relaxed prose-strong:font-semibold">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {tip}
                                </ReactMarkdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : typeof message.answerData.teaching_tips === 'string' ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900/30 prose-p:my-2 prose-p:leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.answerData.teaching_tips}
                          </ReactMarkdown>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Formulas Display with LaTeX and Graphs */}
                  {message.formulas && message.formulas.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/50 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold">📐 Formulas</h3>
                        <Button
                          onClick={() => handleTakeAllFormulas(message.formulas!)}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                        >
                          📋 Take All Formula ({message.formulas.length})
                        </Button>
                      </div>
                      {message.formulas.map((formula, index) => (
                        <Card key={index} className="p-4">
                          <CardContent className="p-0 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {formula.name && (
                                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                  {formula.name}
                                </span>
                              )}
                              {formula.type && (
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border">
                                  {formula.type}
                                </span>
                              )}
                            </div>
                            
                            {/* LaTeX Formula Display */}
                            {formula.formula && (
                              <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                                <div className="text-center">
                                  <BlockMath math={formula.formula} />
                                </div>
                              </div>
                            )}
                            
                            {/* Wolfram Query Display - prominently shown */}
                            {formula.wolfram_query && (
                              <div className="bg-primary/5 p-3 rounded-lg border-2 border-primary/20">
                                <p className="text-xs font-semibold text-primary mb-1.5">🐺 Wolfram Alpha Query (Ready to Use):</p>
                                <p className="text-sm font-mono text-foreground break-words bg-background px-2 py-1.5 rounded border border-primary/20">
                                  {formula.wolfram_query}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 h-7 text-xs"
                                  onClick={() => {
                                    navigator.clipboard.writeText(formula.wolfram_query!);
                                    toast({
                                      title: "Copied!",
                                      description: "Wolfram query copied to clipboard",
                                    });
                                  }}
                                >
                                  📋 Copy Query
                                </Button>
                              </div>
                            )}
                            
                            {formula.description && (
                              <p className="text-xs text-muted-foreground">{formula.description}</p>
                            )}
                            
                            {/* Wolfram Graph */}
                            {formula.graphUrl && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold">📊 Graph Visualization:</p>
                                <div className="border rounded-lg overflow-hidden bg-background">
                                  <img 
                                    src={formula.graphUrl} 
                                    alt={`Graph of ${formula.name || formula.formula}`}
                                    className="w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(formula.graphUrl, '_blank')}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                    loading="lazy"
                                  />
                                </div>
                                <a 
                                  href={formula.graphUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  Open graph in new tab
                                </a>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* MCQ Questions Display */}
                  {message.mcqQuestions && message.mcqQuestions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/50 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">📝 Multiple Choice Questions</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setShowMcqAnswers(prev => ({
                            ...prev,
                            [message.id]: !prev[message.id]
                          }))}
                        >
                          {showMcqAnswers[message.id] ? 'Hide Answers' : 'Show Answers'}
                        </Button>
                      </div>
                      
                      {message.mcqQuestions.map((mcq, index) => {
                        const selectedAnswer = mcqAnswers[message.id]?.[index] || '';
                        const isCorrect = selectedAnswer === mcq.correctAnswer;
                        const showAnswer = showMcqAnswers[message.id];
                        
                        return (
                          <Card key={index} className={cn(
                            "p-4",
                            showAnswer && selectedAnswer && (isCorrect ? "bg-green-50 dark:bg-green-950/20 border-green-200" : "bg-red-50 dark:bg-red-950/20 border-red-200")
                          )}>
                            <CardContent className="p-0">
                              <div className="flex items-start gap-2 mb-4">
                                <span className="font-semibold text-sm min-w-[30px]">Q{index + 1}.</span>
                                <p className="text-sm font-medium flex-1">{mcq.question}</p>
                              </div>
                              
                              <RadioGroup
                                value={selectedAnswer}
                                onValueChange={(value) => {
                                  setMcqAnswers(prev => ({
                                    ...prev,
                                    [message.id]: {
                                      ...prev[message.id],
                                      [index]: value
                                    }
                                  }));
                                }}
                                className="space-y-2 ml-8"
                              >
                                {(['A', 'B', 'C', 'D'] as const).map((option) => (
                                  <div key={option} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={`${message.id}-q${index}-${option}`} />
                                    <Label
                                      htmlFor={`${message.id}-q${index}-${option}`}
                                      className={cn(
                                        "text-sm cursor-pointer flex-1",
                                        showAnswer && option === mcq.correctAnswer && "font-semibold text-green-600 dark:text-green-400",
                                        showAnswer && selectedAnswer === option && option !== mcq.correctAnswer && "text-red-600 dark:text-red-400"
                                      )}
                                    >
                                      <span className="font-medium mr-2">{option})</span>
                                      {mcq.options[option]}
                                      {showAnswer && option === mcq.correctAnswer && (
                                        <span className="ml-2 text-xs">✓ Correct</span>
                                      )}
                                      {showAnswer && selectedAnswer === option && option !== mcq.correctAnswer && (
                                        <span className="ml-2 text-xs">✗ Your Answer</span>
                                      )}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                              
                              {showAnswer && mcq.explanation && (
                                <div className="mt-4 p-3 bg-muted rounded-lg">
                                  <p className="text-xs font-semibold mb-1">💡 Explanation:</p>
                                  <p className="text-xs text-muted-foreground">{mcq.explanation}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Sources Display - Enhanced UI */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                            <BookMarked className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Content Sources</p>
                            {message.sourcesCount && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {message.sourcesCount} section{message.sourcesCount !== 1 ? 's' : ''} referenced from curriculum
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2.5">
                        {(() => {
                          // Group sources by type and chapter to avoid duplicates
                          const groupedSources = new Map<string, { count: number; source: Source }>();
                          
                          message.sources.forEach((source) => {
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
                            
                            // Color coding based on source type
                            const sourceTypeConfig = 
                              source.type === 'ncert' 
                                ? {
                                    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
                                    text: 'text-blue-700 dark:text-blue-300',
                                    border: 'border-blue-200 dark:border-blue-800',
                                    iconBg: 'bg-blue-500/20'
                                  }
                                : source.type === 'pyq'
                                ? {
                                    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
                                    text: 'text-purple-700 dark:text-purple-300',
                                    border: 'border-purple-200 dark:border-purple-800',
                                    iconBg: 'bg-purple-500/20'
                                  }
                                : source.type === 'hots'
                                ? {
                                    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
                                    text: 'text-orange-700 dark:text-orange-300',
                                    border: 'border-orange-200 dark:border-orange-800',
                                    iconBg: 'bg-orange-500/20'
                                  }
                                : {
                                    bg: 'bg-muted/50',
                                    text: 'text-muted-foreground',
                                    border: 'border-border',
                                    iconBg: 'bg-muted'
                                  };
                            
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "group relative flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all duration-200",
                                  "bg-gradient-to-br from-background to-muted/20",
                                  sourceTypeConfig.border,
                                  "hover:shadow-lg hover:scale-[1.01] hover:border-primary/40"
                                )}
                              >
                                <div className={cn("p-2 rounded-lg flex-shrink-0", sourceTypeConfig.iconBg)}>
                                  <BookOpen className={cn("h-4 w-4", sourceTypeConfig.text)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-xs font-bold h-6 px-2.5",
                                        sourceTypeConfig.bg,
                                        sourceTypeConfig.text,
                                        sourceTypeConfig.border
                                      )}
                                    >
                                      {displayType}
                                    </Badge>
                                    {count > 1 && (
                                      <Badge 
                                        variant="secondary" 
                                        className="text-xs font-semibold h-6 px-2.5"
                                      >
                                        {count} reference{count !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                  <p 
                                    className={cn(
                                      "text-sm font-semibold truncate",
                                      sourceTypeConfig.text
                                    )} 
                                    title={displayChapter}
                                  >
                                    {displayChapter}
                                  </p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* Show sources count even if sources array is empty but count exists */}
                  {(!message.sources || message.sources.length === 0) && message.sourcesCount && message.sourcesCount > 0 && (
                    <div className="mt-5 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 shadow-sm">
                        <div className="p-2 rounded-lg bg-primary/20 ring-1 ring-primary/30">
                          <BookMarked className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Content References</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on <span className="font-semibold text-primary">{message.sourcesCount}</span> relevant content section{message.sourcesCount !== 1 ? 's' : ''} from the curriculum
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                </CardContent>
              </Card>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              </div>
            ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted p-3">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        
        {/* Right Sidebar - AI Suggested Actions */}
        {(() => {
          const messagesWithActions = messages.filter(m => m.role === 'assistant' && m.suggestedActions && m.suggestedActions.length > 0);
          const latestMessage = messagesWithActions[messagesWithActions.length - 1];
          
          if (!latestMessage) return null;
          
          // Action map for previous messages
          const getActionConfig = (action: string, message: Message) => {
            const actionMap: Record<string, { icon: any; handler: () => void }> = {
              'Fetch Formulas': { icon: Calculator, handler: () => handleFetchFormulas(message) },
              'Create Flashcards': { icon: Brain, handler: () => handleCreateFlashcards(message) },
              'Create Notes': { icon: FileText, handler: () => handleCreateNotes(message) },
              'Generate MCQ': { icon: ClipboardList, handler: () => handleGenerateMCQ(message) },
              'Save': { icon: Save, handler: () => handleSaveResponse(message) },
              'Download': { icon: Download, handler: () => handleDownloadResponse(message) },
            };
            return actionMap[action];
          };
          
          return (
            <div className="w-72 border-l bg-card shadow-sm p-4 overflow-y-auto">
              <div className="sticky top-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold">AI Suggested Actions</h3>
                </div>
                
                {/* Latest Message Actions - Prominently Displayed */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 italic">
                    "{latestMessage.content.substring(0, 80)}..."
                  </p>
                  <div className="flex flex-col gap-2">
                    {latestMessage.suggestedActions.includes('Fetch Formulas') && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-10 text-sm gap-2 justify-start w-full font-medium"
                        onClick={() => {
                          handleFetchFormulas(latestMessage);
                          toast({
                            title: "Fetching Formulas",
                            description: "Extracting formulas from the response...",
                          });
                        }}
                      >
                        <Calculator className="h-4 w-4" />
                        Fetch Formulas
                      </Button>
                    )}
                    {latestMessage.suggestedActions.includes('Create Flashcards') && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-10 text-sm gap-2 justify-start w-full font-medium"
                        onClick={() => {
                          handleCreateFlashcards(latestMessage);
                          toast({
                            title: "Creating Flashcards",
                            description: "Generating flashcards from the content...",
                          });
                        }}
                      >
                        <Brain className="h-4 w-4" />
                        Create Flashcards
                      </Button>
                    )}
                    {latestMessage.suggestedActions.includes('Create Notes') && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-10 text-sm gap-2 justify-start w-full font-medium"
                        onClick={() => {
                          handleCreateNotes(latestMessage);
                          toast({
                            title: "Creating Notes",
                            description: "Generating study notes...",
                          });
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        Create Notes
                      </Button>
                    )}
                    {latestMessage.suggestedActions.includes('Generate MCQ') && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-10 text-sm gap-2 justify-start w-full font-medium"
                        onClick={() => {
                          handleGenerateMCQ(latestMessage);
                          toast({
                            title: "Generating MCQ",
                            description: "Creating practice questions...",
                          });
                        }}
                      >
                        <ClipboardList className="h-4 w-4" />
                        Generate MCQ
                      </Button>
                    )}
                    {latestMessage.suggestedActions.includes('Save') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-sm gap-2 justify-start w-full font-medium"
                        onClick={() => {
                          handleSaveResponse(latestMessage);
                        }}
                      >
                        <Save className="h-4 w-4" />
                        Save Response
                      </Button>
                    )}
                    {latestMessage.suggestedActions.includes('Download') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-sm gap-2 justify-start w-full font-medium"
                        onClick={() => {
                          handleDownloadResponse(latestMessage);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download Response
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Previous Messages Actions - Collapsed */}
                {messagesWithActions.length > 1 && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-3">Previous Actions</p>
                    <div className="space-y-3">
                      {messagesWithActions.slice(0, -1).reverse().slice(0, 3).map((message) => (
                        <div key={message.id} className="space-y-1.5">
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {message.content.substring(0, 40)}...
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {message.suggestedActions.slice(0, 3).map((action) => {
                              const actionConfig = getActionConfig(action, message);
                              if (!actionConfig) return null;
                              
                              const Icon = actionConfig.icon;
                              return (
                                <Button
                                  key={action}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 px-2"
                                  onClick={actionConfig.handler}
                                  title={action}
                                >
                                  <Icon className="h-3 w-3" />
                                  <span className="hidden sm:inline">{action.split(' ')[0]}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-card">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your subjects..."
              disabled={loading}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleTranslateInput}
                title="Translate input"
                disabled={!input.trim()}
              >
                <Languages className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
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
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
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

