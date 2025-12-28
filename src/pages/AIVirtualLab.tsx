import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateText } from '@/utils/geminiApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ExperimentData {
  ph: number;
  volumeAdded: number;
  progress: number;
  isRunning: boolean;
  currentStep: number;
}

interface TitrationReaction {
  id: string;
  name: string;
  description: string;
  htmlFile: string;
  equation: string;
}

const TITRATION_REACTIONS: TitrationReaction[] = [
  {
    id: 'oxalic-permanganate',
    name: 'Oxalic Acid vs KMnO₄',
    description: 'Redox titration of oxalic acid with potassium permanganate',
    htmlFile: '/lab/chemistry/reaction.html',
    equation: '$5\\text{C}_2\\text{H}_2\\text{O}_4 + 2\\text{KMnO}_4 + 3\\text{H}_2\\text{SO}_4 \\rightarrow 2\\text{MnSO}_4 + 10\\text{CO}_2 + 8\\text{H}_2\\text{O} + \\text{K}_2\\text{SO}_4$'
  },
  {
    id: 'hcl-naoh',
    name: 'HCl vs NaOH',
    description: 'Strong acid-strong base titration',
    htmlFile: '/lab/chemistry/acid-base.html',
    equation: '$\\text{HCl} + \\text{NaOH} \\rightarrow \\text{NaCl} + \\text{H}_2\\text{O}$'
  },
  {
    id: 'acetic-naoh',
    name: 'Acetic Acid vs NaOH',
    description: 'Weak acid-strong base titration',
    htmlFile: '/lab/chemistry/weak-acid.html',
    equation: '$\\text{CH}_3\\text{COOH} + \\text{NaOH} \\rightarrow \\text{CH}_3\\text{COONa} + \\text{H}_2\\text{O}$'
  },
  {
    id: 'iodine-thiosulfate',
    name: 'I₂ vs Na₂S₂O₃',
    description: 'Iodometric titration',
    htmlFile: '/lab/chemistry/iodometric.html',
    equation: '$\\text{I}_2 + 2\\text{Na}_2\\text{S}_2\\text{O}_3 \\rightarrow 2\\text{NaI} + \\text{Na}_2\\text{S}_4\\text{O}_6$'
  }
];

const AIVirtualLab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your **AI chemistry assistant**. I can help you understand:\n\n• **Titration reactions** and mechanisms\n• **Chemical equations** like $\\text{C}_2\\text{H}_2\\text{O}_4 + \\text{KMnO}_4$\n• **Experimental procedures** and safety\n• **Data interpretation** and calculations\n\nWhat would you like to learn about?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<TitrationReaction>(TITRATION_REACTIONS[0]);
  const [experimentData, setExperimentData] = useState<ExperimentData>({
    ph: 2.5,
    volumeAdded: 0.00,
    progress: 0,
    isRunning: false,
    currentStep: 1
  });
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const callGeminiAPI = async (message: string): Promise<string> => {
    try {
      // Prepare the prompt with experiment context
      const contextualPrompt = `You are an AI chemistry teacher assistant helping with titration experiments. 
      Current experiment: ${selectedReaction.name} - ${selectedReaction.description}
      Chemical equation: ${selectedReaction.equation}
      Current state: pH=${experimentData.ph}, Volume added=${experimentData.volumeAdded}mL, Step=${experimentData.currentStep}/4.
      
      Context: The student is performing a ${selectedReaction.name} titration. Please provide educational guidance about:
      - The chemical principles involved
      - Proper laboratory techniques
      - Safety considerations
      - Interpretation of results
      - Understanding of the reaction mechanism
      
      Student question: ${message}
      
      FORMATTING INSTRUCTIONS:
      - Use proper markdown formatting for better readability
      - Use **bold** for important terms and concepts
      - Use bullet points for lists and steps
      - For chemical formulas, use LaTeX format like $\\text{H}_2\\text{SO}_4$ or $\\text{KMnO}_4$
      - For chemical equations, use LaTeX format like $\\text{A} + \\text{B} \\rightarrow \\text{C} + \\text{D}$
      - Use ### for section headings when appropriate
      - Keep responses concise but informative and well-structured
      
      Provide a helpful, educational response that guides the student through proper lab technique and explains the chemistry concepts. Focus on the specific reaction they're studying.`;

      // Use the centralized Gemini API utility
      const response = await generateText(contextualPrompt);
      return response;

    } catch (error) {
      console.error('Gemini API error:', error);
      return "I'm having trouble processing your question right now. Please try again.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const aiResponse = await callGeminiAPI(inputMessage);
      
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive"
      });
    }
  };

  const handleQuickQuestion = async (question: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    const aiResponse = await callGeminiAPI(question);
    
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const startExperiment = () => {
    setExperimentData(prev => ({ ...prev, isRunning: true }));
    
    // Simulate experiment progress
    const interval = setInterval(() => {
      setExperimentData(prev => {
        const newVolumeAdded = prev.volumeAdded + 0.5;
        const newPh = 2.5 + (newVolumeAdded * 0.2);
        const newProgress = Math.min((newVolumeAdded / 25) * 100, 100);
        
        if (newVolumeAdded >= 25) {
          clearInterval(interval);
          return {
            ...prev,
            volumeAdded: 25.0,
            ph: 7.0,
            progress: 100,
            isRunning: false,
            currentStep: 4
          };
        }
        
        return {
          ...prev,
          volumeAdded: newVolumeAdded,
          ph: newPh,
          progress: newProgress,
          currentStep: newVolumeAdded > 12 ? 3 : 2
        };
      });
    }, 500);
  };

  const resetExperiment = () => {
    setExperimentData({
      ph: 2.5,
      volumeAdded: 0.00,
      progress: 0,
      isRunning: false,
      currentStep: 1
    });
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg text-blue-600 dark:text-blue-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">VirtuLab AI</h1>
        </div>
        
        <div className="flex-1 max-w-2xl mx-12 flex items-center gap-6">
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-semibold">Exp 04: Acid-Base Titration</span>
              <span className="text-xs text-blue-600 font-medium">{experimentData.progress.toFixed(0)}% Complete</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${experimentData.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2zM4 7h12V5H4v2z" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white dark:border-gray-700"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-6 min-h-0 overflow-hidden">
        {/* AI Chat Panel - Left Side */}
        <section className="col-span-3 flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm min-h-0">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
              </div>
              <div>
                <h2 className="font-bold text-base">AI Chemistry Assistant</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Online • Ready to Help</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-0">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
                  {message.type === 'ai' ? (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      <svg className="w-4 h-4 m-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500">
                      <svg className="w-4 h-4 m-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={`flex flex-col gap-1 max-w-[85%] ${message.type === 'user' ? 'items-end' : ''}`}>
                  <span className={`text-xs font-medium ${message.type === 'user' ? 'text-gray-500 mr-1' : 'text-blue-600 ml-1'}`}>
                    {message.type === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                      : 'bg-blue-50 dark:bg-blue-900/30 text-gray-800 dark:text-gray-200 rounded-tl-none border border-blue-100 dark:border-blue-800'
                  }`}>
                    {message.type === 'ai' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-800 dark:prose-headings:text-gray-200 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-ul:text-gray-800 dark:prose-ul:text-gray-200 prose-li:text-gray-800 dark:prose-li:text-gray-200">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mt-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <span className="text-xs text-blue-600 font-medium ml-1">AI Assistant</span>
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-2xl rounded-tl-none border border-blue-100 dark:border-blue-800">
                    <div className="flex gap-1 h-4 items-center">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion("Explain the reaction mechanism")}
                  className="whitespace-nowrap text-xs"
                >
                  Explain Reaction
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion("What safety precautions should I take?")}
                  className="whitespace-nowrap text-xs"
                >
                  Safety Tips
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion("How do I calculate the concentration?")}
                  className="whitespace-nowrap text-xs"
                >
                  Calculations
                </Button>
              </div>
              <div className="relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about the titration..."
                  className="pr-10"
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Lab Visualization - Center */}
        <section className="col-span-6 relative bg-black rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 min-h-0 overflow-hidden">
          <iframe
            ref={iframeRef}
            src={selectedReaction.htmlFile}
            className="w-full h-full border-0 rounded-2xl"
            title={`${selectedReaction.name} Virtual Lab`}
            sandbox="allow-scripts allow-same-origin"
          />
        </section>

        {/* Experiment Controls - Right Side */}
        <section className="col-span-3 flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm min-h-0">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-gray-800 dark:text-white">Lab Control Panel</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Experiment guidance & controls</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => iframeRef.current?.contentWindow?.location.reload()}
                className="text-xs"
              >
                Reset Lab
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 min-h-0">
            {/* Current Experiment Info */}
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-white">{selectedReaction.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedReaction.description}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                <div className="text-xs font-mono text-gray-600 dark:text-gray-300 prose prose-xs max-w-none dark:prose-invert">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {selectedReaction.equation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Experiment Steps */}
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-800 dark:text-white">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Experiment Steps
              </h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border-2 transition-all ${
                  experimentData.currentStep === 1 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                    : experimentData.currentStep > 1 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      experimentData.currentStep === 1 
                        ? 'bg-blue-600 text-white' 
                        : experimentData.currentStep > 1 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-300 text-gray-600'
                    }`}>
                      {experimentData.currentStep > 1 ? '✓' : '1'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Oxalic Acid Setup</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Prepare the reducing agent solution</p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border-2 transition-all ${
                  experimentData.currentStep === 2 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                    : experimentData.currentStep > 2 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      experimentData.currentStep === 2 
                        ? 'bg-blue-600 text-white' 
                        : experimentData.currentStep > 2 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-300 text-gray-600'
                    }`}>
                      {experimentData.currentStep > 2 ? '✓' : '2'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Acidification</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Add sulfuric acid medium</p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border-2 transition-all ${
                  experimentData.currentStep === 3 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                    : experimentData.currentStep > 3 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      experimentData.currentStep === 3 
                        ? 'bg-blue-600 text-white' 
                        : experimentData.currentStep > 3 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-300 text-gray-600'
                    }`}>
                      {experimentData.currentStep > 3 ? '✓' : '3'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">KMnO₄ Addition</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Progressive redox titration</p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border-2 transition-all ${
                  experimentData.currentStep === 4 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      experimentData.currentStep === 4 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {experimentData.currentStep === 4 ? '✓' : '4'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Reaction Complete</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Observe endpoint and results</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reaction Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Choose Reaction Type
              </label>
              <Select
                value={selectedReaction.id}
                onValueChange={(value) => {
                  const reaction = TITRATION_REACTIONS.find(r => r.id === value);
                  if (reaction) {
                    setSelectedReaction(reaction);
                    // Add a message about the new reaction
                    const newMessage: ChatMessage = {
                      id: Date.now().toString(),
                      type: 'ai',
                      content: `Great! You've selected **${reaction.name}**. This is a ${reaction.description}.\n\n**Chemical equation:**\n${reaction.equation}\n\nFeel free to ask me any questions about this reaction!`,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, newMessage]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a titration reaction" />
                </SelectTrigger>
                <SelectContent>
                  {TITRATION_REACTIONS.map((reaction) => (
                    <SelectItem key={reaction.id} value={reaction.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{reaction.name}</span>
                        <span className="text-xs text-gray-500">{reaction.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Learning Objectives */}
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-800 dark:text-white">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learning Objectives
              </h3>
              <div className="space-y-2">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      • Understand the reaction mechanism
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      • Observe color changes and endpoints
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      • Calculate concentrations accurately
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Live Data */}
            <div className="mb-2">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-800 dark:text-white">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Live Measurements
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <Card>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">pH Level</div>
                    <div className="text-sm font-bold text-gray-800 dark:text-white">
                      {experimentData.ph.toFixed(1)} 
                      <span className="text-xs font-normal text-gray-400 ml-1">
                        {experimentData.ph < 3 ? '(acidic)' : experimentData.ph > 6.5 ? '(neutral)' : '(changing)'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Volume Added</div>
                    <div className="text-sm font-bold text-gray-800 dark:text-white">{experimentData.volumeAdded.toFixed(2)} mL</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current Step</div>
                    <div className="text-sm font-bold text-gray-800 dark:text-white">
                      Step {experimentData.currentStep} of 4
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col gap-3">
              <Button 
                onClick={startExperiment}
                disabled={experimentData.isRunning}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-9V3m0 0V1m0 2h4M7 7V3m0 4L3 7m4 0L3 3" />
                </svg>
                {experimentData.isRunning ? 'Experiment Running...' : 'Start Experiment'}
              </Button>
              <Button 
                onClick={resetExperiment}
                variant="outline"
                className="w-full py-3 font-bold rounded-lg flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Experiment
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AIVirtualLab;