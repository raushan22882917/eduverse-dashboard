import { FocusTimer } from '@/components/FocusTimer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Award } from 'lucide-react';

export default function FocusTimerPage() {
  const { user } = useAuth();
  const [motivation, setMotivation] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadMotivation();
      loadStats();
    }
  }, [user]);

  const loadMotivation = async () => {
    try {
      const response = await api.wellbeing.getMotivation(user?.id || '', 'daily_checkin');
      setMotivation(response.motivation);
    } catch (error) {
      console.error('Failed to load motivation:', error);
    }
  };

  const loadStats = async () => {
    // This would typically come from a stats endpoint
    // For now, we'll use placeholder data
    setStats({
      total_sessions: 0,
      total_minutes: 0,
      streak_days: 0,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Focus & Well-being</h1>
          <p className="text-muted-foreground mt-2">
            Time-box your study sessions and stay focused
          </p>
        </div>
      </div>

      {motivation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Daily Motivation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{motivation.message}</p>
            {motivation.study_tip && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2">💡 Study Tip:</p>
                <p>{motivation.study_tip}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <FocusTimer userId={user?.id || ''} />

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {stats.total_sessions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Minutes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Award className="h-5 w-5" />
                {stats.total_minutes}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Streak Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {stats.streak_days}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


