import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Brain, Database, Network, Zap } from 'lucide-react';

export const MemoryAgentTest: React.FC = () => {
  const [userId] = useState('test_user_memory');
  const [question, setQuestion] = useState('What is photosynthesis?');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testMemoryAgent = async () => {
    try {
      setLoading(true);
      setResults(null);

      console.log('Testing Memory Agent endpoints...');

      // Test 1: Create enhanced AI tutor session
      const session = await api.enhancedAiTutor.createSession(userId);
      console.log('✅ Enhanced AI Tutor Session:', session);

      // Test 2: Store learning session
      const sessionData = await api.memory.storeSession(userId, {
        session_type: 'chat',
        subject: 'biology',
        topic: 'photosynthesis',
        questions_asked: 1,
        concepts_learned: ['photosynthesis', 'chlorophyll', 'glucose'],
        duration_minutes: 15,
        performance_score: 0.8,
        difficulty_level: 'intermediate',
        interactions: [
          {
            type: 'question',
            content: question,
            timestamp: new Date().toISOString(),
            confidence: 1.0
          },
          {
            type: 'answer',
            content: 'Photosynthesis is the process by which plants convert light energy into chemical energy...',
            timestamp: new Date().toISOString(),
            confidence: 0.9
          }
        ],
        metadata: {
          enhanced_tutor_used: true,
          session_id: session.session_id
        }
      });
      console.log('✅ Session Storage:', sessionData);

      // Test 3: Create concepts in knowledge graph
      const concepts = ['photosynthesis', 'chlorophyll', 'glucose', 'oxygen'];
      const conceptResults = [];
      for (const concept of concepts) {
        const result = await api.knowledgeGraph.createConcept(concept);
        conceptResults.push({ concept, result });
      }
      console.log('✅ Knowledge Graph Concepts:', conceptResults);

      // Test 4: Create relationships
      const relationshipResult = await api.knowledgeGraph.createRelationship(
        'photosynthesis', 
        'chlorophyll', 
        'REQUIRES'
      );
      console.log('✅ Knowledge Graph Relationship:', relationshipResult);

      // Test 5: Get learning recommendations
      const recommendations = await api.knowledgeGraph.getRecommendations(userId);
      console.log('✅ Learning Recommendations:', recommendations);

      // Test 6: Get learning insights
      const insights = await api.enhancedAiTutor.getLearningInsights(userId);
      console.log('✅ Learning Insights:', insights);

      // Test 7: Get learning history
      const history = await api.memory.getLearningHistory(userId);
      console.log('✅ Learning History:', history);

      // Test 8: Analyze learning patterns
      const patterns = await api.memory.analyzeLearningPatterns(userId);
      console.log('✅ Learning Patterns:', patterns);

      // Test 9: Get knowledge graph stats
      const graphStats = await api.knowledgeGraph.getUserStats(userId);
      console.log('✅ Knowledge Graph Stats:', graphStats);

      setResults({
        session,
        sessionData,
        conceptResults,
        relationshipResult,
        recommendations,
        insights,
        history,
        patterns,
        graphStats,
        success: true
      });

    } catch (error: any) {
      console.error('Memory Agent Test Error:', error);
      setResults({
        error: error.message,
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Memory Agent Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter test question..."
            className="flex-1"
          />
          <Button onClick={testMemoryAgent} disabled={loading}>
            {loading ? 'Testing...' : 'Test Memory Agent'}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            {results.success ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Memory Agent Test Successful!</h3>
                  <p className="text-green-700 text-sm">All endpoints are working correctly.</p>
                </div>

                {/* Session Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        Enhanced Session
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <p><strong>Session ID:</strong> {results.session?.session_id}</p>
                      <p><strong>User ID:</strong> {results.session?.user_id}</p>
                      <p><strong>Created:</strong> {new Date(results.session?.created_at).toLocaleString()}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        Session Storage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <p><strong>Success:</strong> {results.sessionData?.success ? 'Yes' : 'No'}</p>
                      <p><strong>Session ID:</strong> {results.sessionData?.session_id}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Knowledge Graph */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Network className="h-4 w-4" />
                      Knowledge Graph
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-xs font-semibold">Concepts Created:</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {results.conceptResults?.map((item: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item.concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-xs">
                        <p><strong>Relationship:</strong> photosynthesis REQUIRES chlorophyll</p>
                        <p><strong>Total Concepts:</strong> {results.graphStats?.total_concepts || 0}</p>
                        <p><strong>Mastered:</strong> {results.graphStats?.mastered_concepts || 0}</p>
                        <p><strong>Avg Mastery:</strong> {Math.round((results.graphStats?.average_mastery || 0) * 100)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Insights */}
                {results.insights?.insights && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Learning Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Learning Velocity:</span>
                          <div className="font-medium">{Math.round(results.insights.insights.learning_velocity * 100)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Retention:</span>
                          <div className="font-medium">{Math.round(results.insights.insights.knowledge_retention * 100)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Style:</span>
                          <div className="font-medium capitalize">{results.insights.insights.preferred_learning_style}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Strong Subjects:</span>
                          <div className="font-medium">{results.insights.insights.strong_subjects?.join(', ') || 'None'}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {results.recommendations?.recommendations && results.recommendations.recommendations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Learning Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {results.recommendations.recommendations.slice(0, 3).map((rec: any, index: number) => (
                          <div key={index} className="p-2 bg-muted rounded text-xs">
                            <div className="font-medium">{rec.concept?.replace(/_/g, ' ')}</div>
                            <div className="text-muted-foreground">{rec.reason}</div>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{rec.difficulty}</Badge>
                              <Badge variant="outline" className="text-xs">{rec.estimated_time}min</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">❌ Memory Agent Test Failed</h3>
                <p className="text-red-700 text-sm">{results.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};