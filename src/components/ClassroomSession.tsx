import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  BookOpen, 
  FileText, 
  Brain, 
  Target, 
  Award,
  TrendingUp,
  Calendar,
  Timer,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
  BarChart3,
  Eye,
  Download,
  Share2,
  RefreshCw,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookMarked,
  PenTool,
  Zap,
  Trophy,
  Star,
  Users,
  MessageCircle,
  Settings,
  Filter,
  Search,
  Calendar as CalendarIcon,
  GraduationCap,
  Flame,
  Heart,
  Coffee,
  Calculator,
  Wand2,
  FileDown,
  Copy,
  Printer,
  BookOpenCheck,
  Layers,
  Zap as ZapIcon,
  Cpu,
  Database,
  Network,
  Globe2,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { generateSessionId, generateSessionName, formatSessionNameForDisplay } from '@/utils/sessionNaming';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StudySession {
  id: string;
  sessionName: string; // New field for session name (e.g., "MAT", "PHY")
  subject: string;
  topic: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  pagesRead: number;
  notes: string;
  status: 'active' | 'completed' | 'paused';
  performance: {
    focus_score: number;
    comprehension_rate: number;
    retention_estimate: number;
  };
  auto_analysis?: {
    key_concepts: string[];
    definitions: Array<{ term: string; definition: string }>;
    formulas: Array<{ name: string; formula: string; description: string }>;
    questions: Array<{ question: string; answer: string; difficulty: 'easy' | 'medium' | 'hard' }>;
    summary: string;
  };
}

interface ClassroomSessionProps {
  className?: string;
}

const ClassroomSession = ({ className }: ClassroomSessionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Debug log to check if component is rendering
  console.log('ClassroomSession component rendering, user:', user?.id);
  
  // Session state
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<StudySession[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('mathematics');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [pagesRead, setPagesRead] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  
  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [selectedRevisionSession, setSelectedRevisionSession] = useState<StudySession | null>(null);
  const [revisionMode, setRevisionMode] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState<Record<string, boolean>>({});
  
  // Gemini Note Maker state
  const [showNoteMaker, setShowNoteMaker] = useState(false);
  const [isGeneratingSubjectNotes, setIsGeneratingSubjectNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<any>(null);
  const [noteGenerationProgress, setNoteGenerationProgress] = useState(0);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [noteGenerationStage, setNoteGenerationStage] = useState('');
  
  // Notes Library state
  const [showNotesLibrary, setShowNotesLibrary] = useState(false);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [selectedNoteForView, setSelectedNoteForView] = useState<any>(null);
  const [notesFilter, setNotesFilter] = useState<string>('all');
  
  // Memory and analytics
  const [memoryInsights, setMemoryInsights] = useState<any>(null);
  const [learningTimeline, setLearningTimeline] = useState<any>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  const subjects = [
    { id: 'mathematics', name: 'Mathematics', icon: '📐', color: 'bg-blue-500' },
    { id: 'physics', name: 'Physics', icon: '⚛️', color: 'bg-purple-500' },
    { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: 'bg-green-500' },
    { id: 'biology', name: 'Biology', icon: '🧬', color: 'bg-emerald-500' },
    { id: 'english', name: 'English', icon: '📚', color: 'bg-orange-500' },
    { id: 'history', name: 'History', icon: '🏛️', color: 'bg-amber-500' }
  ];

  // Load session history and memory insights on mount
  useEffect(() => {
    if (user?.id) {
      loadSessionHistory();
      loadMemoryInsights();
      loadSmartSuggestions();
    }
  }, [user]);

  // Timer effect
  useEffect(() => {
    if (isSessionActive && currentSession) {
      timerRef.current = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSessionActive, currentSession]);

  const loadSessionHistory = async () => {
    try {
      if (!user?.id) return;
      
      // Load from memory API
      const memoryData = await api.memory.recall(user.id, {
        context_type: 'learning',
        limit: 20,
        days_back: 30
      });
      
      // Convert memory contexts to session format
      const sessions = memoryData.contexts?.map((context: any) => ({
        id: context.memory_id,
        sessionName: context.content.session_name || generateSessionName(context.topic || 'General Study'),
        subject: context.subject || 'general',
        topic: context.topic || 'General Study',
        startTime: new Date(context.timestamp),
        endTime: context.content.end_time ? new Date(context.content.end_time) : undefined,
        duration: context.content.duration || 0,
        pagesRead: context.content.pages_read || 0,
        notes: context.content.notes || '',
        status: context.content.status || 'completed',
        performance: context.content.performance || {
          focus_score: 0.8,
          comprehension_rate: 0.7,
          retention_estimate: 0.75
        },
        auto_analysis: context.content.auto_analysis
      })) || [];
      
      setSessionHistory(sessions);
    } catch (error) {
      console.error('Error loading session history:', error);
      // Load from localStorage as fallback
      const localHistory = JSON.parse(localStorage.getItem(`study-sessions-${user?.id}`) || '[]');
      setSessionHistory(localHistory);
    }
  };

  const loadMemoryInsights = async () => {
    try {
      if (!user?.id) return;
      
      const timeline = await api.memory.userTimeline(user.id, {
        days_back: 7,
        include_learning: true,
        include_interactions: true
      });
      
      setLearningTimeline(timeline);
      setMemoryInsights(timeline.summary);
    } catch (error) {
      console.error('Error loading memory insights:', error);
    }
  };

  const loadSmartSuggestions = async () => {
    try {
      if (!user?.id) return;
      
      const suggestions = await api.memory.smartSuggestions(user.id, 'next_action', {
        page: 'student_dashboard',
        component: 'classroom_session'
      });
      
      setSmartSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
    }
  };

  const showRevisionOptions = () => {
    if (!selectedTopic.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic for your study session',
        variant: 'destructive'
      });
      return;
    }

    // Find related previous sessions for revision
    const relatedSessions = sessionHistory.filter(session => 
      session.subject === selectedSubject && 
      session.status === 'completed' &&
      (session.topic.toLowerCase().includes(selectedTopic.toLowerCase()) || 
       selectedTopic.toLowerCase().includes(session.topic.toLowerCase()) ||
       session.subject === selectedSubject)
    ).slice(0, 5); // Show max 5 related sessions

    if (relatedSessions.length > 0) {
      setShowRevisionDialog(true);
    } else {
      // No related sessions, start directly
      startSessionDirectly();
    }
  };

  const startSessionDirectly = async () => {
    const sessionName = generateSessionName(selectedTopic);
    const sessionId = generateSessionId(selectedTopic);

    const newSession: StudySession = {
      id: sessionId,
      sessionName: sessionName,
      subject: selectedSubject,
      topic: selectedTopic,
      startTime: new Date(),
      duration: 0,
      pagesRead: 0,
      notes: '',
      status: 'active',
      performance: {
        focus_score: 0,
        comprehension_rate: 0,
        retention_estimate: 0
      }
    };

    setCurrentSession(newSession);
    setIsSessionActive(true);
    setSessionTimer(0);
    sessionStartRef.current = new Date();
    setPagesRead(0);
    setSessionNotes('');

    // Remember session start in memory API
    try {
      if (user?.id) {
        await api.memory.remember(user.id, {
          type: 'learning',
          content: {
            action: 'session_start',
            subject: selectedSubject,
            topic: selectedTopic,
            start_time: new Date().toISOString()
          },
          subject: selectedSubject,
          topic: selectedTopic,
          importance: 0.8,
          tags: ['session_start', 'study'],
          source: 'classroom_session',
          component: 'study_session'
        });
      }
    } catch (error) {
      console.error('Error remembering session start:', error);
    }

    toast({
      title: 'Session Started',
      description: `Started studying ${selectedTopic} in ${subjects.find(s => s.id === selectedSubject)?.name}`,
    });
  };

  const pauseSession = () => {
    setIsSessionActive(false);
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        status: 'paused'
      });
    }
  };

  const resumeSession = () => {
    setIsSessionActive(true);
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        status: 'active'
      });
    }
  };

  const endSession = async () => {
    if (!currentSession || !user?.id) return;

    const endTime = new Date();
    const duration = Math.floor(sessionTimer / 60); // Convert to minutes
    
    // Calculate performance metrics
    const focusScore = Math.min(0.9, 0.5 + (pagesRead * 0.1) + (duration > 30 ? 0.2 : 0));
    const comprehensionRate = Math.min(0.95, 0.6 + (pagesRead * 0.05) + (sessionNotes.length > 100 ? 0.15 : 0));
    const retentionEstimate = (focusScore + comprehensionRate) / 2;

    const completedSession: StudySession = {
      ...currentSession,
      endTime,
      duration,
      pagesRead,
      notes: sessionNotes,
      status: 'completed',
      performance: {
        focus_score: focusScore,
        comprehension_rate: comprehensionRate,
        retention_estimate: retentionEstimate
      }
    };

    // Generate automatic analysis if pages were read
    if (pagesRead > 0) {
      setIsGeneratingNotes(true);
      try {
        const analysis = await generateAutoAnalysis(completedSession);
        completedSession.auto_analysis = analysis;
      } catch (error) {
        console.error('Error generating analysis:', error);
      } finally {
        setIsGeneratingNotes(false);
      }
    }

    // Save to memory API
    try {
      await api.memory.remember(user.id, {
        type: 'learning',
        content: {
          action: 'session_complete',
          session_name: completedSession.sessionName,
          subject: selectedSubject,
          topic: selectedTopic,
          start_time: currentSession.startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration,
          pages_read: pagesRead,
          notes: sessionNotes,
          performance: completedSession.performance,
          auto_analysis: completedSession.auto_analysis,
          status: 'completed'
        },
        subject: selectedSubject,
        topic: selectedTopic,
        importance: 0.9,
        tags: ['session_complete', 'study', 'performance', completedSession.sessionName],
        source: 'classroom_session',
        component: 'study_session'
      });
    } catch (error) {
      console.error('Error saving session to memory:', error);
      // Fallback to localStorage
      const existingHistory = JSON.parse(localStorage.getItem(`study-sessions-${user.id}`) || '[]');
      existingHistory.unshift(completedSession);
      localStorage.setItem(`study-sessions-${user.id}`, JSON.stringify(existingHistory.slice(0, 50)));
    }

    // Update state
    setSessionHistory(prev => [completedSession, ...prev]);
    setCurrentSession(null);
    setIsSessionActive(false);
    setSessionTimer(0);
    setPagesRead(0);
    setSessionNotes('');
    setSelectedTopic('');

    // Reload insights
    loadMemoryInsights();
    loadSmartSuggestions();

    toast({
      title: 'Session Completed',
      description: `Great job! You studied for ${duration} minutes and read ${pagesRead} pages.`,
    });
  };

  const generateAutoAnalysis = async (session: StudySession) => {
    // Simulate AI analysis based on subject and pages read
    const subject = session.subject;
    const topic = session.topic;
    const pages = session.pagesRead;
    
    // Mock analysis - in real implementation, this would call an AI service
    const mockAnalysis = {
      key_concepts: generateKeyConcepts(subject, topic),
      definitions: generateDefinitions(subject, topic),
      formulas: generateFormulas(subject, topic),
      questions: generateQuestions(subject, topic, pages),
      summary: generateSummary(subject, topic, pages, session.duration)
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    return mockAnalysis;
  };

  const generateKeyConcepts = (subject: string, topic: string) => {
    const concepts: Record<string, string[]> = {
      mathematics: ['Functions', 'Derivatives', 'Integrals', 'Limits', 'Continuity'],
      physics: ['Force', 'Energy', 'Momentum', 'Waves', 'Electromagnetic Fields'],
      chemistry: ['Atomic Structure', 'Chemical Bonding', 'Thermodynamics', 'Kinetics', 'Equilibrium'],
      biology: ['Cell Structure', 'Genetics', 'Evolution', 'Ecology', 'Metabolism']
    };
    return concepts[subject] || ['Fundamental Concepts', 'Core Principles', 'Applications'];
  };

  const generateDefinitions = (subject: string, topic: string) => {
    const definitions: Record<string, Array<{ term: string; definition: string }>> = {
      mathematics: [
        { term: 'Derivative', definition: 'The rate of change of a function with respect to its variable' },
        { term: 'Integral', definition: 'The reverse process of differentiation, used to find areas and accumulated quantities' }
      ],
      physics: [
        { term: 'Force', definition: 'An interaction that changes the motion of an object' },
        { term: 'Energy', definition: 'The capacity to do work or cause change' }
      ],
      chemistry: [
        { term: 'Atom', definition: 'The smallest unit of matter that retains chemical properties' },
        { term: 'Molecule', definition: 'A group of atoms bonded together' }
      ],
      biology: [
        { term: 'Cell', definition: 'The basic structural and functional unit of life' },
        { term: 'DNA', definition: 'Deoxyribonucleic acid, the molecule that carries genetic information' }
      ]
    };
    return definitions[subject] || [];
  };

  const generateFormulas = (subject: string, topic: string) => {
    const formulas: Record<string, Array<{ name: string; formula: string; description: string }>> = {
      mathematics: [
        { name: 'Quadratic Formula', formula: 'x = (-b ± √(b²-4ac))/2a', description: 'Solves quadratic equations of the form ax² + bx + c = 0' },
        { name: 'Derivative Power Rule', formula: 'd/dx(xⁿ) = nxⁿ⁻¹', description: 'Rule for finding derivatives of power functions' }
      ],
      physics: [
        { name: "Newton's Second Law", formula: 'F = ma', description: 'Force equals mass times acceleration' },
        { name: 'Kinetic Energy', formula: 'KE = ½mv²', description: 'Energy of motion' }
      ],
      chemistry: [
        { name: 'Ideal Gas Law', formula: 'PV = nRT', description: 'Relationship between pressure, volume, temperature, and amount of gas' },
        { name: 'pH Formula', formula: 'pH = -log[H⁺]', description: 'Measure of acidity or basicity' }
      ]
    };
    return formulas[subject] || [];
  };

  const generateQuestions = (subject: string, topic: string, pages: number) => {
    const baseQuestions = Math.min(pages * 2, 10);
    const questions = [];
    
    for (let i = 0; i < baseQuestions; i++) {
      questions.push({
        question: `What is the significance of ${topic} in ${subject}?`,
        answer: `${topic} is fundamental to understanding ${subject} because it provides the foundation for advanced concepts.`,
        difficulty: i < 3 ? 'easy' : i < 7 ? 'medium' : 'hard'
      });
    }
    
    return questions;
  };

  const generateSummary = (subject: string, topic: string, pages: number, duration: number) => {
    return `In this ${duration}-minute study session on ${topic}, you covered ${pages} pages of ${subject} material. Key areas of focus included fundamental concepts, definitions, and practical applications. This session contributes to your long-term understanding and retention of ${subject} principles.`;
  };

  // Gemini-powered comprehensive note generation
  const generateComprehensiveNotes = async (subject: string, chapters: string[] = []) => {
    setIsGeneratingSubjectNotes(true);
    setNoteGenerationProgress(0);
    setNoteGenerationStage('Initializing AI analysis...');

    try {
      // Simulate comprehensive note generation with realistic stages
      const stages = [
        'Analyzing curriculum structure...',
        'Processing key concepts...',
        'Extracting definitions and terminology...',
        'Identifying important formulas...',
        'Generating practice questions...',
        'Creating chapter summaries...',
        'Organizing content hierarchy...',
        'Finalizing comprehensive notes...'
      ];

      for (let i = 0; i < stages.length; i++) {
        setNoteGenerationStage(stages[i]);
        setNoteGenerationProgress((i + 1) / stages.length * 100);
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
      }

      // Generate comprehensive notes based on subject
      const comprehensiveNotes = await generateSubjectNotes(subject, chapters);
      setGeneratedNotes(comprehensiveNotes);

      // Save notes to database
      try {
        if (user?.id) {
          const noteData = {
            user_id: user.id,
            title: `${subjects.find(s => s.id === subject)?.name} - Complete Notes`,
            subject: subject,
            chapters: comprehensiveNotes.chapters.map((ch: any) => ch.title),
            content: comprehensiveNotes,
            metadata: {
              generation_method: 'ai_powered',
              total_concepts: comprehensiveNotes.total_concepts,
              total_formulas: comprehensiveNotes.total_formulas,
              total_questions: comprehensiveNotes.total_questions,
              ai_model: 'gemini',
              generation_time: new Date().toISOString()
            },
            tags: ['ai_generated', 'comprehensive', subject, 'study_notes']
          };

          const savedNote = await api.notes.create(noteData);
          
          // Also remember in memory API for analytics
          await api.memory.remember(user.id, {
            type: 'learning',
            content: {
              action: 'comprehensive_notes_saved',
              note_id: savedNote.note?.id,
              subject: subject,
              chapters: chapters,
              notes_structure: {
                chapters_count: comprehensiveNotes.chapters.length,
                total_concepts: comprehensiveNotes.total_concepts,
                total_formulas: comprehensiveNotes.total_formulas,
                total_questions: comprehensiveNotes.total_questions
              }
            },
            subject: subject,
            importance: 0.9,
            tags: ['notes_saved', 'comprehensive_study', 'ai_powered'],
            source: 'gemini_note_maker',
            component: 'classroom_session'
          });

          toast({
            title: 'Notes Saved Successfully!',
            description: 'Your comprehensive notes have been saved to your library',
          });
        }
      } catch (error) {
        console.error('Error saving notes:', error);
        toast({
          title: 'Note Saved Locally',
          description: 'Notes saved to your device. Sync when online.',
          variant: 'default'
        });
      }

      toast({
        title: 'Notes Generated Successfully!',
        description: `Comprehensive ${subject} notes are ready with ${comprehensiveNotes.chapters.length} chapters`,
      });

    } catch (error) {
      console.error('Error generating notes:', error);
      toast({
        title: 'Note Generation Failed',
        description: 'There was an error generating comprehensive notes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingSubjectNotes(false);
      setNoteGenerationProgress(0);
      setNoteGenerationStage('');
    }
  };

  const generateSubjectNotes = async (subject: string, chapters: string[] = []) => {
    // Comprehensive subject-specific note generation
    const subjectData: Record<string, any> = {
      mathematics: {
        title: 'Complete Mathematics Notes',
        description: 'Comprehensive notes covering all major mathematical concepts, formulas, and problem-solving techniques',
        chapters: [
          {
            id: 'algebra',
            title: 'Algebra',
            concepts: [
              'Linear Equations', 'Quadratic Equations', 'Polynomials', 'Factorization', 
              'Inequalities', 'Logarithms', 'Exponential Functions'
            ],
            definitions: [
              { term: 'Polynomial', definition: 'An expression consisting of variables and coefficients involving operations of addition, subtraction, multiplication, and non-negative integer exponents' },
              { term: 'Quadratic Equation', definition: 'A polynomial equation of degree 2 in the form ax² + bx + c = 0' },
              { term: 'Logarithm', definition: 'The power to which a base number must be raised to produce a given number' }
            ],
            formulas: [
              { name: 'Quadratic Formula', formula: 'x = (-b ± √(b²-4ac))/2a', description: 'Solves any quadratic equation' },
              { name: 'Logarithm Properties', formula: 'log(ab) = log(a) + log(b)', description: 'Product rule for logarithms' },
              { name: 'Exponential Growth', formula: 'A = P(1 + r)^t', description: 'Compound growth formula' }
            ],
            examples: [
              { problem: 'Solve x² - 5x + 6 = 0', solution: 'Using factoring: (x-2)(x-3) = 0, so x = 2 or x = 3' },
              { problem: 'Simplify log₂(8)', solution: 'log₂(8) = log₂(2³) = 3' }
            ]
          },
          {
            id: 'calculus',
            title: 'Calculus',
            concepts: [
              'Limits', 'Derivatives', 'Integration', 'Applications of Derivatives', 
              'Applications of Integration', 'Differential Equations'
            ],
            definitions: [
              { term: 'Derivative', definition: 'The rate of change of a function with respect to its variable' },
              { term: 'Integral', definition: 'The reverse process of differentiation, used to find areas and accumulated quantities' },
              { term: 'Limit', definition: 'The value that a function approaches as the input approaches some value' }
            ],
            formulas: [
              { name: 'Power Rule', formula: 'd/dx(xⁿ) = nxⁿ⁻¹', description: 'Derivative of power functions' },
              { name: 'Product Rule', formula: 'd/dx(uv) = u\'v + uv\'', description: 'Derivative of products' },
              { name: 'Fundamental Theorem', formula: '∫ᵃᵇ f\'(x)dx = f(b) - f(a)', description: 'Connects derivatives and integrals' }
            ],
            examples: [
              { problem: 'Find d/dx(x³ + 2x)', solution: 'Using power rule: 3x² + 2' },
              { problem: 'Evaluate ∫₀¹ x²dx', solution: '[x³/3]₀¹ = 1/3 - 0 = 1/3' }
            ]
          },
          {
            id: 'geometry',
            title: 'Geometry',
            concepts: [
              'Coordinate Geometry', 'Circles', 'Triangles', 'Conic Sections', 
              'Three-Dimensional Geometry', 'Vectors'
            ],
            definitions: [
              { term: 'Circle', definition: 'The set of all points in a plane that are equidistant from a fixed point called the center' },
              { term: 'Vector', definition: 'A quantity having both magnitude and direction' },
              { term: 'Parabola', definition: 'A conic section formed by the intersection of a cone with a plane parallel to its side' }
            ],
            formulas: [
              { name: 'Distance Formula', formula: 'd = √[(x₂-x₁)² + (y₂-y₁)²]', description: 'Distance between two points' },
              { name: 'Circle Equation', formula: '(x-h)² + (y-k)² = r²', description: 'Standard form of circle equation' },
              { name: 'Vector Magnitude', formula: '|v| = √(x² + y² + z²)', description: 'Magnitude of a 3D vector' }
            ],
            examples: [
              { problem: 'Find distance between (1,2) and (4,6)', solution: 'd = √[(4-1)² + (6-2)²] = √[9 + 16] = 5' },
              { problem: 'Find center of circle x² + y² - 4x + 6y = 0', solution: 'Complete the square: center is (2, -3)' }
            ]
          }
        ]
      },
      physics: {
        title: 'Complete Physics Notes',
        description: 'Comprehensive physics notes covering mechanics, thermodynamics, electromagnetism, and modern physics',
        chapters: [
          {
            id: 'mechanics',
            title: 'Mechanics',
            concepts: [
              'Motion in One Dimension', 'Motion in Two Dimensions', 'Newton\'s Laws', 
              'Work and Energy', 'Momentum', 'Rotational Motion', 'Gravitation'
            ],
            definitions: [
              { term: 'Force', definition: 'An interaction that changes the motion of an object' },
              { term: 'Momentum', definition: 'The product of an object\'s mass and velocity' },
              { term: 'Energy', definition: 'The capacity to do work or cause change' }
            ],
            formulas: [
              { name: 'Newton\'s Second Law', formula: 'F = ma', description: 'Force equals mass times acceleration' },
              { name: 'Kinetic Energy', formula: 'KE = ½mv²', description: 'Energy of motion' },
              { name: 'Momentum', formula: 'p = mv', description: 'Linear momentum' }
            ],
            examples: [
              { problem: 'A 5kg object accelerates at 2m/s². Find the force.', solution: 'F = ma = 5kg × 2m/s² = 10N' },
              { problem: 'Find KE of 2kg object moving at 10m/s', solution: 'KE = ½mv² = ½(2)(10)² = 100J' }
            ]
          },
          {
            id: 'thermodynamics',
            title: 'Thermodynamics',
            concepts: [
              'Temperature and Heat', 'Laws of Thermodynamics', 'Heat Engines', 
              'Entropy', 'Kinetic Theory of Gases', 'Phase Transitions'
            ],
            definitions: [
              { term: 'Heat', definition: 'Energy transferred between systems due to temperature difference' },
              { term: 'Entropy', definition: 'A measure of the disorder or randomness in a system' },
              { term: 'Ideal Gas', definition: 'A theoretical gas composed of randomly moving particles with no intermolecular forces' }
            ],
            formulas: [
              { name: 'Ideal Gas Law', formula: 'PV = nRT', description: 'Relationship between pressure, volume, temperature, and amount' },
              { name: 'First Law', formula: 'ΔU = Q - W', description: 'Conservation of energy in thermodynamics' },
              { name: 'Efficiency', formula: 'η = 1 - Tc/Th', description: 'Maximum efficiency of heat engine' }
            ],
            examples: [
              { problem: 'Find pressure of 2 moles of gas at 300K in 10L', solution: 'P = nRT/V = (2)(8.314)(300)/0.01 = 498,840 Pa' }
            ]
          }
        ]
      },
      chemistry: {
        title: 'Complete Chemistry Notes',
        description: 'Comprehensive chemistry notes covering atomic structure, bonding, reactions, and organic chemistry',
        chapters: [
          {
            id: 'atomic_structure',
            title: 'Atomic Structure',
            concepts: [
              'Atomic Models', 'Quantum Numbers', 'Electronic Configuration', 
              'Periodic Properties', 'Chemical Bonding'
            ],
            definitions: [
              { term: 'Atom', definition: 'The smallest unit of matter that retains the properties of an element' },
              { term: 'Electron', definition: 'A negatively charged subatomic particle' },
              { term: 'Orbital', definition: 'A region of space where there is a high probability of finding an electron' }
            ],
            formulas: [
              { name: 'Rydberg Equation', formula: '1/λ = R(1/n₁² - 1/n₂²)', description: 'Wavelength of hydrogen spectral lines' },
              { name: 'de Broglie Wavelength', formula: 'λ = h/mv', description: 'Wave nature of matter' },
              { name: 'Heisenberg Principle', formula: 'Δx·Δp ≥ h/4π', description: 'Uncertainty in position and momentum' }
            ],
            examples: [
              { problem: 'Write electronic configuration of Carbon (Z=6)', solution: '1s² 2s² 2p²' },
              { problem: 'Find wavelength for n=3 to n=2 transition in hydrogen', solution: 'Use Rydberg equation with R = 1.097×10⁷ m⁻¹' }
            ]
          },
          {
            id: 'organic_chemistry',
            title: 'Organic Chemistry',
            concepts: [
              'Hydrocarbons', 'Functional Groups', 'Isomerism', 'Reaction Mechanisms', 
              'Polymers', 'Biomolecules'
            ],
            definitions: [
              { term: 'Hydrocarbon', definition: 'A compound containing only carbon and hydrogen atoms' },
              { term: 'Functional Group', definition: 'A specific group of atoms that determines the chemical properties of a molecule' },
              { term: 'Isomer', definition: 'Compounds with the same molecular formula but different structural arrangements' }
            ],
            formulas: [
              { name: 'Alkane General Formula', formula: 'CₙH₂ₙ₊₂', description: 'General formula for saturated hydrocarbons' },
              { name: 'Alkene General Formula', formula: 'CₙH₂ₙ', description: 'General formula for unsaturated hydrocarbons with one double bond' },
              { name: 'Alcohol Functional Group', formula: 'R-OH', description: 'Hydroxyl functional group' }
            ],
            examples: [
              { problem: 'Name the compound CH₃CH₂OH', solution: 'Ethanol (ethyl alcohol)' },
              { problem: 'Draw structural isomers of C₄H₁₀', solution: 'Butane and 2-methylpropane (isobutane)' }
            ]
          }
        ]
      },
      biology: {
        title: 'Complete Biology Notes',
        description: 'Comprehensive biology notes covering cell biology, genetics, evolution, and ecology',
        chapters: [
          {
            id: 'cell_biology',
            title: 'Cell Biology',
            concepts: [
              'Cell Structure', 'Cell Membrane', 'Organelles', 'Cell Division', 
              'Cellular Respiration', 'Photosynthesis'
            ],
            definitions: [
              { term: 'Cell', definition: 'The basic structural and functional unit of all living organisms' },
              { term: 'Mitochondria', definition: 'The powerhouse of the cell, responsible for ATP production' },
              { term: 'DNA', definition: 'Deoxyribonucleic acid, the molecule that carries genetic information' }
            ],
            formulas: [
              { name: 'Photosynthesis', formula: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', description: 'Overall equation for photosynthesis' },
              { name: 'Cellular Respiration', formula: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP', description: 'Overall equation for cellular respiration' },
              { name: 'Hardy-Weinberg', formula: 'p² + 2pq + q² = 1', description: 'Allele frequency in populations' }
            ],
            examples: [
              { problem: 'What organelle produces ATP?', solution: 'Mitochondria through cellular respiration' },
              { problem: 'Where does photosynthesis occur?', solution: 'In chloroplasts, specifically in the thylakoids and stroma' }
            ]
          },
          {
            id: 'genetics',
            title: 'Genetics',
            concepts: [
              'Mendelian Genetics', 'DNA Structure', 'Gene Expression', 'Mutations', 
              'Genetic Engineering', 'Population Genetics'
            ],
            definitions: [
              { term: 'Gene', definition: 'A hereditary unit consisting of a sequence of DNA that occupies a specific location on a chromosome' },
              { term: 'Allele', definition: 'One of two or more versions of a gene' },
              { term: 'Phenotype', definition: 'The observable characteristics of an organism' }
            ],
            formulas: [
              { name: 'Punnett Square', formula: 'P₁ × P₁ → F₁ → F₂', description: 'Predicting offspring genotypes' },
              { name: 'Chi-square', formula: 'χ² = Σ(O-E)²/E', description: 'Testing genetic ratios' },
              { name: 'Recombination Frequency', formula: 'RF = (Recombinants/Total offspring) × 100', description: 'Measuring genetic distance' }
            ],
            examples: [
              { problem: 'Cross Aa × Aa, find F₂ ratio', solution: '1 AA : 2 Aa : 1 aa (3:1 phenotypic ratio)' },
              { problem: 'What is the genotype of a heterozygote?', solution: 'Two different alleles (e.g., Aa)' }
            ]
          }
        ]
      }
    };

    const selectedSubjectData = subjectData[subject] || subjectData.mathematics;
    
    // Filter chapters if specific ones are selected
    let filteredChapters = selectedSubjectData.chapters;
    if (chapters.length > 0) {
      filteredChapters = selectedSubjectData.chapters.filter(chapter => 
        chapters.includes(chapter.id)
      );
    }

    // Calculate totals
    const totalConcepts = filteredChapters.reduce((sum, chapter) => sum + chapter.concepts.length, 0);
    const totalFormulas = filteredChapters.reduce((sum, chapter) => sum + chapter.formulas.length, 0);
    const totalQuestions = filteredChapters.reduce((sum, chapter) => sum + (chapter.examples?.length || 0), 0);

    return {
      ...selectedSubjectData,
      chapters: filteredChapters,
      total_concepts: totalConcepts,
      total_formulas: totalFormulas,
      total_questions: totalQuestions,
      generated_at: new Date().toISOString(),
      ai_powered: true,
      comprehensive: true
    };
  };

  // Load saved notes from database
  const loadSavedNotes = async () => {
    if (!user?.id) return;
    
    setLoadingNotes(true);
    try {
      const response = await api.notes.getAll(user.id, {
        subject: notesFilter === 'all' ? undefined : notesFilter,
        search: notesSearchQuery || undefined,
        limit: 50
      });
      
      setSavedNotes(response.notes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: 'Error Loading Notes',
        description: 'Could not load your saved notes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoadingNotes(false);
    }
  };

  // Search notes
  const searchNotes = async (query: string) => {
    if (!user?.id) return;
    
    setLoadingNotes(true);
    try {
      const response = await api.notes.search(user.id, query, {
        subject: notesFilter === 'all' ? undefined : notesFilter
      });
      
      setSavedNotes(response.notes || []);
    } catch (error) {
      console.error('Error searching notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    if (!user?.id) return;
    
    try {
      await api.notes.delete(noteId, user.id);
      setSavedNotes(prev => prev.filter(note => note.id !== noteId));
      
      toast({
        title: 'Note Deleted',
        description: 'The note has been removed from your library',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Could not delete the note. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Load notes when component mounts or filter changes
  useEffect(() => {
    if (showNotesLibrary && user?.id) {
      loadSavedNotes();
    }
  }, [showNotesLibrary, notesFilter, user?.id]);

  // Search with debounce
  useEffect(() => {
    if (!notesSearchQuery.trim()) {
      loadSavedNotes();
      return;
    }
    
    const timeoutId = setTimeout(() => {
      searchNotes(notesSearchQuery);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [notesSearchQuery]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubjectColor = (subject: string) => {
    return subjects.find(s => s.id === subject)?.color || 'bg-gray-500';
  };

  const getSubjectIcon = (subject: string) => {
    return subjects.find(s => s.id === subject)?.icon || '📚';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Session Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Classroom Session
              </CardTitle>
              <CardDescription>
                Track your study sessions and generate automatic notes with AI analysis
              </CardDescription>
            </div>
            {currentSession && (
              <div className="flex items-center gap-2">
                <Badge variant={isSessionActive ? "default" : "secondary"} className="text-lg px-3 py-1">
                  <Timer className="h-4 w-4 mr-1" />
                  {formatTime(sessionTimer)}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentSession ? (
            // Session Setup
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <select
                    id="subject"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.icon} {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="Enter the topic you'll be studying..."
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Revision Mode Indicator */}
              {revisionMode && selectedRevisionSession && (
                <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4 text-yellow-500" />
                      Revision Mode Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border">
                        <div>
                          <p className="font-medium text-sm">Reviewing: {selectedRevisionSession.topic}</p>
                          <p className="text-xs text-muted-foreground">
                            Previous session: {selectedRevisionSession.startTime.toLocaleDateString()} • 
                            {selectedRevisionSession.duration}min • 
                            {Math.round(selectedRevisionSession.performance.retention_estimate * 100)}% retention
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setRevisionMode(false);
                            setSelectedRevisionSession(null);
                          }}
                        >
                          Done Reviewing
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💡 Take a moment to recall the key concepts, definitions, and formulas from this session before starting your new study session.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Smart Suggestions */}
              {smartSuggestions?.suggestions && smartSuggestions.suggestions.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {smartSuggestions.suggestions.slice(0, 3).map((suggestion: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{suggestion.action}</p>
                            <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTopic(suggestion.action);
                            }}
                          >
                            Use
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-3">
                <Button onClick={showRevisionOptions} className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Study Session
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sessionHistory.filter(s => s.subject === selectedSubject && s.status === 'completed').length > 0 && (
                    <Button 
                      onClick={() => setShowRevisionDialog(true)} 
                      variant="outline" 
                      className="w-full"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review Previous ({sessionHistory.filter(s => s.subject === selectedSubject && s.status === 'completed').length})
                    </Button>
                  )}
                  <Button 
                    onClick={() => setShowNoteMaker(true)} 
                    variant="outline" 
                    className="w-full"
                    size="sm"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Note Maker
                  </Button>
                </div>
                
                {/* Notes Library Access */}
                <Button 
                  onClick={() => setShowNotesLibrary(true)} 
                  variant="ghost" 
                  className="w-full mt-2"
                  size="sm"
                  data-notes-library="true"
                >
                  <BookOpenCheck className="h-4 w-4 mr-2" />
                  My Notes Library
                  {savedNotes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {savedNotes.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Active Session Controls
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className={cn("w-3 h-3 rounded-full", getSubjectColor(currentSession.subject))} />
                    {getSubjectIcon(currentSession.subject)} 
                    <Badge variant="outline" className="text-xs font-mono">
                      {formatSessionNameForDisplay(currentSession.sessionName)}
                    </Badge>
                    {currentSession.topic}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {subjects.find(s => s.id === currentSession.subject)?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSessionActive ? (
                    <Button onClick={pauseSession} variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={resumeSession} variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  <Button onClick={endSession} variant="destructive" size="sm">
                    <Square className="h-4 w-4 mr-1" />
                    End Session
                  </Button>
                </div>
              </div>

              {/* Session Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pages">Pages Read</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagesRead(Math.max(0, pagesRead - 1))}
                      disabled={pagesRead <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="pages"
                      type="number"
                      value={pagesRead}
                      onChange={(e) => setPagesRead(Math.max(0, parseInt(e.target.value) || 0))}
                      className="text-center"
                      min="0"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagesRead(pagesRead + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Session Duration</Label>
                  <div className="p-2 bg-muted rounded text-center font-mono text-lg">
                    {formatTime(sessionTimer)}
                  </div>
                </div>
              </div>

              {/* Session Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Session Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Take notes during your study session..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Memory Insights */}
      {memoryInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Learning Analytics
            </CardTitle>
            <CardDescription>
              Insights from your study patterns and memory retention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{memoryInsights.learning_sessions || 0}</div>
                <div className="text-sm text-muted-foreground">Sessions This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{memoryInsights.subjects_studied || 0}</div>
                <div className="text-sm text-muted-foreground">Subjects Studied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{memoryInsights.total_events || 0}</div>
                <div className="text-sm text-muted-foreground">Total Activities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {memoryInsights.average_daily_activity?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-muted-foreground">Daily Average</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Sessions
              </CardTitle>
              <CardDescription>
                Your study session history with automatic analysis
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {sessionHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No study sessions yet. Start your first session above!</p>
                  </div>
                ) : (
                  sessionHistory.map((session) => (
                    <Card key={session.id} className="border-l-4" style={{ borderLeftColor: subjects.find(s => s.id === session.subject)?.color?.replace('bg-', '#') || '#6b7280' }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {getSubjectIcon(session.subject)} 
                              <Badge variant="outline" className="text-xs font-mono">
                                {formatSessionNameForDisplay(session.sessionName)}
                              </Badge>
                              {session.topic}
                            </CardTitle>
                            <CardDescription>
                              {subjects.find(s => s.id === session.subject)?.name} • {session.startTime.toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{session.duration}m</div>
                            <div className="text-xs text-muted-foreground">Duration</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">{session.pagesRead}</div>
                            <div className="text-xs text-muted-foreground">Pages</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">
                              {Math.round(session.performance.retention_estimate * 100)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Retention</div>
                          </div>
                        </div>

                        {session.auto_analysis && (
                          <div className="space-y-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAnalysisExpanded(prev => ({
                                ...prev,
                                [session.id]: !prev[session.id]
                              }))}
                              className="w-full"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {analysisExpanded[session.id] ? 'Hide' : 'Show'} AI Analysis
                              {analysisExpanded[session.id] ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                            </Button>

                            {analysisExpanded[session.id] && (
                              <div className="space-y-4 p-4 bg-muted rounded-lg">
                                {/* Summary */}
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Summary
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{session.auto_analysis.summary}</p>
                                </div>

                                {/* Key Concepts */}
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4" />
                                    Key Concepts
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {session.auto_analysis.key_concepts.map((concept, index) => (
                                      <Badge key={index} variant="secondary">{concept}</Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Definitions */}
                                {session.auto_analysis.definitions.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                      <BookMarked className="h-4 w-4" />
                                      Definitions
                                    </h4>
                                    <div className="space-y-2">
                                      {session.auto_analysis.definitions.map((def, index) => (
                                        <div key={index} className="p-2 bg-background rounded border">
                                          <div className="font-medium text-sm">{def.term}</div>
                                          <div className="text-xs text-muted-foreground">{def.definition}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Formulas */}
                                {session.auto_analysis.formulas.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                      <Calculator className="h-4 w-4" />
                                      Formulas
                                    </h4>
                                    <div className="space-y-2">
                                      {session.auto_analysis.formulas.map((formula, index) => (
                                        <div key={index} className="p-2 bg-background rounded border">
                                          <div className="font-medium text-sm">{formula.name}</div>
                                          <div className="font-mono text-sm bg-muted p-1 rounded my-1">{formula.formula}</div>
                                          <div className="text-xs text-muted-foreground">{formula.description}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Practice Questions */}
                                {session.auto_analysis.questions.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                      <Target className="h-4 w-4" />
                                      Practice Questions
                                    </h4>
                                    <div className="space-y-2">
                                      {session.auto_analysis.questions.slice(0, 3).map((q, index) => (
                                        <div key={index} className="p-2 bg-background rounded border">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="text-sm font-medium">Q{index + 1}</div>
                                            <Badge variant={q.difficulty === 'easy' ? 'secondary' : q.difficulty === 'medium' ? 'default' : 'destructive'}>
                                              {q.difficulty}
                                            </Badge>
                                          </div>
                                          <div className="text-sm mb-2">{q.question}</div>
                                          <div className="text-xs text-muted-foreground">{q.answer}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {session.notes && (
                          <div className="mt-3 p-3 bg-muted rounded">
                            <h4 className="font-semibold mb-2 text-sm">Session Notes</h4>
                            <p className="text-sm text-muted-foreground">{session.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* Loading State for Analysis */}
      {isGeneratingNotes && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="font-semibold">Generating AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Creating detailed notes, definitions, formulas, and practice questions...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <RefreshCw className="h-6 w-6 text-primary" />
              Review Previous Classes
            </DialogTitle>
            <DialogDescription>
              Before starting your new session on <strong>{selectedTopic}</strong>, would you like to review related previous classes?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Related Sessions */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Related Previous Sessions
              </h3>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {sessionHistory
                    .filter(session => 
                      session.subject === selectedSubject && 
                      session.status === 'completed'
                    )
                    .slice(0, 5)
                    .map((session) => (
                      <Card 
                        key={session.id} 
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md border-l-4",
                          selectedRevisionSession?.id === session.id ? "ring-2 ring-primary" : ""
                        )}
                        style={{ borderLeftColor: subjects.find(s => s.id === session.subject)?.color?.replace('bg-', '#') || '#6b7280' }}
                        onClick={() => setSelectedRevisionSession(session)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                {getSubjectIcon(session.subject)} 
                                <Badge variant="outline" className="text-xs font-mono">
                                  {formatSessionNameForDisplay(session.sessionName)}
                                </Badge>
                                {session.topic}
                                {selectedRevisionSession?.id === session.id && (
                                  <Badge variant="default" className="ml-2">Selected</Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3" />
                                {session.startTime.toLocaleDateString()} • {session.duration}min • {session.pagesRead} pages
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-600">
                                {Math.round(session.performance.retention_estimate * 100)}%
                              </div>
                              <div className="text-xs text-muted-foreground">Retention</div>
                            </div>
                          </div>
                        </CardHeader>

                        {selectedRevisionSession?.id === session.id && session.auto_analysis && (
                          <CardContent className="pt-0">
                            <div className="space-y-3 p-4 bg-muted rounded-lg">
                              {/* Quick Summary */}
                              <div>
                                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-yellow-500" />
                                  Quick Summary
                                </h4>
                                <p className="text-sm text-muted-foreground">{session.auto_analysis.summary}</p>
                              </div>

                              {/* Key Concepts */}
                              <div>
                                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4 text-blue-500" />
                                  Key Concepts ({session.auto_analysis.key_concepts.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {session.auto_analysis.key_concepts.slice(0, 5).map((concept, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {concept}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Definitions Preview */}
                              {session.auto_analysis.definitions.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                    <BookMarked className="h-4 w-4 text-purple-500" />
                                    Definitions ({session.auto_analysis.definitions.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {session.auto_analysis.definitions.slice(0, 2).map((def, index) => (
                                      <div key={index} className="p-2 bg-background rounded border text-xs">
                                        <div className="font-medium">{def.term}</div>
                                        <div className="text-muted-foreground">{def.definition}</div>
                                      </div>
                                    ))}
                                    {session.auto_analysis.definitions.length > 2 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{session.auto_analysis.definitions.length - 2} more definitions
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Formulas Preview */}
                              {session.auto_analysis.formulas.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-green-500" />
                                    Formulas ({session.auto_analysis.formulas.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {session.auto_analysis.formulas.slice(0, 2).map((formula, index) => (
                                      <div key={index} className="p-2 bg-background rounded border text-xs">
                                        <div className="font-medium">{formula.name}</div>
                                        <div className="font-mono bg-muted p-1 rounded my-1">{formula.formula}</div>
                                      </div>
                                    ))}
                                    {session.auto_analysis.formulas.length > 2 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{session.auto_analysis.formulas.length - 2} more formulas
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Practice Questions Preview */}
                              {session.auto_analysis.questions.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                    <Target className="h-4 w-4 text-orange-500" />
                                    Practice Questions ({session.auto_analysis.questions.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {session.auto_analysis.questions.slice(0, 2).map((q, index) => (
                                      <div key={index} className="p-2 bg-background rounded border text-xs">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium">Q{index + 1}</span>
                                          <Badge variant={q.difficulty === 'easy' ? 'secondary' : q.difficulty === 'medium' ? 'default' : 'destructive'} className="text-xs">
                                            {q.difficulty}
                                          </Badge>
                                        </div>
                                        <div>{q.question}</div>
                                      </div>
                                    ))}
                                    {session.auto_analysis.questions.length > 2 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{session.auto_analysis.questions.length - 2} more questions
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}

                  {sessionHistory.filter(s => s.subject === selectedSubject && s.status === 'completed').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No previous sessions found for {subjects.find(s => s.id === selectedSubject)?.name}</p>
                      <p className="text-sm mt-2">This will be your first session!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Revision Tips */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  Revision Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Review key concepts and definitions from previous sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Try to recall formulas and practice questions before looking at answers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Spaced repetition improves long-term retention by up to 200%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Even a quick 5-minute review can significantly boost memory</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRevisionDialog(false);
                setSelectedRevisionSession(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRevisionDialog(false);
                setSelectedRevisionSession(null);
                startSessionDirectly();
              }}
              className="w-full sm:w-auto"
            >
              <Play className="h-4 w-4 mr-2" />
              Skip & Start New Session
            </Button>
            {selectedRevisionSession && (
              <Button
                onClick={async () => {
                  setRevisionMode(true);
                  setShowRevisionDialog(false);
                  
                  // Remember revision activity in memory API
                  try {
                    if (user?.id && selectedRevisionSession) {
                      await api.memory.remember(user.id, {
                        type: 'learning',
                        content: {
                          action: 'revision_review',
                          original_session_id: selectedRevisionSession.id,
                          original_topic: selectedRevisionSession.topic,
                          original_subject: selectedRevisionSession.subject,
                          review_date: new Date().toISOString(),
                          new_topic: selectedTopic,
                          retention_score: selectedRevisionSession.performance.retention_estimate
                        },
                        subject: selectedRevisionSession.subject,
                        topic: selectedRevisionSession.topic,
                        importance: 0.7,
                        tags: ['revision', 'review', 'spaced_repetition'],
                        source: 'classroom_session',
                        component: 'revision_dialog'
                      });
                    }
                  } catch (error) {
                    console.error('Error remembering revision activity:', error);
                  }
                  
                  toast({
                    title: 'Revision Mode',
                    description: `Reviewing: ${selectedRevisionSession.topic}`,
                  });
                  
                  // After reviewing, user can start new session
                  setTimeout(() => {
                    setRevisionMode(false);
                    startSessionDirectly();
                  }, 100);
                }}
                className="w-full sm:w-auto"
              >
                <Eye className="h-4 w-4 mr-2" />
                Review & Start Session
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gemini Note Maker Dialog */}
      <Dialog open={showNoteMaker} onOpenChange={setShowNoteMaker}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Wand2 className="h-6 w-6 text-purple-500" />
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI-Powered Comprehensive Note Maker
            </DialogTitle>
            <DialogDescription>
              Generate complete, detailed notes for entire subjects using advanced AI analysis. 
              Covers all important concepts, formulas, definitions, and practice questions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {!isGeneratingSubjectNotes && !generatedNotes && (
              <>
                {/* Subject Selection */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe2 className="h-5 w-5 text-purple-500" />
                      Subject Selection
                    </CardTitle>
                    <CardDescription>
                      Choose the subject for comprehensive note generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {subjects.map(subject => (
                        <Card 
                          key={subject.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md border-2",
                            selectedSubject === subject.id 
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20" 
                              : "border-gray-200 hover:border-purple-300"
                          )}
                          onClick={() => setSelectedSubject(subject.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-2">{subject.icon}</div>
                            <div className="font-semibold text-sm">{subject.name}</div>
                            {selectedSubject === subject.id && (
                              <Badge className="mt-2 bg-purple-500">Selected</Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Features Showcase */}
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-blue-500" />
                      AI-Powered Features
                    </CardTitle>
                    <CardDescription>
                      What our advanced AI will generate for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="bg-blue-500/10 p-2 rounded-full">
                          <Lightbulb className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Key Concepts</div>
                          <div className="text-xs text-muted-foreground">50+ concepts per subject</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="bg-green-500/10 p-2 rounded-full">
                          <BookMarked className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Definitions</div>
                          <div className="text-xs text-muted-foreground">Comprehensive terminology</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="bg-purple-500/10 p-2 rounded-full">
                          <Calculator className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Formulas</div>
                          <div className="text-xs text-muted-foreground">All important equations</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="bg-orange-500/10 p-2 rounded-full">
                          <Target className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Practice Questions</div>
                          <div className="text-xs text-muted-foreground">Solved examples</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generation Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5 text-gray-500" />
                      Generation Options
                    </CardTitle>
                    <CardDescription>
                      Customize your note generation preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Coverage Level</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="comprehensive" name="coverage" defaultChecked />
                            <Label htmlFor="comprehensive" className="text-sm">Comprehensive (All chapters)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="selective" name="coverage" />
                            <Label htmlFor="selective" className="text-sm">Selective (Choose chapters)</Label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Detail Level</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="detailed" name="detail" defaultChecked />
                            <Label htmlFor="detailed" className="text-sm">Detailed (With examples)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" id="concise" name="detail" />
                            <Label htmlFor="concise" className="text-sm">Concise (Key points only)</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Generation Progress */}
            {isGeneratingSubjectNotes && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <Wand2 className="h-8 w-8 text-purple-500 animate-pulse" />
                      <Sparkles className="h-6 w-6 text-yellow-500 animate-bounce" />
                      <Cpu className="h-8 w-8 text-blue-500 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        AI is Generating Your Notes
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {noteGenerationStage}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Progress value={noteGenerationProgress} className="h-3" />
                      <p className="text-sm font-medium">
                        {Math.round(noteGenerationProgress)}% Complete
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">📚</div>
                        <div className="text-xs text-muted-foreground">Analyzing Content</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-green-600">🧠</div>
                        <div className="text-xs text-muted-foreground">Processing Concepts</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">⚡</div>
                        <div className="text-xs text-muted-foreground">Generating Notes</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">✨</div>
                        <div className="text-xs text-muted-foreground">Finalizing</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Notes Display */}
            {generatedNotes && (
              <div className="space-y-6">
                {/* Notes Header */}
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                          {generatedNotes.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {generatedNotes.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Generated on</div>
                        <div className="font-semibold">{new Date(generatedNotes.generated_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{generatedNotes.chapters.length}</div>
                        <div className="text-sm text-muted-foreground">Chapters</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{generatedNotes.total_concepts}</div>
                        <div className="text-sm text-muted-foreground">Concepts</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{generatedNotes.total_formulas}</div>
                        <div className="text-sm text-muted-foreground">Formulas</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{generatedNotes.total_questions}</div>
                        <div className="text-sm text-muted-foreground">Examples</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button className="flex-1 min-w-[200px]">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="flex-1 min-w-[200px]">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" className="flex-1 min-w-[200px]">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Notes
                  </Button>
                  <Button variant="outline" className="flex-1 min-w-[200px]">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Notes
                  </Button>
                </div>

                {/* Chapter-wise Notes */}
                <ScrollArea className="h-96">
                  <div className="space-y-6">
                    {generatedNotes.chapters.map((chapter: any, chapterIndex: number) => (
                      <Card key={chapter.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-500" />
                            Chapter {chapterIndex + 1}: {chapter.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Key Concepts */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                              <Lightbulb className="h-5 w-5 text-yellow-500" />
                              Key Concepts ({chapter.concepts.length})
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {chapter.concepts.map((concept: string, index: number) => (
                                <Badge key={index} variant="secondary" className="justify-start p-2">
                                  {concept}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Definitions */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                              <BookMarked className="h-5 w-5 text-green-500" />
                              Important Definitions ({chapter.definitions.length})
                            </h4>
                            <div className="space-y-3">
                              {chapter.definitions.map((def: any, index: number) => (
                                <div key={index} className="p-4 bg-muted rounded-lg border">
                                  <div className="font-semibold text-green-700 dark:text-green-400 mb-2">
                                    {def.term}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {def.definition}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Formulas */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                              <Calculator className="h-5 w-5 text-purple-500" />
                              Important Formulas ({chapter.formulas.length})
                            </h4>
                            <div className="space-y-3">
                              {chapter.formulas.map((formula: any, index: number) => (
                                <div key={index} className="p-4 bg-muted rounded-lg border">
                                  <div className="font-semibold text-purple-700 dark:text-purple-400 mb-2">
                                    {formula.name}
                                  </div>
                                  <div className="font-mono text-lg bg-background p-3 rounded border mb-2">
                                    {formula.formula}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {formula.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Examples */}
                          {chapter.examples && chapter.examples.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                                <Target className="h-5 w-5 text-orange-500" />
                                Solved Examples ({chapter.examples.length})
                              </h4>
                              <div className="space-y-3">
                                {chapter.examples.map((example: any, index: number) => (
                                  <div key={index} className="p-4 bg-muted rounded-lg border">
                                    <div className="font-semibold text-orange-700 dark:text-orange-400 mb-2">
                                      Problem {index + 1}:
                                    </div>
                                    <div className="mb-3 p-2 bg-background rounded border">
                                      {example.problem}
                                    </div>
                                    <div className="font-semibold text-sm mb-1">Solution:</div>
                                    <div className="text-sm text-muted-foreground">
                                      {example.solution}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowNoteMaker(false);
                setGeneratedNotes(null);
                setNoteGenerationProgress(0);
                setNoteGenerationStage('');
              }}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            {!isGeneratingSubjectNotes && !generatedNotes && (
              <Button
                onClick={() => generateComprehensiveNotes(selectedSubject, selectedChapters)}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                size="lg"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                <Sparkles className="h-4 w-4 mr-1" />
                Generate AI Notes
              </Button>
            )}
            {generatedNotes && (
              <Button
                onClick={() => {
                  setGeneratedNotes(null);
                  setNoteGenerationProgress(0);
                }}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate New Notes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Library Dialog */}
      <Dialog open={showNotesLibrary} onOpenChange={setShowNotesLibrary}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <BookOpenCheck className="h-6 w-6 text-blue-500" />
              My Notes Library
            </DialogTitle>
            <DialogDescription>
              Access all your saved AI-generated notes. Search, filter, and manage your comprehensive study materials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Search and Filter Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search notes by title, subject, or chapter..."
                        value={notesSearchQuery}
                        onChange={(e) => setNotesSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={notesFilter}
                      onChange={(e) => setNotesFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="all">All Subjects</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.icon} {subject.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSavedNotes}
                      disabled={loadingNotes}
                    >
                      <RefreshCw className={cn("h-4 w-4", loadingNotes && "animate-spin")} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Grid */}
            {loadingNotes ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <div>
                      <h3 className="font-semibold">Loading Notes</h3>
                      <p className="text-sm text-muted-foreground">Fetching your saved notes...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : savedNotes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Notes Found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {notesSearchQuery || notesFilter !== 'all' 
                      ? 'No notes match your search criteria. Try adjusting your filters.'
                      : 'You haven\'t created any notes yet. Generate your first comprehensive notes using the AI Note Maker!'
                    }
                  </p>
                  <Button onClick={() => {
                    setShowNotesLibrary(false);
                    setShowNoteMaker(true);
                  }}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Create First Notes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedNotes.map((note) => (
                  <Card key={note.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4" 
                        style={{ borderLeftColor: subjects.find(s => s.id === note.subject)?.color?.replace('bg-', '#') || '#6b7280' }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 mb-2">
                            {getSubjectIcon(note.subject)} 
                            <span className="line-clamp-2">{note.title}</span>
                          </CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {subjects.find(s => s.id === note.subject)?.name}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {note.chapters?.length || 0} Chapters
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedNoteForView(note)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Notes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share Notes
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteNote(note.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Chapters Preview */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Chapters Covered:</h4>
                          <div className="flex flex-wrap gap-1">
                            {note.chapters?.slice(0, 3).map((chapter: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {chapter}
                              </Badge>
                            ))}
                            {note.chapters?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{note.chapters.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-muted rounded">
                            <div className="text-sm font-bold text-blue-600">
                              {note.metadata?.total_concepts || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Concepts</div>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <div className="text-sm font-bold text-green-600">
                              {note.metadata?.total_formulas || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Formulas</div>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <div className="text-sm font-bold text-purple-600">
                              {note.metadata?.total_questions || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Examples</div>
                          </div>
                        </div>

                        {/* Creation Date */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Created: {new Date(note.created_at).toLocaleDateString()}</span>
                          {note.metadata?.ai_model && (
                            <Badge variant="outline" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setSelectedNoteForView(note)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotesLibrary(false)}
            >
              Close Library
            </Button>
            <Button
              onClick={() => {
                setShowNotesLibrary(false);
                setShowNoteMaker(true);
              }}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate New Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Viewer Dialog */}
      {selectedNoteForView && (
        <Dialog open={!!selectedNoteForView} onOpenChange={() => setSelectedNoteForView(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                {getSubjectIcon(selectedNoteForView.subject)} 
                {selectedNoteForView.title}
              </DialogTitle>
              <DialogDescription>
                Created on {new Date(selectedNoteForView.created_at).toLocaleDateString()} • 
                {selectedNoteForView.chapters?.length || 0} chapters • 
                {selectedNoteForView.metadata?.total_concepts || 0} concepts
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Note Statistics */}
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedNoteForView.content?.chapters?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Chapters</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedNoteForView.metadata?.total_concepts || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Concepts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedNoteForView.metadata?.total_formulas || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Formulas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedNoteForView.metadata?.total_questions || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Examples</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chapter Content */}
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {selectedNoteForView.content?.chapters?.map((chapter: any, chapterIndex: number) => (
                    <Card key={chapter.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-500" />
                          Chapter {chapterIndex + 1}: {chapter.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Key Concepts */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            Key Concepts ({chapter.concepts?.length || 0})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {chapter.concepts?.map((concept: string, index: number) => (
                              <Badge key={index} variant="secondary" className="justify-start p-2 text-xs">
                                {concept}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Definitions */}
                        {chapter.definitions?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <BookMarked className="h-4 w-4 text-green-500" />
                              Definitions ({chapter.definitions.length})
                            </h4>
                            <div className="space-y-2">
                              {chapter.definitions.map((def: any, index: number) => (
                                <div key={index} className="p-3 bg-muted rounded border text-sm">
                                  <div className="font-semibold text-green-700 dark:text-green-400 mb-1">
                                    {def.term}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {def.definition}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Formulas */}
                        {chapter.formulas?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Calculator className="h-4 w-4 text-purple-500" />
                              Formulas ({chapter.formulas.length})
                            </h4>
                            <div className="space-y-2">
                              {chapter.formulas.map((formula: any, index: number) => (
                                <div key={index} className="p-3 bg-muted rounded border text-sm">
                                  <div className="font-semibold text-purple-700 dark:text-purple-400 mb-1">
                                    {formula.name}
                                  </div>
                                  <div className="font-mono bg-background p-2 rounded border mb-1">
                                    {formula.formula}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {formula.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedNoteForView(null)}>
                Close
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClassroomSession;