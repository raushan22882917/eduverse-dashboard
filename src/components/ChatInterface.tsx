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
import { Send, Bot, User, Loader2, Mic, Languages, Brain, Save, Download, FileText, ClipboardList, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MemoryInsights } from '@/components/MemoryInsights';
import { Neo4jMemoryManager } from '@/utils/neo4jMemory';
import { generateSessionId, generateSessionName } from '@/utils/sessionNaming';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

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
  suggestedActions?: string[];
  sources?: Source[];
  sourcesCount?: number;
}

interface ChatInterfaceProps {
  userId: string;
  defaultSubject?: string;
}

// Component to render markdown with LaTeX support
const MarkdownWithLatex = ({ content }: { content: string }) => {
  const processInlineMath = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\$[^$\n]+\$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('$') && part.endsWith('$') && !part.includes('\n')) {
        return <InlineMath key={idx} math={part.slice(1, -1).trim()} />;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const processContent = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Match block math ($$...$$) first
    const blockMathRegex = /\$\$([^$]+)\$\$/g;
    let lastIndex = 0;
    let blockMatch;
    const blockMatches: Array<{ start: number; end: number; formula: string }> = [];
    
    while ((blockMatch = blockMathRegex.exec(text)) !== null) {
      blockMatches.push({
        start: blockMatch.index,
        end: blockMatch.index + blockMatch[0].length,
        formula: blockMatch[1].trim()
      });
    }
    
    blockMatches.forEach((match, idx) => {
      if (match.start > lastIndex) {
        const beforeText = text.substring(lastIndex, match.start);
        result.push(
          <ReactMarkdown key={`text-${idx}`} remarkPlugins={[remarkGfm]} components={{
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
            strong: ({ children }) => <strong className="font-semibold">{processInlineMath(String(children))}</strong>,
            em: ({ children }) => <em className="italic">{processInlineMath(String(children))}</em>,
            h1: ({ children }) => <h1 className="text-lg font-semibold mt-4 mb-2">{processInlineMath(String(children))}</h1>,
            h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{processInlineMath(String(children))}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{processInlineMath(String(children))}</h3>,
          }}>{beforeText}</ReactMarkdown>
        );
      }
      
      result.push(
        <div key={`block-${idx}`} className="my-3 text-center">
          <BlockMath math={match.formula} />
        </div>
      );
      lastIndex = match.end;
    });
    
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      result.push(
        <ReactMarkdown key="text-final" remarkPlugins={[remarkGfm]} components={{
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
          strong: ({ children }) => <strong className="font-semibold">{processInlineMath(String(children))}</strong>,
          em: ({ children }) => <em className="italic">{processInlineMath(String(children))}</em>,
          h1: ({ children }) => <h1 className="text-lg font-semibold mt-4 mb-2">{processInlineMath(String(children))}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{processInlineMath(String(children))}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{processInlineMath(String(children))}</h3>,
        }}>{remainingText}</ReactMarkdown>
      );
    }
    
    return result.length > 0 ? result : [<ReactMarkdown key="default" remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>];
  };
  
  return <div>{processContent(content)}</div>;
};

