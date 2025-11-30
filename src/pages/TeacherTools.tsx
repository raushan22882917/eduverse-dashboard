import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, FileText, Mail, Loader2 } from 'lucide-react';
import TeacherSidebar from '@/components/TeacherSidebar';

export default function TeacherToolsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [parentMessage, setParentMessage] = useState<any>(null);

  // Lesson plan form
  const [lpSubject, setLpSubject] = useState('mathematics');
  const [lpTopic, setLpTopic] = useState('');
  const [lpDuration, setLpDuration] = useState(45);
  const [lpGrade, setLpGrade] = useState(12);

  // Assessment form
  const [assessSubject, setAssessSubject] = useState('mathematics');
  const [assessTopic, setAssessTopic] = useState('');
  const [assessCount, setAssessCount] = useState(5);

  // Parent message form
  const [pmStudentId, setPmStudentId] = useState<string>('');
  const [pmType, setPmType] = useState('progress_update');
  const [pmSubject, setPmSubject] = useState('');
  const [pmContent, setPmContent] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const handleGenerateLessonPlan = async () => {
    if (!lpTopic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.teacher.generateLessonPlan({
        teacher_id: user?.id || '',
        subject: lpSubject,
        topic: lpTopic,
        duration_minutes: lpDuration,
        class_grade: lpGrade,
      });
      setLessonPlan(response);
      toast({
        title: 'Lesson plan generated!',
        description: 'Your lesson plan is ready',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate lesson plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!assessTopic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.teacher.createAssessment({
        teacher_id: user?.id || '',
        subject: assessSubject,
        topic: assessTopic,
        question_count: assessCount,
      });
      setAssessment(response);
      toast({
        title: 'Assessment created!',
        description: 'Your formative assessment is ready',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assessment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;
      
      setLoadingStudents(true);
      try {
        const studentsData = await api.teacher.getStudents(user.id);
        setStudents(studentsData || []);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch students',
          variant: 'destructive',
        });
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleGenerateParentMessage = async () => {
    if (!pmStudentId.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a student',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.teacher.generateParentMessage({
        teacher_id: user?.id || '',
        student_id: pmStudentId,
        message_type: pmType as any,
        subject: pmSubject && pmSubject !== "none" ? pmSubject : undefined,
        custom_content: pmContent || undefined,
      });
      setParentMessage(response);
      toast({
        title: 'Message generated!',
        description: 'Your parent message is ready',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate message',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <TeacherSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Teacher Time-Savers</h1>
            <p className="text-muted-foreground mt-2">
              AI-powered tools to save time on lesson planning, assessments, and parent communication
            </p>
          </div>

      <Tabs defaultValue="lesson-plan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lesson-plan">
            <BookOpen className="h-4 w-4 mr-2" />
            Lesson Plan
          </TabsTrigger>
          <TabsTrigger value="assessment">
            <FileText className="h-4 w-4 mr-2" />
            Assessment
          </TabsTrigger>
          <TabsTrigger value="parent-message">
            <Mail className="h-4 w-4 mr-2" />
            Parent Message
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lesson-plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Lesson Plan</CardTitle>
              <CardDescription>
                Create a comprehensive lesson plan for any topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lp-subject">Subject</Label>
                  <Select value={lpSubject} onValueChange={setLpSubject}>
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
                </div>
                <div>
                  <Label htmlFor="lp-grade">Class Grade</Label>
                  <Input
                    id="lp-grade"
                    type="number"
                    min="6"
                    max="12"
                    value={lpGrade}
                    onChange={(e) => setLpGrade(parseInt(e.target.value) || 12)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="lp-topic">Topic</Label>
                  <Input
                    id="lp-topic"
                    placeholder="e.g., Quadratic Equations, Newton's Laws"
                    value={lpTopic}
                    onChange={(e) => setLpTopic(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lp-duration">Duration (minutes)</Label>
                  <Input
                    id="lp-duration"
                    type="number"
                    min="15"
                    max="120"
                    value={lpDuration}
                    onChange={(e) => setLpDuration(parseInt(e.target.value) || 45)}
                  />
                </div>
              </div>
              <Button onClick={handleGenerateLessonPlan} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Lesson Plan'
                )}
              </Button>
            </CardContent>
          </Card>

          {lessonPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Your Lesson Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(lessonPlan.lesson_plan, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Formative Assessment</CardTitle>
              <CardDescription>
                Generate assessment questions with rubrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assess-subject">Subject</Label>
                  <Select value={assessSubject} onValueChange={setAssessSubject}>
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
                </div>
                <div>
                  <Label htmlFor="assess-count">Question Count</Label>
                  <Input
                    id="assess-count"
                    type="number"
                    min="1"
                    max="20"
                    value={assessCount}
                    onChange={(e) => setAssessCount(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="assess-topic">Topic</Label>
                  <Input
                    id="assess-topic"
                    placeholder="e.g., Integration, Organic Chemistry"
                    value={assessTopic}
                    onChange={(e) => setAssessTopic(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleCreateAssessment} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Assessment'
                )}
              </Button>
            </CardContent>
          </Card>

          {assessment && (
            <Card>
              <CardHeader>
                <CardTitle>Your Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(assessment.assessment, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="parent-message" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Parent Message</CardTitle>
              <CardDescription>
                Create professional parent communication messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pm-student-id">Student</Label>
                <Select 
                  value={pmStudentId || undefined} 
                  onValueChange={(value) => setPmStudentId(value || '')} 
                  disabled={loadingStudents}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingStudents ? "Loading students..." : "Select a student"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingStudents ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                    ) : students.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No students found</div>
                    ) : (
                      students.map((student) => (
                        <SelectItem key={student.user_id} value={student.user_id}>
                          {student.profile?.full_name || `Student ${student.user_id.slice(0, 8)}`}
                          {student.class_grade && ` (Grade ${student.class_grade})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pm-type">Message Type</Label>
                  <Select value={pmType} onValueChange={setPmType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="progress_update">Progress Update</SelectItem>
                      <SelectItem value="concern">Concern</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pm-subject">Subject (optional)</Label>
                  <Select value={pmSubject || undefined} onValueChange={setPmSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="biology">Biology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="pm-content">Custom Content (optional)</Label>
                <Textarea
                  id="pm-content"
                  placeholder="Any specific points to include..."
                  value={pmContent}
                  onChange={(e) => setPmContent(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleGenerateParentMessage} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Message'
                )}
              </Button>
            </CardContent>
          </Card>

          {parentMessage && (
            <Card>
              <CardHeader>
                <CardTitle>Your Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {parentMessage.message?.subject && (
                  <div>
                    <h3 className="font-semibold mb-2">Subject</h3>
                    <p className="text-sm">{parentMessage.message.subject}</p>
                  </div>
                )}
                {parentMessage.message?.body && (
                  <div>
                    <h3 className="font-semibold mb-2">Message</h3>
                    <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                      {parentMessage.message.greeting && (
                        <p className="mb-2">{parentMessage.message.greeting}</p>
                      )}
                      <p>{parentMessage.message.body}</p>
                      {parentMessage.message.closing && (
                        <p className="mt-4">{parentMessage.message.closing}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
        </div>
      </main>
    </div>
  );
}


