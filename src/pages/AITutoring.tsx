import { useState } from 'react';
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
import { Bot, BookOpen, MessageSquare, Loader2 } from 'lucide-react';

export default function AITutoringPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [answer, setAnswer] = useState<any>(null);

  // Feedback form
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSubject, setFeedbackSubject] = useState('mathematics');

  // Study plan form
  const [planSubject, setPlanSubject] = useState('mathematics');
  const [planDays, setPlanDays] = useState(7);
  const [planHours, setPlanHours] = useState(2);

  // Question form
  const [question, setQuestion] = useState('');
  const [questionSubject, setQuestionSubject] = useState('mathematics');

  const handleGetFeedback = async () => {
    if (!feedbackContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter content to get feedback on',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.aiTutoring.getFeedback({
        user_id: user?.id || '',
        content: feedbackContent,
        subject: feedbackSubject,
      });
      setFeedback(response);
      toast({
        title: 'Feedback generated!',
        description: 'Your personalized feedback is ready',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate feedback',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    setLoading(true);
    try {
      const response = await api.aiTutoring.generateStudyPlan({
        user_id: user?.id || '',
        subject: planSubject,
        days: planDays,
        hours_per_day: planHours,
      });
      setStudyPlan(response);
      toast({
        title: 'Study plan generated!',
        description: 'Your personalized study plan is ready',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate study plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a question',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.aiTutoring.answerQuestion({
        user_id: user?.id || '',
        question,
        subject: questionSubject,
      });
      setAnswer(response);
      toast({
        title: 'Answer generated!',
        description: 'Your question has been answered',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to answer question',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="h-8 w-8" />
          AI Tutoring
        </h1>
        <p className="text-muted-foreground mt-2">
          Get personalized feedback, study plans, and answers to your questions
        </p>
      </div>

      <Tabs defaultValue="feedback" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feedback">
            <MessageSquare className="h-4 w-4 mr-2" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="study-plan">
            <BookOpen className="h-4 w-4 mr-2" />
            Study Plan
          </TabsTrigger>
          <TabsTrigger value="questions">
            <Bot className="h-4 w-4 mr-2" />
            Ask Question
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Get Personalized Feedback</CardTitle>
              <CardDescription>
                Submit your work to get AI-powered feedback and suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="feedback-subject">Subject</Label>
                <Select value={feedbackSubject} onValueChange={setFeedbackSubject}>
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
                <Label htmlFor="feedback-content">Your Work</Label>
                <Textarea
                  id="feedback-content"
                  placeholder="Paste your answer, essay, or work here..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  rows={8}
                />
              </div>
              <Button onClick={handleGetFeedback} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Get Feedback'
                )}
              </Button>
            </CardContent>
          </Card>

          {feedback && (
            <Card>
              <CardHeader>
                <CardTitle>Your Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedback.feedback?.feedback && (
                  <div>
                    <h3 className="font-semibold mb-2">Feedback</h3>
                    <p className="text-sm">{feedback.feedback.feedback}</p>
                  </div>
                )}
                {feedback.feedback?.strengths && feedback.feedback.strengths.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Strengths</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {feedback.feedback.strengths.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.feedback?.improvements && feedback.feedback.improvements.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Areas for Improvement</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {feedback.feedback.improvements.map((i: string, idx: number) => (
                        <li key={idx}>{i}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="study-plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Study Plan</CardTitle>
              <CardDescription>
                Create a personalized study plan based on your goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan-subject">Subject</Label>
                  <Select value={planSubject} onValueChange={setPlanSubject}>
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
                  <Label htmlFor="plan-days">Days</Label>
                  <Input
                    id="plan-days"
                    type="number"
                    min="1"
                    max="30"
                    value={planDays}
                    onChange={(e) => setPlanDays(parseInt(e.target.value) || 7)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="plan-hours">Hours per Day</Label>
                  <Input
                    id="plan-hours"
                    type="number"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={planHours}
                    onChange={(e) => setPlanHours(parseFloat(e.target.value) || 2)}
                  />
                </div>
              </div>
              <Button onClick={handleGenerateStudyPlan} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Study Plan'
                )}
              </Button>
            </CardContent>
          </Card>

          {studyPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Your Study Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                  {JSON.stringify(studyPlan.plan, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ask a Question</CardTitle>
              <CardDescription>
                Get AI-powered answers with explanations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="question-subject">Subject</Label>
                <Select value={questionSubject} onValueChange={setQuestionSubject}>
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
                <Label htmlFor="question">Your Question</Label>
                <Textarea
                  id="question"
                  placeholder="Ask your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleAskQuestion} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  'Ask Question'
                )}
              </Button>
            </CardContent>
          </Card>

          {answer && (
            <Card>
              <CardHeader>
                <CardTitle>Answer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {answer.answer?.answer && (
                  <div>
                    <h3 className="font-semibold mb-2">Answer</h3>
                    <p className="text-sm">{answer.answer.answer}</p>
                  </div>
                )}
                {answer.answer?.explanation && (
                  <div>
                    <h3 className="font-semibold mb-2">Explanation</h3>
                    <p className="text-sm">{answer.answer.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