export function ChatInterface({ userId, defaultSubject = 'mathematics' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [isListening, setIsListening] = useState(false);
  const [showMemoryInsights, setShowMemoryInsights] = useState(false);
  const [neo4jMemory] = useState(() => new Neo4jMemoryManager(userId));
  const [enhancedSessionId, setEnhancedSessionId] = useState<string | null>(null);
  const [sessionStartTime] = useState(new Date());
  const [sessionInteractions, setSessionInteractions] = useState<Array<{
    type: 'question' | 'answer' | 'explanation';
    content: string;
    timestamp: string;
    confidence?: number;
  }>>([]);

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
      if (value.text) return String(value.text);
      if (value.content) return String(value.content);
      if (value.description) return String(value.description);
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  // Helper function to extract concepts from text
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

    const capitalizedTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (capitalizedTerms) {
      capitalizedTerms.forEach(term => {
        const concept = term.toLowerCase().trim();
        if (concept.length > 3 && !concepts.includes(concept) && concepts.length < 10) {
          concepts.push(concept);
        }
      });
    }

    return concepts.slice(0, 8);
  };

  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Create enhanced AI tutor session
        const enhancedSession = await api.enhancedAiTutor.createSession(userId);
        setEnhancedSessionId(enhancedSession.session_id);

        // Get learning insights and recommendations
        const [learningInsights, recommendations, recentContext] = await Promise.all([
          api.enhancedAiTutor.getLearningInsights(userId),
          api.knowledgeGraph.getRecommendations(userId),
          api.memory.recall(userId, {
            context_type: 'learning',
            limit: 5,
            days_back: 7
          })
        ]);

        let welcomeMessage = 'Hello! I\'m your enhanced AI tutor powered by Gemini AI, Wolfram Alpha, and advanced memory intelligence. I can help you:\n\n✨ Understand concepts with detailed explanations\n🧮 Solve math problems with step-by-step solutions\n📚 Connect ideas across different topics\n💡 Learn through examples and practice\n🧠 Build on your previous learning with memory-enhanced responses\n\nAsk me anything about your subjects - I\'m here to teach, not just answer!';

        // Add learning insights to welcome message
        if (learningInsights.insights) {
          const insights = learningInsights.insights;
          welcomeMessage += `\n\n🎯 **Your Learning Profile:**`;
          
          if (insights.strong_subjects && insights.strong_subjects.length > 0) {
            welcomeMessage += `\n• Strong subjects: ${insights.strong_subjects.join(', ')}`;
          }
          
          if (insights.preferred_learning_style) {
            welcomeMessage += `\n• Learning style: ${insights.preferred_learning_style}`;
          }
          
          if (insights.learning_velocity) {
            welcomeMessage += `\n• Learning velocity: ${Math.round(insights.learning_velocity * 100)}%`;
          }
        }

        // Add personalized recommendations
        if (recommendations.recommendations && recommendations.recommendations.length > 0) {
          welcomeMessage += `\n\n💡 **Recommended for you:**`;
          recommendations.recommendations.slice(0, 2).forEach((rec: any) => {
            welcomeMessage += `\n• ${rec.concept.replace(/_/g, ' ')} (${rec.difficulty}) - ${rec.reason}`;
          });
        }

        // Personalize welcome message based on recent activity
        if (recentContext.contexts && recentContext.contexts.length > 0) {
          const recentSubjects = [...new Set(recentContext.contexts.map((ctx: any) => ctx.subject))].filter(Boolean);
          const recentTopics = recentContext.contexts.slice(0, 3).map((ctx: any) => ctx.topic).filter(Boolean);

          if (recentSubjects.length > 0) {
            welcomeMessage += `\n\n📚 **Recent activity**: You've been studying ${recentSubjects.join(', ')}. I remember our previous conversations and can build on what we've discussed.`;
            
            if (recentTopics.length > 0) {
              welcomeMessage += `\n\n🔍 **Recent topics**: ${recentTopics.slice(0, 2).join(', ')}${recentTopics.length > 2 ? ', and more' : ''}`;
            }
          }
        }

        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
          suggestedActions: ['Save']
        }]);

      } catch (error) {
        console.warn('Failed to load enhanced context:', error);
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I\'m your AI tutor powered by Gemini AI and Wolfram Alpha. I can help you:\n\n✨ Understand concepts with detailed explanations\n🧮 Solve math problems with step-by-step solutions\n📚 Connect ideas across different topics\n💡 Learn through examples and practice\n\nAsk me anything about your subjects - I\'m here to teach, not just answer!',
          timestamp: new Date(),
          suggestedActions: ['Save']
        }]);
      }
    };

    initializeChat();
  }, [userId]);

  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  }, [messages]);

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

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      subject,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Get conversation context
      const currentContext = messages
        .slice(-3)
        .map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`)
        .join('\n');

      // Get relevant memory context
      let memoryContext = '';
      try {
        const relevantMemory = await api.memory.recall(userId, {
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

      const context = currentContext + memoryContext;

      // Try enhanced AI tutor first, fallback to regular API
      let fullResponse;
      let usedEnhancedTutor = false;

      try {
        if (enhancedSessionId) {
          fullResponse = await api.enhancedAiTutor.sendMessage(
            enhancedSessionId, 
            questionText, 
            { subject, context, previous_interactions: sessionInteractions.slice(-3) }
          );
          usedEnhancedTutor = true;
          console.log('Enhanced AI Tutor Response:', fullResponse);
        } else {
          throw new Error('No enhanced session available');
        }
      } catch (error) {
        console.warn('Enhanced AI tutor failed, using fallback:', error);
        
        // Use the direct RAG API which gives us the full response
        fullResponse = await api.rag.queryDirect({
          query: questionText,
          subject: subject
        });
        
        console.log('RAG API Response:', fullResponse);
        
        // If RAG also fails, try the aiTutoring endpoint
        if (!fullResponse || (!fullResponse.answer && !fullResponse.generated_text)) {
          console.warn('RAG API failed, trying aiTutoring endpoint');
          fullResponse = await api.aiTutoring.answerQuestion({
            user_id: userId,
            question: questionText,
            subject: subject as any,
            context: context || undefined
          });
          console.log('AI Tutoring API Response:', fullResponse);
        }
      }

      // Track session interaction
      const questionInteraction = {
        type: 'question' as const,
        content: questionText,
        timestamp: new Date().toISOString(),
        confidence: 1.0
      };
      setSessionInteractions(prev => [...prev, questionInteraction]);

      // Store the question in memory
      try {
        await api.memory.remember(userId, {
          type: 'learning',
          content: {
            question: questionText,
            subject: subject,
            timestamp: new Date().toISOString(),
            context: context || undefined,
            enhanced_tutor_used: usedEnhancedTutor,
            session_id: enhancedSessionId
          },
          subject: subject,
          topic: questionText.length > 50 ? questionText.substring(0, 50) + '...' : questionText,
          importance: 0.7,
          tags: [subject, 'question', 'chat', usedEnhancedTutor ? 'enhanced' : 'standard'],
          source: 'ai_tutor_chat',
          session_id: enhancedSessionId || generateSessionId(questionText),
          component: 'ChatInterface'
        });
      } catch (error) {
        console.warn('Failed to store question in memory:', error);
      }

      // Get answer content - prioritize the full response
      let answerContent = '';
      
      console.log('Full API Response received:', JSON.stringify(fullResponse, null, 2));
      
      // Check multiple possible response fields in order of preference
      if (fullResponse.generated_text) {
        answerContent = safeToString(fullResponse.generated_text);
        console.log('✅ Using generated_text field, length:', answerContent.length);
      } else if (fullResponse.answer?.answer) {
        answerContent = safeToString(fullResponse.answer.answer);
        console.log('✅ Using answer.answer field, length:', answerContent.length);
      } else if (fullResponse.answer?.explanation) {
        answerContent = safeToString(fullResponse.answer.explanation);
        console.log('✅ Using answer.explanation field, length:', answerContent.length);
      } else if (fullResponse.answer) {
        answerContent = safeToString(fullResponse.answer);
        console.log('✅ Using answer field, length:', answerContent.length);
      } else if (fullResponse.content) {
        answerContent = safeToString(fullResponse.content);
        console.log('✅ Using content field, length:', answerContent.length);
      } else {
        answerContent = 'I apologize, but I couldn\'t generate a response. Please try again.';
        console.log('❌ No valid response field found');
      }

      console.log('Final extracted answer content length:', answerContent.length);
      console.log('Answer preview (first 200 chars):', answerContent.substring(0, 200) + '...');
      console.log('Answer preview (last 200 chars):', '...' + answerContent.substring(Math.max(0, answerContent.length - 200)));

      // Display the full response immediately - no streaming to avoid truncation issues
      if (answerContent && answerContent.length > 0) {
        console.log('Setting full response content, length:', answerContent.length);
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: answerContent }
            : msg
        ));
      } else {
        // Fallback if no content
        console.warn('No answer content found in response');
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: 'I apologize, but I couldn\'t generate a complete response. Please try rephrasing your question.' }
            : msg
        ));
      }

      // Extract sources from response
      let extractedSources: Source[] = [];
      let sourcesCount = 0;
      
      const responseWithSources = fullResponse as any;
      if (responseWithSources.sources && Array.isArray(responseWithSources.sources)) {
        extractedSources = responseWithSources.sources;
        sourcesCount = responseWithSources.sources.length;
      } else if (responseWithSources.metadata?.sources && Array.isArray(responseWithSources.metadata.sources)) {
        extractedSources = responseWithSources.metadata.sources;
        sourcesCount = responseWithSources.metadata.sources.length;
      }

      // Store the AI response in memory
      try {
        await api.memory.remember(userId, {
          type: 'learning',
          content: {
            question: questionText,
            answer: answerContent,
            subject: subject,
            confidence: fullResponse.confidence || 0.5,
            sources: extractedSources,
            sources_count: sourcesCount,
            timestamp: new Date().toISOString(),
            response_length: answerContent.length,
            interaction_type: 'qa_pair',
            context_used: context ? context.length > 0 : false,
            memory_enhanced: true
          },
          subject: subject,
          topic: questionText.length > 50 ? questionText.substring(0, 50) + '...' : questionText,
          importance: Math.min(0.9, 0.5 + (answerContent.length / 2000)),
          tags: [subject, 'answer', 'ai_response', 'chat', 'qa_pair'],
          source: 'ai_tutor_response',
          session_id: enhancedSessionId || generateSessionId(questionText),
          component: 'ChatInterface'
        });

        // Track answer interaction
        const answerInteraction = {
          type: 'answer' as const,
          content: answerContent,
          timestamp: new Date().toISOString(),
          confidence: fullResponse.confidence || 0.5
        };
        setSessionInteractions(prev => [...prev, answerInteraction]);

        // Extract concepts and update knowledge graph
        const extractedConcepts = extractConceptsFromText(answerContent, subject);
        
        // Store in Neo4j graph
        await neo4jMemory.storeInteraction({
          question: questionText,
          answer: answerContent,
          subject: subject,
          confidence: fullResponse.confidence || 0.5,
          sources: extractedSources,
          concepts: extractedConcepts
        });

        // Update knowledge graph
        try {
          for (const concept of extractedConcepts) {
            await api.knowledgeGraph.createConcept(concept);
          }

          for (let i = 0; i < extractedConcepts.length - 1; i++) {
            for (let j = i + 1; j < extractedConcepts.length; j++) {
              await api.knowledgeGraph.createRelationship(
                extractedConcepts[i], 
                extractedConcepts[j], 
                'RELATED_TO'
              );
            }
          }

          const mainConcepts = extractedConcepts.slice(0, 3);
          for (const concept of mainConcepts) {
            const masteryLevel = Math.min(0.9, 0.3 + (fullResponse.confidence || 0.5) * 0.6);
            await api.knowledgeGraph.updateProgress(userId, concept, masteryLevel);
          }
        } catch (error) {
          console.warn('Failed to update knowledge graph:', error);
        }
      } catch (error) {
        console.warn('Failed to store answer in memory:', error);
      }

      // Generate suggested actions
      let suggestedActions: string[] = [];
      const contentLower = answerContent.toLowerCase();
      const hasFormulas = contentLower.includes('formula') || contentLower.includes('equation');
      const hasConcepts = contentLower.includes('concept') || contentLower.includes('definition');
      const isLongContent = answerContent.length > 200;
      const hasQuestions = contentLower.includes('question') || contentLower.includes('problem');

      if (hasFormulas) suggestedActions.push('Fetch Formulas');
      if (hasConcepts) suggestedActions.push('Create Flashcards');
      if (isLongContent) suggestedActions.push('Create Notes');
      if (hasQuestions) suggestedActions.push('Generate MCQ');
      suggestedActions.push('Save', 'Download');

      // Final update to ensure complete content is preserved
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? {
              ...msg,
              content: answerContent, // Always use the full extracted content
              suggestedActions: suggestedActions,
              sources: extractedSources.length > 0 ? extractedSources : undefined,
              sourcesCount: sourcesCount > 0 ? sourcesCount : undefined
            }
          : msg
      ));

      // Log final message state for debugging
      console.log('Final message content length:', answerContent.length);
      console.log('Message updated with full content');

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

  // Store session data when component unmounts
  const storeSessionData = async () => {
    if (sessionInteractions.length === 0) return;

    try {
      const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000);
      const concepts = [...new Set(sessionInteractions
        .filter(interaction => interaction.type === 'answer')
        .flatMap(interaction => extractConceptsFromText(interaction.content, subject))
      )];

      await api.memory.storeSession(userId, {
        session_type: 'chat',
        subject: subject,
        topic: messages.length > 1 ? messages[1]?.content?.substring(0, 50) : 'General Chat',
        questions_asked: sessionInteractions.filter(i => i.type === 'question').length,
        concepts_learned: concepts,
        duration_minutes: sessionDuration,
        performance_score: sessionInteractions
          .filter(i => i.confidence)
          .reduce((sum, i) => sum + (i.confidence || 0), 0) / 
          sessionInteractions.filter(i => i.confidence).length || 0.5,
        difficulty_level: 'intermediate',
        interactions: sessionInteractions,
        metadata: {
          enhanced_tutor_used: enhancedSessionId !== null,
          session_id: enhancedSessionId,
          total_messages: messages.length,
          subjects_discussed: [subject]
        }
      });

      console.log('Session data stored successfully');
    } catch (error) {
      console.warn('Failed to store session data:', error);
    }
  };

  useEffect(() => {
    return () => {
      storeSessionData();
    };
  }, [sessionInteractions, messages]);

  return (
    <div className="flex flex-col h-full max-h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">AI Tutor Chat</h2>
              <p className="text-sm text-muted-foreground">Enhanced with Memory Intelligence</p>
            </div>
          </div>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mathematics">Mathematics</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="biology">Biology</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={cn(
                "max-w-[80%] rounded-lg p-4",
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-12' 
                  : 'bg-muted'
              )}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownWithLatex content={message.content} />
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-semibold mb-2">Sources ({message.sources.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {message.sources.slice(0, 5).map((source, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {source.type || 'Unknown'} - {source.chapter || source.title || 'No title'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Actions */}
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-semibold mb-2">Suggested Actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestedActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            toast({
                              title: action,
                              description: `${action} feature coming soon!`,
                            });
                          }}
                        >
                          {action === 'Save' && <Save className="h-3 w-3 mr-1" />}
                          {action === 'Download' && <Download className="h-3 w-3 mr-1" />}
                          {action === 'Create Notes' && <FileText className="h-3 w-3 mr-1" />}
                          {action === 'Generate MCQ' && <ClipboardList className="h-3 w-3 mr-1" />}
                          {action === 'Fetch Formulas' && <Lightbulb className="h-3 w-3 mr-1" />}
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Memory Insights Panel */}
      {showMemoryInsights && (
        <div className="border-t bg-muted/30">
          <MemoryInsights userId={userId} className="m-4" />
        </div>
      )}

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
              className="pr-32"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowMemoryInsights(!showMemoryInsights)}
                title="Memory insights"
              >
                <Brain className="h-4 w-4" />
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
        <p className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
          <span>Press Enter to send • Shift+Enter for new line</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setShowMemoryInsights(!showMemoryInsights)}
          >
            <Brain className="h-3 w-3 mr-1" />
            {showMemoryInsights ? 'Hide' : 'Show'} Insights
          </Button>
        </p>
      </div>
    </div>
  );
}