import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, Square, Clock, Target } from 'lucide-react';

interface FocusTimerProps {
  userId: string;
}

export function FocusTimer({ userId }: FocusTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>('');
  const [goal, setGoal] = useState('');
  const [distractions, setDistractions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleEndSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      const response = await api.wellbeing.startFocusSession({
        user_id: userId,
        duration_minutes: duration,
        subject: subject || undefined,
        goal: goal || undefined,
      });

      setSessionId(response.session_id);
      setTimeLeft(duration * 60);
      setIsActive(true);
      toast({
        title: 'Focus session started!',
        description: `Stay focused for ${duration} minutes`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start focus session',
        variant: 'destructive',
      });
    }
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleResume = () => {
    setIsActive(true);
  };

  const handleEndSession = async (completed: boolean = false) => {
    if (!sessionId) return;

    try {
      setIsActive(false);
      const response = await api.wellbeing.endFocusSession({
        session_id: sessionId,
        user_id: userId,
        distractions_count: distractions,
        completed,
      });

      toast({
        title: completed ? 'Session completed!' : 'Session ended',
        description: response.motivation?.message || 'Great work!',
      });

      // Reset
      setSessionId(null);
      setTimeLeft(duration * 60);
      setDistractions(0);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to end session',
        variant: 'destructive',
      });
    }
  };

  const handleDistraction = () => {
    setDistractions((prev) => prev + 1);
    toast({
      title: 'Distraction blocked!',
      description: 'Stay focused!',
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Focus Timer
        </CardTitle>
        <CardDescription>
          Time-box your study sessions and stay focused
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!sessionId ? (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="180"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 25)}
                  disabled={isActive}
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject (optional)</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
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
                <Label htmlFor="goal">Learning Goal (optional)</Label>
                <Textarea
                  id="goal"
                  placeholder="What do you want to achieve in this session?"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleStart} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Focus Session
            </Button>
          </>
        ) : (
          <>
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold font-mono">
                {formatTime(timeLeft)}
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>{goal || 'Stay focused!'}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Distractions blocked: {distractions}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              {isActive ? (
                <Button onClick={handlePause} variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={handleResume}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button onClick={() => handleEndSession(false)} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                End Session
              </Button>
              <Button onClick={handleDistraction} variant="secondary">
                Block Distraction
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


