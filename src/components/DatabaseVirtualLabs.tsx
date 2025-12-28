import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FlaskConical,
  Microscope,
  Atom,
  Calculator,
  Globe,
  BookOpen,
  Clock,
  Target,
  Play,
  Eye,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VirtualLab {
  id: string;
  title: string;
  description?: string;
  subject: string;
  class_grade: number;
  topic?: string;
  html_content: string;
  css_content?: string;
  js_content?: string;
  thumbnail_url?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  learning_objectives: string[];
  prerequisites: string[];
  tags: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const DatabaseVirtualLabs: React.FC = () => {
  const [labs, setLabs] = useState<VirtualLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const subjects = [
    { value: 'mathematics', label: 'Mathematics', icon: Calculator },
    { value: 'physics', label: 'Physics', icon: Atom },
    { value: 'chemistry', label: 'Chemistry', icon: FlaskConical },
    { value: 'biology', label: 'Biology', icon: Microscope }
  ];

  const loadLabsFromDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching virtual labs from database...');
      
      // Use type assertion to bypass TypeScript checking for virtual_labs table
      const { data: dbLabs, error: dbError } = await (supabase as any)
        .from('virtual_labs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      console.log('Raw database response:', dbLabs);
      console.log('Number of labs found:', dbLabs?.length || 0);
      
      if (dbLabs && dbLabs.length > 0) {
        // Log each lab for debugging
        dbLabs.forEach((lab, index) => {
          console.log(`Lab ${index + 1}:`, {
            id: lab.id,
            title: lab.title,
            subject: lab.subject,
            grade: lab.class_grade,
            active: lab.is_active
          });
        });
      }
      
      setLabs(dbLabs || []);
      
      toast({
        title: "Success",
        description: `Loaded ${dbLabs?.length || 0} virtual labs from database`,
      });
      
    } catch (error: any) {
      console.error('Error loading virtual labs from database:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: `Failed to load virtual labs: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabsFromDatabase();
  }, []);

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

  const previewLab = (lab: VirtualLab) => {
    // Create a preview window
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Preview: ${lab.title}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              ${lab.css_content || ''}
            </style>
          </head>
          <body>
            ${lab.html_content}
            <script>
              ${lab.js_content || ''}
            </script>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading labs from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Virtual Labs from Database</h2>
          <p className="text-gray-600">
            Showing {labs.length} labs directly from the virtual_labs table
          </p>
        </div>
        <Button onClick={loadLabsFromDatabase} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="text-blue-800">
            <strong>Debug Info:</strong>
            <ul className="mt-2 space-y-1">
              <li>• Database connection: {supabase ? '✅ Connected' : '❌ Failed'}</li>
              <li>• Labs found: {labs.length}</li>
              <li>• Table: virtual_labs</li>
              <li>• Filter: is_active = true</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Labs Grid */}
      {labs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => {
            const SubjectIcon = getSubjectIcon(lab.subject);
            
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
                    {lab.description || 'No description available'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {lab.tags?.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {lab.tags?.length > 3 && (
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
                      {lab.learning_objectives?.length || 0} objectives
                    </div>
                  </div>
                  
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => previewLab(lab)} 
                        className="flex-1"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        onClick={() => previewLab(lab)} 
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Lab
                      </Button>
                    </div>

                    {/* Debug info for each lab */}
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                      <div><strong>ID:</strong> {lab.id}</div>
                      <div><strong>Created:</strong> {new Date(lab.created_at).toLocaleDateString()}</div>
                      <div><strong>HTML:</strong> {lab.html_content?.length || 0} chars</div>
                      <div><strong>CSS:</strong> {lab.css_content?.length || 0} chars</div>
                      <div><strong>JS:</strong> {lab.js_content?.length || 0} chars</div>
                      {lab.html_content && (
                        <div className="mt-2">
                          <strong>HTML Preview:</strong>
                          <div className="bg-white p-2 rounded border text-xs font-mono max-h-20 overflow-y-auto">
                            {lab.html_content.substring(0, 200)}
                            {lab.html_content.length > 200 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FlaskConical className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Virtual Labs Found</h3>
            <p className="text-gray-600 mb-4">
              No labs found in the virtual_labs table. 
              {error ? ' Check the error above for details.' : ' The table might be empty.'}
            </p>
            <Button onClick={loadLabsFromDatabase}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Raw Data Display (for debugging) */}
      {labs.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Raw Database Data (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
              {JSON.stringify(labs, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabaseVirtualLabs;