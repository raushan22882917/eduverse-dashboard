import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Neo4jMemoryManager } from "@/utils/neo4jMemory";
import {
  Brain,
  Search,
  Database,
  Clock,
  Target,
  Lightbulb,
  Trash2,
  RefreshCw
} from "lucide-react";

const MemoryTestDemo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testQuestion, setTestQuestion] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [memoryStats, setMemoryStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [neo4jStats, setNeo4jStats] = useState<any>({});

  useEffect(() => {
    if (user?.id) {
      loadMemoryStats();
      loadNeo4jStats();
    }
  }, [user]);

  const loadMemoryStats = async () => {
    if (!user?.id) return;
    
    try {
      const memoryKey = `memory_intelligence_${user.id}`;
      const memory = JSON.parse(localStorage.getItem(memoryKey) || '[]');
      
      const learningMemories = memory.filter((item: any) => item.type === 'learning');
      const subjects = [...new Set(memory.map((item: any) => item.subject))].filter(Boolean);
      
      setMemoryStats({
        totalMemories: memory.length,
        learningMemories: learningMemories.length,
        subjects: subjects,
        lastUpdated: memory.length > 0 ? memory[memory.length - 1].stored_at : null
      });
    } catch (error) {
      console.error('Failed to load memory stats:', error);
    }
  };

  const loadNeo4jStats = async () => {
    if (!user?.id) return;
    
    try {
      const memoryManager = new Neo4jMemoryManager(user.id);
      const stats = await memoryManager.getKnowledgeGraphSummary();
      setNeo4jStats(stats);
    } catch (error) {
      console.error('Failed to load Neo4j stats:', error);
    }
  };

  const testMemorySearch = async () => {
    if (!testQuestion.trim() || !user?.id) return;
    
    setLoading(true);
    try {
      // Test memory recall
      const memoryResults = await api.memory.recall(user.id, {
        context_type: 'learning',
        limit: 5,
        days_back: 30
      });

      // Test Neo4j memory
      const memoryManager = new Neo4jMemoryManager(user.id);
      const relatedConcepts = await memoryManager.getRelatedConcepts(testQuestion);

      setSearchResults([
        {
          type: 'Memory API',
          count: memoryResults.contexts?.length || 0,
          data: memoryResults.contexts?.slice(0, 3) || []
        },
        {
          type: 'Neo4j Graph',
          count: relatedConcepts.length,
          data: relatedConcepts.slice(0, 3)
        }
      ]);

      toast({
        title: "Memory Search Complete",
        description: `Found ${memoryResults.contexts?.length || 0} memory items and ${relatedConcepts.length} graph concepts.`
      });
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search memory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const storeTestMemory = async () => {
    if (!testQuestion.trim() || !user?.id) return;
    
    try {
      // Store in memory API
      await api.memory.remember(user.id, {
        type: 'learning',
        content: {
          question: testQuestion,
          answer: `This is a test answer for: ${testQuestion}`,
          subject: 'test',
          timestamp: new Date().toISOString()
        },
        subject: 'test',
        topic: testQuestion,
        importance: 0.8,
        tags: ['test', 'demo'],
        source: 'memory_test_demo'
      });

      // Store in Neo4j
      const memoryManager = new Neo4jMemoryManager(user.id);
      await memoryManager.storeInteraction({
        question: testQuestion,
        answer: `This is a test answer for: ${testQuestion}`,
        subject: 'test',
        concepts: ['test', 'demo', 'memory'],
        confidence: 0.8
      });

      toast({
        title: "Memory Stored",
        description: "Test memory has been stored in both systems."
      });

      // Refresh stats
      loadMemoryStats();
      loadNeo4jStats();
      setTestQuestion('');
    } catch (error: any) {
      toast({
        title: "Storage Failed",
        description: error.message || "Failed to store memory",
        variant: "destructive"
      });
    }
  };

  const clearAllMemory = () => {
    if (!user?.id) return;
    
    if (confirm('Are you sure you want to clear all test memory? This cannot be undone.')) {
      const memoryKey = `memory_intelligence_${user.id}`;
      const neo4jKey = `neo4j_graph_${user.id}`;
      const neo4jRelKey = `neo4j_relationships_${user.id}`;
      
      localStorage.removeItem(memoryKey);
      localStorage.removeItem(neo4jKey);
      localStorage.removeItem(neo4jRelKey);
      
      toast({
        title: "Memory Cleared",
        description: "All memory has been cleared."
      });
      
      loadMemoryStats();
      loadNeo4jStats();
      setSearchResults([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Memory System Test</h1>
        <p className="text-muted-foreground">Test the AI Tutor memory integration and Neo4j graph storage</p>
      </div>

      {/* Memory Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Memory API Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Memories</span>
                <Badge variant="outline">{memoryStats.totalMemories || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Learning Q&As</span>
                <Badge variant="outline">{memoryStats.learningMemories || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subjects</span>
                <Badge variant="outline">{memoryStats.subjects?.length || 0}</Badge>
              </div>
              {memoryStats.lastUpdated && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-xs">{new Date(memoryStats.lastUpdated).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Neo4j Graph Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Concepts</span>
                <Badge variant="outline">{neo4jStats.totalConcepts || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Questions</span>
                <Badge variant="outline">{neo4jStats.totalQuestions || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subjects</span>
                <Badge variant="outline">{Object.keys(neo4jStats.subjectDistribution || {}).length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Recent Activity</span>
                <Badge variant="outline">{neo4jStats.recentActivity?.length || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Memory Test Interface
          </CardTitle>
          <CardDescription>
            Test storing and retrieving memories from both systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a test question or topic..."
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && testMemorySearch()}
              />
              <Button onClick={testMemorySearch} disabled={loading || !testQuestion.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button onClick={storeTestMemory} disabled={!testQuestion.trim()} variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Store
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={loadMemoryStats} variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
              <Button onClick={clearAllMemory} variant="ghost" size="sm" className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Memory
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Search Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{result.type}</h4>
                    <Badge>{result.count} items</Badge>
                  </div>
                  <div className="space-y-2">
                    {result.data.map((item: any, idx: number) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                        {result.type === 'Memory API' ? (
                          <div>
                            <p className="font-medium">{item.content?.question || item.topic || 'Memory Item'}</p>
                            <p className="text-muted-foreground text-xs">
                              {item.subject} • {item.stored_at ? new Date(item.stored_at).toLocaleDateString() : 'Unknown date'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {item.subject} • Frequency: {item.properties?.frequency || 0}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemoryTestDemo;