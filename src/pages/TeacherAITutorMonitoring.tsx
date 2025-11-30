import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import TeacherSidebar from '@/components/TeacherSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Search,
  Filter,
  Eye,
  Calendar,
  BookOpen,
  Loader2,
  BarChart3,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Session {
  id: string;
  session_name: string;
  user_id: string;
  subject?: string;
  is_active: boolean;
  started_at: string;
  last_message_at: string;
  created_at: string;
  student_name?: string;
  student_grade?: number;
  message_count?: number;
}

interface SessionMessage {
  id: string;
  role: 'student' | 'assistant';
  content: string;
  created_at: string;
}

const TeacherAITutorMonitoring = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total_sessions: 0,
    active_sessions: 0,
    total_messages: 0,
    students_using_ai: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchSessions();
    }
  }, [user]);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchQuery, subjectFilter, statusFilter]);

  const fetchSessions = async () => {
    if (!user?.id) return;
    try {
      setLoadingSessions(true);
      const response = await api.aiTutoring.getTeacherStudentSessions({
        teacher_id: user.id,
        limit: 100
      });
      
      const sessionsData = response.sessions || [];
      setSessions(sessionsData);
      
      // Calculate stats
      const activeSessions = sessionsData.filter((s: Session) => s.is_active).length;
      const uniqueStudents = new Set(sessionsData.map((s: Session) => s.user_id)).size;
      
      setStats({
        total_sessions: sessionsData.length,
        active_sessions: activeSessions,
        total_messages: sessionsData.reduce((sum: number, s: Session) => sum + (s.message_count || 0), 0),
        students_using_ai: uniqueStudents
      });
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student AI tutor sessions',
        variant: 'destructive'
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.session_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(session => session.subject === subjectFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(session => session.is_active);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(session => !session.is_active);
      }
    }

    // Sort by last message time
    filtered.sort((a, b) => 
      new Date(b.last_message_at || b.created_at).getTime() - 
      new Date(a.last_message_at || a.created_at).getTime()
    );

    setFilteredSessions(filtered);
  };

  const viewSessionDetails = async (session: Session) => {
    setSelectedSession(session);
    setViewDialogOpen(true);
    setLoadingMessages(true);
    
    try {
      const response = await api.aiTutoring.getSessionMessages(session.id, 50);
      setSessionMessages(response.messages || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load session messages',
        variant: 'destructive'
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading || loadingSessions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <TeacherSidebar />
      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            AI Tutor Monitoring
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and oversee student AI tutor sessions in your school
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sessions}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_sessions}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_messages}</div>
              <p className="text-xs text-muted-foreground">All conversations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Using AI</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students_using_ai}</div>
              <p className="text-xs text-muted-foreground">Unique students</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name or session name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>Student AI Tutor Sessions</CardTitle>
            <CardDescription>
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sessions found. Students will appear here when they start using the AI tutor.
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <Card
                      key={session.id}
                      className={cn(
                        "cursor-pointer hover:bg-accent transition-colors",
                        selectedSession?.id === session.id && "border-primary"
                      )}
                      onClick={() => viewSessionDetails(session)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{session.session_name}</h3>
                              {session.is_active && (
                                <Badge variant="default" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                              {session.subject && (
                                <Badge variant="outline" className="text-xs">
                                  {session.subject}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {session.student_name && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  <span>{session.student_name}</span>
                                  {session.student_grade && (
                                    <span className="text-xs">(Grade {session.student_grade})</span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-3 w-3" />
                                <span>{session.message_count || 0} messages</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>Last activity: {formatRelativeTime(session.last_message_at || session.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>Started: {formatDate(session.started_at)}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewSessionDetails(session);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Session Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Session Details: {selectedSession?.session_name}
              </DialogTitle>
              <DialogDescription>
                {selectedSession?.student_name && (
                  <span>Student: {selectedSession.student_name}</span>
                )}
                {selectedSession?.subject && (
                  <span className="ml-4">Subject: {selectedSession.subject}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : sessionMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages in this session
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'student' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 max-w-[80%]",
                          message.role === 'student'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                      {message.role === 'student' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary">
                            <Users className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TeacherAITutorMonitoring;





