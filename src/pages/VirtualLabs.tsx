import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Play, 
  Clock, 
  Target, 
  Trophy, 
  FlaskConical,
  Microscope,
  Atom,
  Calculator,
  Globe,
  BookOpen,
  Star,
  TrendingUp,
  History,
  Award,
  Brain
} from 'lucide-react';
import { VirtualLab, VirtualLabSession } from '@/types/virtualLab';
import VirtualLabInterface from '@/components/VirtualLabInterface';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VirtualLabsProps {
  userId: string;
  userGrade: number;
}

const VirtualLabs: React.FC<VirtualLabsProps> = ({ userId, userGrade }) => {
  const [labs, setLabs] = useState<VirtualLab[]>([]);
  const [sessions, setSessions] = useState<VirtualLabSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState<VirtualLab | null>(null);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [activeTab, setActiveTab] = useState('available');
  
  const { toast } = useToast();

  const subjects = [
    { value: 'all', label: 'All Subjects', icon: BookOpen },
    { value: 'mathematics', label: 'Mathematics', icon: Calculator },
    { value: 'physics', label: 'Physics', icon: Atom },
    { value: 'chemistry', label: 'Chemistry', icon: FlaskConical },
    { value: 'biology', label: 'Biology', icon: Microscope }
  ];

  useEffect(() => {
    loadLabs();
    loadSessions();
  }, [userGrade]);

  const loadLabs = async () => {
    try {
      setLoading(true);
      
      // Use direct database integration (API is not available)
      console.log('Loading virtual labs from database...');
      
      const { data: dbLabs, error: dbError } = await (supabase as any)
        .from('virtual_labs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
          
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      console.log('Loaded labs from database:', dbLabs?.length || 0);
      setLabs(dbLabs || []);
      
      if (dbLabs && dbLabs.length > 0) {
        toast({
          title: "Success",
          description: `Loaded ${dbLabs.length} virtual labs`,
        });
      }
      
    } catch (error) {
      console.error('Error loading virtual labs:', error);
      toast({
        title: "Error",
        description: "Failed to load virtual labs from database",
        variant: "destructive"
      });
      setLabs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      console.log('Loading sessions for user:', userId);
      
      // Use direct database query for sessions
      const { data: dbSessions, error: dbError } = await (supabase as any)
        .from('virtual_lab_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (dbError) {
        console.error('Database error loading sessions:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      console.log('Sessions loaded from database:', dbSessions?.length || 0);
      setSessions(dbSessions || []);
      
    } catch (error) {
      console.error('Error loading lab sessions:', error);
      // Don't show error toast for sessions - it's not critical for the page to work
      setSessions([]);
    }
  };

  const filteredLabs = labs.filter(lab => {
    const matchesSearch = lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lab.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lab.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSubject = selectedSubject === 'all' || lab.subject === selectedSubject;
    const matchesDifficulty = selectedDifficulty === 'all' || lab.difficulty_level === selectedDifficulty;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const completedSessions = sessions.filter(session => session.completion_status === 'completed');
  const inProgressSessions = sessions.filter(session => session.completion_status === 'in_progress');

  const getSubjectIcon = (subject: string) => {
    const subjectData = subjects.find(s => s.value === subject);
    return subjectData?.icon || BookOpen;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const startLab = (lab: VirtualLab) => {
    setSelectedLab(lab);
    setIsLabOpen(true);
  };

  const handleLabComplete = (session: VirtualLabSession) => {
    setIsLabOpen(false);
    setSelectedLab(null);
    loadSessions(); // Reload sessions to show the completed one
    
    toast({
      title: "Lab Completed!",
      description: `You scored ${session.performance_score?.toFixed(1)}% in ${selectedLab?.title}`,
    });
  };

  const calculateAverageScore = () => {
    const completedWithScores = completedSessions.filter(s => s.performance_score !== undefined);
    if (completedWithScores.length === 0) return 0;
    
    const total = completedWithScores.reduce((sum, session) => sum + (session.performance_score || 0), 0);
    return total / completedWithScores.length;
  };

  const getTotalLabTime = () => {
    return completedSessions.reduce((total, session) => total + (session.duration_minutes || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Virtual Laboratory</h1>
          <p className="text-gray-600">Interactive science experiments and simulations</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* AI Virtual Lab Button */}
          <Button
            variant="default"
            onClick={() => window.open('/dashboard/student/virtual-labs/ai', '_blank')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Virtual Lab
          </Button>
          
          {/* Database View Button */}
          <Button
            variant="outline"
            onClick={() => window.open('/dashboard/student/virtual-labs/database', '_blank')}
            className="flex items-center gap-2"
          >
            <FlaskConical className="h-4 w-4" />
            Database View
          </Button>
          
          {/* Tutorial Button */}
          <Button
            variant="outline"
            onClick={() => window.open('/dashboard/student/virtual-labs/tutorial', '_blank')}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Tutorial
          </Button>
          
          {/* Gemini Test Button */}
          <Button
            variant="outline"
            onClick={() => window.open('/dashboard/student/virtual-labs/gemini-test', '_blank')}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Test Gemini API
          </Button>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-sm text-gray-600">Average Score</div>
                  <div className="font-semibold">{calculateAverageScore().toFixed(1)}%</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-600">Lab Time</div>
                  <div className="font-semibold">{getTotalLabTime()} min</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm text-gray-600">Completed</div>
                  <div className="font-semibold">{completedSessions.length}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search virtual labs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject.value} value={subject.value}>
                    <div className="flex items-center gap-2">
                      <subject.icon className="h-4 w-4" />
                      {subject.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Available Labs ({filteredLabs.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            In Progress ({inProgressSessions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Completed ({completedSessions.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Labs */}
        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLabs.map((lab) => {
              const SubjectIcon = getSubjectIcon(lab.subject);
              const hasSession = sessions.some(s => s.lab_id === lab.id);
              
              return (
                <Card key={lab.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <SubjectIcon className="h-5 w-5 text-blue-500" />
                        <div>
                          <CardTitle className="text-lg">{lab.title}</CardTitle>
                          <CardDescription>
                            {lab.subject} • Class {lab.class_grade}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getDifficultyColor(lab.difficulty_level)}>
                        {lab.difficulty_level}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {lab.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {lab.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {lab.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{lab.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {lab.estimated_duration} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {lab.learning_objectives.length} objectives
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => startLab(lab)} 
                      className="w-full"
                      variant={hasSession ? "outline" : "default"}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {hasSession ? 'Continue Lab' : 'Start Lab'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredLabs.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FlaskConical className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Labs Found</h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or check back later for new labs
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* In Progress Sessions */}
        <TabsContent value="in-progress">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inProgressSessions.map((session) => {
              const lab = labs.find(l => l.id === session.lab_id);
              if (!lab) return null;
              
              const SubjectIcon = getSubjectIcon(lab.subject);
              
              return (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <SubjectIcon className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{lab.title}</CardTitle>
                        <CardDescription>
                          Started {new Date(session.started_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Interactions:</span>
                        <span>{session.interactions_count}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Gestures Used:</span>
                        <span>{session.gesture_commands_used}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>AI Assistance:</span>
                        <span>{session.ai_assistance_requests}</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => startLab(lab)} 
                      className="w-full mt-4"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Continue Lab
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {inProgressSessions.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Labs in Progress</h3>
                <p className="text-gray-600">
                  Start a new lab from the Available Labs tab
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Completed Sessions */}
        <TabsContent value="completed">
          <div className="space-y-4">
            {completedSessions.map((session) => {
              const lab = labs.find(l => l.id === session.lab_id);
              if (!lab) return null;
              
              const SubjectIcon = getSubjectIcon(lab.subject);
              
              return (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <SubjectIcon className="h-6 w-6 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{lab.title}</h3>
                          <p className="text-sm text-gray-600">
                            Completed on {new Date(session.completed_at!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getPerformanceColor(session.performance_score || 0)}`}>
                          {session.performance_score?.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {session.duration_minutes} min
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-semibold">{session.interactions_count}</div>
                        <div className="text-xs text-gray-600">Interactions</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold">{session.gesture_commands_used}</div>
                        <div className="text-xs text-gray-600">Gestures</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold">{session.ai_assistance_requests}</div>
                        <div className="text-xs text-gray-600">AI Help</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {completedSessions.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Labs</h3>
                <p className="text-gray-600">
                  Complete some labs to see your progress and performance here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Lab Interface Dialog */}
      <Dialog open={isLabOpen} onOpenChange={setIsLabOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Virtual Lab Session</DialogTitle>
            <DialogDescription>
              Interactive laboratory experiment with gesture controls and AI assistance
            </DialogDescription>
          </DialogHeader>
          
          {selectedLab && (
            <div className="p-6 pt-0 max-h-[85vh] overflow-y-auto">
              <VirtualLabInterface
                lab={selectedLab}
                userId={userId}
                onComplete={handleLabComplete}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualLabs;