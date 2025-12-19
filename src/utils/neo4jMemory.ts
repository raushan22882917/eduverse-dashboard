/**
 * Neo4j Memory Integration Utility
 * This utility provides graph-based memory storage and retrieval
 * for enhanced learning context and relationship mapping
 */

interface Neo4jNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

interface Neo4jRelationship {
  type: string;
  startNode: string;
  endNode: string;
  properties?: Record<string, any>;
}

interface ConceptNode {
  id: string;
  name: string;
  subject: string;
  type: 'concept' | 'topic' | 'question' | 'answer' | 'user';
  properties: {
    difficulty?: number;
    frequency?: number;
    last_accessed?: string;
    confidence?: number;
    mastery_level?: number;
  };
}

interface LearningPath {
  concepts: ConceptNode[];
  relationships: Neo4jRelationship[];
  strength: number;
  last_updated: string;
}

class Neo4jMemoryManager {
  private userId: string;
  private localGraph: Map<string, ConceptNode> = new Map();
  private localRelationships: Neo4jRelationship[] = [];

  constructor(userId: string) {
    this.userId = userId;
    this.loadLocalGraph();
  }

  /**
   * Store a learning interaction in the graph
   */
  async storeInteraction(data: {
    question: string;
    answer: string;
    subject: string;
    concepts?: string[];
    confidence?: number;
    sources?: any[];
  }): Promise<void> {
    try {
      // Create or update user node
      const userNode: ConceptNode = {
        id: `user_${this.userId}`,
        name: `User ${this.userId}`,
        subject: 'general',
        type: 'user',
        properties: {
          last_accessed: new Date().toISOString()
        }
      };
      this.localGraph.set(userNode.id, userNode);

      // Create question node
      const questionId = `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const questionNode: ConceptNode = {
        id: questionId,
        name: data.question.substring(0, 100),
        subject: data.subject,
        type: 'question',
        properties: {
          confidence: data.confidence || 0.5,
          last_accessed: new Date().toISOString(),
          frequency: 1
        }
      };
      this.localGraph.set(questionNode.id, questionNode);

      // Create answer node
      const answerId = `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const answerNode: ConceptNode = {
        id: answerId,
        name: data.answer.substring(0, 100),
        subject: data.subject,
        type: 'answer',
        properties: {
          confidence: data.confidence || 0.5,
          last_accessed: new Date().toISOString(),
          frequency: 1
        }
      };
      this.localGraph.set(answerNode.id, answerNode);

      // Create relationships
      this.localRelationships.push({
        type: 'ASKED',
        startNode: userNode.id,
        endNode: questionNode.id,
        properties: {
          timestamp: new Date().toISOString(),
          subject: data.subject
        }
      });

      this.localRelationships.push({
        type: 'ANSWERED_BY',
        startNode: questionNode.id,
        endNode: answerId,
        properties: {
          confidence: data.confidence || 0.5,
          timestamp: new Date().toISOString()
        }
      });

      // Extract and link concepts
      if (data.concepts) {
        for (const concept of data.concepts) {
          const conceptId = `concept_${concept.toLowerCase().replace(/\s+/g, '_')}`;
          let conceptNode = this.localGraph.get(conceptId);
          
          if (!conceptNode) {
            conceptNode = {
              id: conceptId,
              name: concept,
              subject: data.subject,
              type: 'concept',
              properties: {
                frequency: 1,
                last_accessed: new Date().toISOString(),
                mastery_level: 0.5
              }
            };
          } else {
            // Update frequency and access time
            conceptNode.properties.frequency = (conceptNode.properties.frequency || 0) + 1;
            conceptNode.properties.last_accessed = new Date().toISOString();
          }
          
          this.localGraph.set(conceptId, conceptNode);

          // Link question to concept
          this.localRelationships.push({
            type: 'RELATES_TO',
            startNode: questionNode.id,
            endNode: conceptId,
            properties: {
              strength: 0.8,
              timestamp: new Date().toISOString()
            }
          });

          // Link answer to concept
          this.localRelationships.push({
            type: 'EXPLAINS',
            startNode: answerId,
            endNode: conceptId,
            properties: {
              strength: 0.9,
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      // Save to localStorage
      this.saveLocalGraph();

      console.log('Stored interaction in Neo4j memory graph');
    } catch (error) {
      console.error('Failed to store interaction in Neo4j memory:', error);
    }
  }

  /**
   * Get related concepts for a given topic
   */
  async getRelatedConcepts(topic: string, subject?: string): Promise<ConceptNode[]> {
    try {
      const related: ConceptNode[] = [];
      const topicLower = topic.toLowerCase();

      // Find directly related concepts
      for (const [nodeId, node] of this.localGraph) {
        if (node.type === 'concept' && 
            (node.name.toLowerCase().includes(topicLower) || 
             topicLower.includes(node.name.toLowerCase()))) {
          if (!subject || node.subject === subject) {
            related.push(node);
          }
        }
      }

      // Find concepts connected through relationships
      const connectedConcepts = this.findConnectedConcepts(topic, subject);
      related.push(...connectedConcepts);

      // Remove duplicates and sort by relevance
      const uniqueRelated = Array.from(
        new Map(related.map(concept => [concept.id, concept])).values()
      );

      return uniqueRelated
        .sort((a, b) => (b.properties.frequency || 0) - (a.properties.frequency || 0))
        .slice(0, 10);
    } catch (error) {
      console.error('Failed to get related concepts:', error);
      return [];
    }
  }

  /**
   * Get learning path suggestions
   */
  async getLearningPath(currentTopic: string, subject: string): Promise<LearningPath | null> {
    try {
      const relatedConcepts = await this.getRelatedConcepts(currentTopic, subject);
      
      if (relatedConcepts.length === 0) {
        return null;
      }

      // Build learning path based on concept relationships and difficulty
      const sortedConcepts = relatedConcepts.sort((a, b) => {
        const diffA = a.properties.difficulty || 0.5;
        const diffB = b.properties.difficulty || 0.5;
        return diffA - diffB; // Easier concepts first
      });

      const pathRelationships = this.localRelationships.filter(rel => 
        sortedConcepts.some(concept => concept.id === rel.startNode || concept.id === rel.endNode)
      );

      return {
        concepts: sortedConcepts,
        relationships: pathRelationships,
        strength: this.calculatePathStrength(sortedConcepts, pathRelationships),
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get learning path:', error);
      return null;
    }
  }

  /**
   * Get user's knowledge graph summary
   */
  async getKnowledgeGraphSummary(): Promise<{
    totalConcepts: number;
    totalQuestions: number;
    subjectDistribution: Record<string, number>;
    masteryLevels: Record<string, number>;
    recentActivity: ConceptNode[];
  }> {
    try {
      const concepts = Array.from(this.localGraph.values()).filter(node => node.type === 'concept');
      const questions = Array.from(this.localGraph.values()).filter(node => node.type === 'question');

      const subjectDistribution: Record<string, number> = {};
      const masteryLevels: Record<string, number> = {};

      concepts.forEach(concept => {
        subjectDistribution[concept.subject] = (subjectDistribution[concept.subject] || 0) + 1;
        
        const mastery = concept.properties.mastery_level || 0.5;
        const masteryBucket = mastery < 0.3 ? 'beginner' : mastery < 0.7 ? 'intermediate' : 'advanced';
        masteryLevels[masteryBucket] = (masteryLevels[masteryBucket] || 0) + 1;
      });

      const recentActivity = Array.from(this.localGraph.values())
        .filter(node => node.properties.last_accessed)
        .sort((a, b) => new Date(b.properties.last_accessed!).getTime() - new Date(a.properties.last_accessed!).getTime())
        .slice(0, 10);

      return {
        totalConcepts: concepts.length,
        totalQuestions: questions.length,
        subjectDistribution,
        masteryLevels,
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get knowledge graph summary:', error);
      return {
        totalConcepts: 0,
        totalQuestions: 0,
        subjectDistribution: {},
        masteryLevels: {},
        recentActivity: []
      };
    }
  }

  private findConnectedConcepts(topic: string, subject?: string): ConceptNode[] {
    const connected: ConceptNode[] = [];
    const topicLower = topic.toLowerCase();

    // Find questions related to the topic
    const relatedQuestions = Array.from(this.localGraph.values()).filter(node => 
      node.type === 'question' && 
      node.name.toLowerCase().includes(topicLower) &&
      (!subject || node.subject === subject)
    );

    // Find concepts connected to these questions
    for (const question of relatedQuestions) {
      const questionRelationships = this.localRelationships.filter(rel => 
        rel.startNode === question.id || rel.endNode === question.id
      );

      for (const rel of questionRelationships) {
        const connectedNodeId = rel.startNode === question.id ? rel.endNode : rel.startNode;
        const connectedNode = this.localGraph.get(connectedNodeId);
        
        if (connectedNode && connectedNode.type === 'concept') {
          connected.push(connectedNode);
        }
      }
    }

    return connected;
  }

  private calculatePathStrength(concepts: ConceptNode[], relationships: Neo4jRelationship[]): number {
    if (concepts.length === 0) return 0;

    const avgFrequency = concepts.reduce((sum, concept) => 
      sum + (concept.properties.frequency || 0), 0) / concepts.length;
    
    const avgMastery = concepts.reduce((sum, concept) => 
      sum + (concept.properties.mastery_level || 0.5), 0) / concepts.length;

    const relationshipStrength = relationships.reduce((sum, rel) => 
      sum + (rel.properties?.strength || 0.5), 0) / Math.max(relationships.length, 1);

    return (avgFrequency * 0.3 + avgMastery * 0.4 + relationshipStrength * 0.3) / 3;
  }

  private loadLocalGraph(): void {
    try {
      const graphData = localStorage.getItem(`neo4j_graph_${this.userId}`);
      const relationshipData = localStorage.getItem(`neo4j_relationships_${this.userId}`);

      if (graphData) {
        const nodes = JSON.parse(graphData);
        this.localGraph = new Map(Object.entries(nodes));
      }

      if (relationshipData) {
        this.localRelationships = JSON.parse(relationshipData);
      }
    } catch (error) {
      console.error('Failed to load local graph:', error);
    }
  }

  private saveLocalGraph(): void {
    try {
      const graphData = Object.fromEntries(this.localGraph);
      localStorage.setItem(`neo4j_graph_${this.userId}`, JSON.stringify(graphData));
      localStorage.setItem(`neo4j_relationships_${this.userId}`, JSON.stringify(this.localRelationships));
    } catch (error) {
      console.error('Failed to save local graph:', error);
    }
  }
}

export { Neo4jMemoryManager, type ConceptNode, type LearningPath };