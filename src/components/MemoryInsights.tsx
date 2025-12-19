import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Brain, TrendingUp, BookOpen, Clock, Target, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryInsightsProps {
  userId: string;
  className?: string;
}

export const MemoryInsights: React.FC<MemoryInsightsProps> = ({ userId, className }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const loadInsights = async () => {
    try {
      setLoading(true);

      // Get enhanced memory data and knowledge graph stats
      const [timeline, recentMemory, learningHistory, knowledgeStats, learningPatterns] = await Promise.all([
        api.memory.userTimeline(userId, { days_back: 7, include_learning: true }),
        api.memory.recall(userId, { context_type: 'learning', limit: 20, days_back: 30 }),
        api.memory.getLearningHistory(userId),
        api.knowledgeGraph.getUserStats(userId),
        api.memory.analyzeLearningPatterns(userId)
      ]);

      // Process insights
      const subjects = new Map<string, number>();
      const topics = new Map<string, number>();
      const dailyActivity = new Map<string, number>();

      if (recentMemory.contexts) {
        recentMemory.contexts.forEach((ctx: any) => {
          if (ctx.subject) {
            subjects.set(ctx.subject, (subjects.get(ctx.subject) || 0) + 1);
          }
          if (ctx.topic) {
            topics.set(ctx.topic, (topics.get(ctx.topic) || 0) + 1);
          }
          
          const date = new Date(ctx.stored_at).toDateString();
          dailyActivity.set(date, (dailyActivity.get(date) || 0) + 1);
        });
      }

      const processedInsights = {
        totalInteractions: recentMemory.contexts?.length || 0,
        totalSessions: learningHistory.sessions?.length || 0,
        topSubjects: Array.from(subjects.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3),
        topTopics: Array.from(topics.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        dailyActivity: Array.from(dailyActivity.entries())
          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()),
        averageDaily: timeline.summary?.average_daily_activity || 0,
        streak: calculateStreak(Array.from(dailyActivity.keys())),
        timeline: timeline.timeline || [],
        // Enhanced insights from new endpoints
        knowledgeGraph: {
          totalConcepts: knowledgeStats.total_concepts || 0,
          masteredConcepts: knowledgeStats.mastered_concepts || 0,
          averageMastery: knowledgeStats.average_mastery || 0,
          learningPathsCompleted: knowledgeStats.learning_paths_completed || 0
        },
        learningPatterns: learningPatterns.patterns || {
          preferred_subjects: [],
          peak_learning_hours: [],
          average_session_duration: 0,
          learning_velocity: 0,
          retention_rate: 0
        }
      };

      setInsights(processedInsights);

      // Get smart suggestions
      try {
        const smartSuggestions = await api.memory.smartSuggestions(userId, 'next_action', {
          recent_subjects: processedInsights.topSubjects.map(([subject]) => subject),
          interaction_count: processedInsights.totalInteractions
        });
        setSuggestions(smartSuggestions.suggestions || []);
      } catch (error) {
        console.warn('Failed to get smart suggestions:', error);
      }

    } catch (error) {
      console.error('Failed to load memory insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0;
    
    const sortedDates = dates
      .map(date => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = new Date(sortedDates[i]);
      const next = new Date(sortedDates[i + 1]);
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);
      
      const diffDays = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  useEffect(() => {
    if (userId) {
      loadInsights();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Learning Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Learning Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{insights.totalInteractions}</div>
            <div className="text-xs text-muted-foreground">Questions Asked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{insights.knowledgeGraph.totalConcepts}</div>
            <div className="text-xs text-muted-foreground">Concepts Learned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(insights.knowledgeGraph.averageMastery * 100)}%</div>
            <div className="text-xs text-muted-foreground">Avg Mastery</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{insights.streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>

        {/* Learning Patterns */}
        {insights.learningPatterns && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Learning Patterns</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Learning Velocity:</span>
                <div className="font-medium">{Math.round(insights.learningPatterns.learning_velocity * 100)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Retention Rate:</span>
                <div className="font-medium">{Math.round(insights.learningPatterns.retention_rate * 100)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Session:</span>
                <div className="font-medium">{insights.learningPatterns.average_session_duration}min</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Sessions:</span>
                <div className="font-medium">{insights.totalSessions}</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Subjects */}
        {insights.topSubjects.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Most Studied Subjects
            </h4>
            <div className="flex flex-wrap gap-2">
              {insights.topSubjects.map(([subject, count]: [string, number]) => (
                <Badge key={subject} variant="secondary" className="text-xs">
                  {subject} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent Topics */}
        {insights.topTopics.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Target className="h-4 w-4" />
              Recent Topics
            </h4>
            <div className="flex flex-wrap gap-1">
              {insights.topTopics.slice(0, 4).map(([topic, count]: [string, number]) => (
                <Badge key={topic} variant="outline" className="text-xs">
                  {topic.length > 20 ? topic.substring(0, 20) + '...' : topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              Suggested Next Steps
            </h4>
            <div className="space-y-2">
              {suggestions.slice(0, 2).map((suggestion, index) => (
                <div key={index} className="text-xs p-2 bg-muted rounded-lg">
                  <div className="font-medium">{suggestion.action || suggestion.title}</div>
                  {suggestion.reason && (
                    <div className="text-muted-foreground mt-1">{suggestion.reason}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        {insights.dailyActivity.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Recent Activity
            </h4>
            <div className="flex gap-1 h-8 items-end">
              {insights.dailyActivity.slice(-7).map(([date, count]: [string, number], index) => (
                <div
                  key={date}
                  className="flex-1 bg-primary/20 rounded-sm min-h-[4px] flex items-end justify-center"
                  style={{ height: `${Math.max(4, (count / Math.max(...insights.dailyActivity.map(([, c]: [string, number]) => c))) * 32)}px` }}
                  title={`${new Date(date).toLocaleDateString()}: ${count} interactions`}
                >
                  <div className="w-full bg-primary rounded-sm" style={{ height: '100%' }}></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>7 days ago</span>
              <span>Today</span>
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadInsights}
          className="w-full"
        >
          Refresh Insights
        </Button>
      </CardContent>
    </Card>
  );
};