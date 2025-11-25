import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Loader2, Mic, MicOff, Languages, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  subject?: string;
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
}

interface ChatInterfaceProps {
  userId: string;
  defaultSubject?: string;
}

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI tutor powered by Gemini AI and Wolfram Alpha. I can help you:\n\n✨ Understand concepts with detailed explanations\n🧮 Solve math problems with step-by-step solutions\n📚 Connect ideas across different topics\n💡 Learn through examples and practice\n\nAsk me anything about your subjects - I\'m here to teach, not just answer!',
      timestamp: new Date()
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
    setInput('');
    setLoading(true);

    try {
      // Get conversation context (last few messages)
      const context = messages
        .slice(-3)
        .map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`)
        .join('\n');

      const response = await api.aiTutoring.answerQuestion({
        user_id: userId,
        question: userMessage.content,
        subject: subject as any,
        context: context || undefined
      });

      // Get answer content - prefer answer field, fallback to explanation
      let answerContent = response.answer?.answer || response.answer?.explanation || 'I apologize, but I couldn\'t generate a response. Please try again.';
      
      // If we have step_by_step, include a summary
      if (response.answer?.step_by_step) {
        if (Array.isArray(response.answer.step_by_step) && response.answer.step_by_step.length > 0) {
          const stepCount = response.answer.step_by_step.length;
          answerContent = `${answerContent}\n\n📚 I've provided a ${stepCount}-step solution below to help you understand the process.`;
        } else if (typeof response.answer.step_by_step === 'string') {
          answerContent = `${answerContent}\n\n📚 I've provided a step-by-step solution below to help you understand the process.`;
        }
      }
      
      // Translate response if target language is set
      if (targetLanguage && targetLanguage !== 'en') {
        try {
          const translated = await api.translation.translate({
            text: answerContent,
            target_language: targetLanguage,
            source_language: 'en'
          });
          answerContent = translated.translated_text;
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
          // If it's a string, keep it as string (will be displayed as text)
          // Don't convert to array
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
          // Keep as string if it's a string
          normalized.teaching_tips = normalized.teaching_tips;
        }
        
        return normalized;
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answerContent,
        subject,
        timestamp: new Date(),
        answerData: normalizeAnswerData(response.answer),
        wolframUsed: response.wolfram_used || false
      };

      // Initialize step tracking for this message if it has steps
      const normalizedData = normalizeAnswerData(response.answer);
      if (normalizedData?.step_by_step && Array.isArray(normalizedData.step_by_step) && normalizedData.step_by_step.length > 0) {
        setCurrentStepIndex(prev => ({
          ...prev,
          [assistantMessage.id]: 0  // Start at first step
        }));
        setShowAllSteps(prev => ({
          ...prev,
          [assistantMessage.id]: false  // Start with step-by-step view
        }));
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get answer. Please try again.',
        variant: 'destructive'
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try rephrasing your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                  "max-w-[80%] p-3",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <CardContent className="p-0 space-y-3">
                  {message.wolframUsed && (
                    <div className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded inline-flex items-center gap-1">
                      <span>✓</span>
                      <span>Verified with Wolfram Alpha</span>
                    </div>
                  )}
                  
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  
                  {message.answerData?.step_by_step && (Array.isArray(message.answerData.step_by_step) || typeof message.answerData.step_by_step === 'string') && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                        <span>📚</span>
                        Step-by-Step Solution:
                      </p>
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
                                      <div key={actualIndex} className="bg-background/50 p-3 rounded-lg text-xs border border-border/30">
                                        <div className="font-semibold mb-2 flex items-center gap-2">
                                          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                                            Step {step.step_number || actualIndex + 1} of {steps.length}
                                          </span>
                                          {step.source === 'wolfram' && (
                                            <span className="text-[10px] text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">✓ Wolfram Verified</span>
                                          )}
                                        </div>
                                        <div className="font-medium mb-1 text-sm">
                                          {step.description || step.step || 'Solution Step'}
                                        </div>
                                        <div className="opacity-90 mt-2">
                                          {(() => {
                                            const content = step.content || step.reasoning;
                                            if (typeof content === 'string') {
                                              return content;
                                            } else if (typeof step === 'string') {
                                              return step;
                                            } else if (content && typeof content === 'object') {
                                              return JSON.stringify(content);
                                            } else {
                                              return JSON.stringify(step);
                                            }
                                          })()}
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
                        <p className="text-xs opacity-90 whitespace-pre-wrap">{message.answerData.step_by_step}</p>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.explanation && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs font-semibold mb-1">💡 Why This Works:</p>
                      <p className="text-xs opacity-90">{message.answerData.explanation}</p>
                    </div>
                  )}
                  
                  {message.answerData?.examples && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs font-semibold mb-1">🌍 Real-World Examples:</p>
                      {Array.isArray(message.answerData.examples) && message.answerData.examples.length > 0 ? (
                        <ul className="text-xs opacity-90 list-disc list-inside space-y-1">
                          {message.answerData.examples.map((ex: any, i: number) => {
                            let displayText = '';
                            if (typeof ex === 'string') {
                              displayText = ex;
                            } else if (ex && typeof ex === 'object') {
                              displayText = ex.title || ex.description || ex.name || JSON.stringify(ex);
                            } else {
                              displayText = String(ex);
                            }
                            return <li key={i}>{displayText}</li>;
                          })}
                        </ul>
                      ) : typeof message.answerData.examples === 'string' ? (
                        <p className="text-xs opacity-90">{message.answerData.examples}</p>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.connections && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs font-semibold mb-1">🔗 Related Concepts:</p>
                      {Array.isArray(message.answerData.connections) && message.answerData.connections.length > 0 ? (
                        <ul className="text-xs opacity-90 list-disc list-inside space-y-1">
                          {message.answerData.connections.map((conn: any, i: number) => {
                            let displayText = '';
                            if (typeof conn === 'string') {
                              displayText = conn;
                            } else if (conn && typeof conn === 'object') {
                              displayText = conn.title || conn.description || conn.name || JSON.stringify(conn);
                            } else {
                              displayText = String(conn);
                            }
                            return <li key={i}>{displayText}</li>;
                          })}
                        </ul>
                      ) : typeof message.answerData.connections === 'string' ? (
                        <p className="text-xs opacity-90">{message.answerData.connections}</p>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.visual_aids && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs font-semibold mb-2">📊 Visual Aids & Graphs:</p>
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
                        <p className="text-xs opacity-90">{message.answerData.visual_aids}</p>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.common_mistakes && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs font-semibold mb-1">⚠️ Common Mistakes to Avoid:</p>
                      {Array.isArray(message.answerData.common_mistakes) && message.answerData.common_mistakes.length > 0 ? (
                        <ul className="text-xs opacity-90 list-disc list-inside space-y-1">
                          {message.answerData.common_mistakes.map((mistake: any, i: number) => {
                            let displayText = '';
                            if (typeof mistake === 'string') {
                              displayText = mistake;
                            } else if (mistake && typeof mistake === 'object') {
                              displayText = mistake.title || mistake.description || mistake.name || JSON.stringify(mistake);
                            } else {
                              displayText = String(mistake);
                            }
                            return <li key={i}>{displayText}</li>;
                          })}
                        </ul>
                      ) : typeof message.answerData.common_mistakes === 'string' ? (
                        <p className="text-xs opacity-90">{message.answerData.common_mistakes}</p>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.practice_suggestions && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs font-semibold mb-1">📝 Practice Suggestions:</p>
                      {Array.isArray(message.answerData.practice_suggestions) && message.answerData.practice_suggestions.length > 0 ? (
                        <ul className="text-xs opacity-90 list-disc list-inside space-y-1">
                          {message.answerData.practice_suggestions.map((sug: any, i: number) => {
                            let displayText = '';
                            if (typeof sug === 'string') {
                              displayText = sug;
                            } else if (sug && typeof sug === 'object') {
                              displayText = sug.title || sug.description || sug.name || JSON.stringify(sug);
                            } else {
                              displayText = String(sug);
                            }
                            return <li key={i}>{displayText}</li>;
                          })}
                        </ul>
                      ) : typeof message.answerData.practice_suggestions === 'string' ? (
                        <p className="text-xs opacity-90">{message.answerData.practice_suggestions}</p>
                      ) : null}
                    </div>
                  )}
                  
                  {message.answerData?.teaching_tips && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs font-semibold mb-1">🎓 Learning Tips:</p>
                      {Array.isArray(message.answerData.teaching_tips) && message.answerData.teaching_tips.length > 0 ? (
                        <ul className="text-xs opacity-90 list-disc list-inside space-y-1">
                          {message.answerData.teaching_tips.map((tip: string, i: number) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      ) : typeof message.answerData.teaching_tips === 'string' ? (
                        <p className="text-xs opacity-90">{message.answerData.teaching_tips}</p>
                      ) : null}
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
    </div>
  );
}

