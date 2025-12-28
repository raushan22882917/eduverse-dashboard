import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Code, 
  Palette, 
  Zap, 
  Save,
  X,
  FlaskConical,
  Microscope,
  Atom,
  Calculator
} from 'lucide-react';
import { VirtualLab } from '@/types/virtualLab';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VirtualLabManagerProps {
  userRole: 'admin' | 'teacher';
}

const VirtualLabManager: React.FC<VirtualLabManagerProps> = ({ userRole }) => {
  const [labs, setLabs] = useState<VirtualLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState<VirtualLab | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class_grade: 10,
    topic: '',
    html_content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Virtual Lab</title>\n</head>\n<body>\n    <div class="lab-container">\n        <h1>My Virtual Lab</h1>\n        <p>Add your experiment content here...</p>\n    </div>\n</body>\n</html>',
    css_content: '',
    js_content: '',
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimated_duration: 30,
    learning_objectives: [''],
    prerequisites: [''],
    tags: ['']
  });
  const [activeTab, setActiveTab] = useState('html');
  const { toast } = useToast();

  const subjects = [
    { value: 'mathematics', label: 'Mathematics', icon: Calculator },
    { value: 'physics', label: 'Physics', icon: Atom },
    { value: 'chemistry', label: 'Chemistry', icon: FlaskConical },
    { value: 'biology', label: 'Biology', icon: Microscope }
  ];

  useEffect(() => {
    loadLabs();
  }, []);

  const loadLabs = async () => {
    try {
      setLoading(true);
      
      // Use direct database integration instead of API
      console.log('Loading virtual labs from database...');
      
      const { data: dbLabs, error: dbError } = await (supabase as any)
        .from('virtual_labs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      console.log('Loaded labs from database:', dbLabs?.length || 0);
      setLabs(dbLabs || []);
      
      toast({
        title: "Success",
        description: `Loaded ${dbLabs?.length || 0} virtual labs from database`,
      });
      
    } catch (error) {
      console.error('Error loading virtual labs:', error);
      toast({
        title: "Error",
        description: "Failed to load virtual labs from database",
        variant: "destructive"
      });
      setLabs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLab = async () => {
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast({
          title: "Validation Error",
          description: "Lab title is required",
          variant: "destructive"
        });
        return;
      }

      if (!formData.subject) {
        toast({
          title: "Validation Error", 
          description: "Subject is required",
          variant: "destructive"
        });
        return;
      }

      if (!formData.html_content.trim()) {
        toast({
          title: "Validation Error",
          description: "HTML content is required",
          variant: "destructive"
        });
        return;
      }

      if (!formData.description.trim()) {
        toast({
          title: "Validation Error",
          description: "Lab description is required",
          variant: "destructive"
        });
        return;
      }

      if (!formData.topic.trim()) {
        toast({
          title: "Validation Error",
          description: "Lab topic is required", 
          variant: "destructive"
        });
        return;
      }

      if (formData.estimated_duration < 5 || formData.estimated_duration > 300) {
        toast({
          title: "Validation Error",
          description: "Duration must be between 5 and 300 minutes",
          variant: "destructive"
        });
        return;
      }

      if (formData.class_grade < 1 || formData.class_grade > 12) {
        toast({
          title: "Validation Error",
          description: "Class grade must be between 1 and 12",
          variant: "destructive"
        });
        return;
      }

      // Get current user ID (you'll need to implement this based on your auth system)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create labs",
          variant: "destructive"
        });
        return;
      }

      // Prepare lab data for database insertion
      const labData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        class_grade: formData.class_grade,
        topic: formData.topic.trim(),
        html_content: formData.html_content.trim(),
        css_content: formData.css_content.trim() || null,
        js_content: formData.js_content.trim() || null,
        difficulty_level: formData.difficulty_level,
        estimated_duration: formData.estimated_duration,
        learning_objectives: formData.learning_objectives
          .filter(obj => obj.trim())
          .length > 0 ? formData.learning_objectives.filter(obj => obj.trim()) : [],
        prerequisites: formData.prerequisites
          .filter(req => req.trim())
          .length > 0 ? formData.prerequisites.filter(req => req.trim()) : [],
        tags: formData.tags
          .filter(tag => tag.trim())
          .length > 0 ? formData.tags.filter(tag => tag.trim()) : [],
        is_active: true,
        created_by: user.id
      };

      console.log('Creating lab in database:', labData);

      // Insert directly into database
      const { data: newLab, error: dbError } = await (supabase as any)
        .from('virtual_labs')
        .insert([labData])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Lab created successfully:', newLab);
      
      toast({
        title: "Success",
        description: "Virtual lab created successfully"
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      loadLabs();
    } catch (error) {
      console.error('Error creating lab:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create virtual lab",
        variant: "destructive"
      });
    }
  };

  const handleUpdateLab = async () => {
    if (!selectedLab) return;

    try {
      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        class_grade: formData.class_grade,
        topic: formData.topic.trim(),
        html_content: formData.html_content.trim(),
        css_content: formData.css_content.trim() || null,
        js_content: formData.js_content.trim() || null,
        difficulty_level: formData.difficulty_level,
        estimated_duration: formData.estimated_duration,
        learning_objectives: formData.learning_objectives.filter(obj => obj.trim()),
        prerequisites: formData.prerequisites.filter(req => req.trim()),
        tags: formData.tags.filter(tag => tag.trim()),
        updated_at: new Date().toISOString()
      };

      console.log('Updating lab in database:', updates);

      const { error: dbError } = await (supabase as any)
        .from('virtual_labs')
        .update(updates)
        .eq('id', selectedLab.id);

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      toast({
        title: "Success",
        description: "Virtual lab updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setSelectedLab(null);
      resetForm();
      loadLabs();
    } catch (error) {
      console.error('Error updating lab:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update virtual lab",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLab = async (labId: string) => {
    if (!confirm('Are you sure you want to delete this virtual lab?')) return;

    try {
      console.log('Deleting lab from database:', labId);

      const { error: dbError } = await (supabase as any)
        .from('virtual_labs')
        .delete()
        .eq('id', labId);

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      toast({
        title: "Success",
        description: "Virtual lab deleted successfully"
      });
      
      loadLabs();
    } catch (error) {
      console.error('Error deleting lab:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete virtual lab",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      class_grade: 10,
      topic: '',
      html_content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Virtual Lab</title>\n</head>\n<body>\n    <div class="lab-container">\n        <h1>My Virtual Lab</h1>\n        <p>Add your experiment content here...</p>\n    </div>\n</body>\n</html>',
      css_content: '',
      js_content: '',
      difficulty_level: 'beginner',
      estimated_duration: 30,
      learning_objectives: [''],
      prerequisites: [''],
      tags: ['']
    });
  };

  const addArrayField = (field: 'learning_objectives' | 'prerequisites' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayField = (field: 'learning_objectives' | 'prerequisites' | 'tags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayField = (field: 'learning_objectives' | 'prerequisites' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const openEditDialog = (lab: VirtualLab) => {
    setSelectedLab(lab);
    setFormData({
      title: lab.title,
      description: lab.description || '',
      subject: lab.subject,
      class_grade: lab.class_grade,
      topic: lab.topic || '',
      html_content: lab.html_content,
      css_content: lab.css_content || '',
      js_content: lab.js_content || '',
      difficulty_level: lab.difficulty_level,
      estimated_duration: lab.estimated_duration,
      learning_objectives: lab.learning_objectives.length ? lab.learning_objectives : [''],
      prerequisites: lab.prerequisites.length ? lab.prerequisites : [''],
      tags: lab.tags.length ? lab.tags : ['']
    });
    setIsEditDialogOpen(true);
  };

  const openPreviewDialog = (lab: VirtualLab) => {
    setSelectedLab(lab);
    setIsPreviewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Integration Status */}
      <Alert>
        <FlaskConical className="h-4 w-4" />
        <AlertDescription>
          Virtual Labs are now using direct database integration! You can create and manage labs without needing a backend API.
          All data is stored directly in your Supabase database.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Virtual Lab Management</h2>
          <p className="text-gray-600">Create and manage interactive virtual laboratory experiments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Virtual Lab
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Virtual Lab</DialogTitle>
              <DialogDescription>
                Design an interactive virtual laboratory experiment with HTML, CSS, and JavaScript
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Lab Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Simple Pendulum Experiment"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.value} value={subject.value}>
                          <div className="flex items-center gap-2">
                            <subject.icon className="h-4 w-4" />
                            {subject.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Oscillations and Waves"
                  />
                </div>
                <div>
                  <Label htmlFor="class_grade">Class Grade</Label>
                  <Select value={formData.class_grade.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, class_grade: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Class {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={formData.difficulty_level} onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty_level: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="300"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 30 }))}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what students will learn and do in this lab"
                  rows={3}
                />
              </div>

              {/* Validation Info */}
              <Alert>
                <FlaskConical className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required fields:</strong> Lab Title, Subject, Topic, Description, and HTML Content must be filled out. 
                  Duration must be 5-300 minutes, Grade must be 1-12.
                </AlertDescription>
              </Alert>

              {/* Code Editor */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="html" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="css" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    CSS
                  </TabsTrigger>
                  <TabsTrigger value="js" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    JavaScript
                  </TabsTrigger>
                  <TabsTrigger value="samples" className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Samples
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="html">
                  <div>
                    <Label>HTML Content</Label>
                    <Textarea
                      value={formData.html_content}
                      onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                      placeholder="Enter HTML content for the virtual lab"
                      rows={15}
                      className="font-mono text-sm"
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Characters: {formData.html_content.length}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="css">
                  <div>
                    <Label>CSS Styles</Label>
                    <Textarea
                      value={formData.css_content}
                      onChange={(e) => setFormData(prev => ({ ...prev, css_content: e.target.value }))}
                      placeholder="Enter CSS styles for the virtual lab"
                      rows={15}
                      className="font-mono text-sm"
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Characters: {formData.css_content.length}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="js">
                  <div>
                    <Label>JavaScript Code</Label>
                    <Textarea
                      value={formData.js_content}
                      onChange={(e) => setFormData(prev => ({ ...prev, js_content: e.target.value }))}
                      placeholder="Enter JavaScript code for interactivity"
                      rows={15}
                      className="font-mono text-sm"
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Characters: {formData.js_content.length}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="samples">
                  <div className="space-y-4">
                    <Label>Sample Virtual Labs</Label>
                    <div className="grid gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch('/lab/chemistry/reaction.html');
                            const htmlContent = await response.text();
                            
                            // Extract HTML, CSS, and JS from the complete file
                            const htmlMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                            const cssMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
                            const jsMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
                            
                            setFormData(prev => ({
                              ...prev,
                              title: 'Molecular Titration Lab',
                              description: 'Interactive 3D chemistry lab for learning molecular titration with KMnO₄ and oxalic acid',
                              subject: 'chemistry',
                              topic: 'Redox Reactions and Titration',
                              class_grade: 11,
                              difficulty_level: 'intermediate',
                              estimated_duration: 45,
                              html_content: htmlMatch ? htmlMatch[1].trim() : htmlContent,
                              css_content: cssMatch ? cssMatch[1].trim() : '',
                              js_content: jsMatch ? jsMatch[1].trim() : '',
                              learning_objectives: [
                                'Understand redox reactions in titration',
                                'Learn molecular structure visualization',
                                'Practice endpoint detection techniques'
                              ],
                              prerequisites: [
                                'Basic chemistry knowledge',
                                'Understanding of oxidation-reduction'
                              ],
                              tags: ['chemistry', 'titration', '3d', 'interactive', 'redox']
                            }));
                            
                            toast({
                              title: "Sample Loaded",
                              description: "Chemistry titration lab loaded successfully"
                            });
                          } catch (error) {
                            console.error('Error loading sample:', error);
                            toast({
                              title: "Error",
                              description: "Failed to load sample lab",
                              variant: "destructive"
                            });
                          }
                        }}
                        className="justify-start"
                      >
                        <FlaskConical className="h-4 w-4 mr-2" />
                        Load Chemistry Titration Lab (3D Interactive)
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            title: 'Simple Physics Lab',
                            description: 'Basic physics experiment with interactive elements',
                            subject: 'physics',
                            topic: 'Motion and Forces',
                            html_content: `
<div class="lab-container">
  <h1>Physics Lab: Motion Simulation</h1>
  <div class="experiment-area">
    <div id="ball" class="ball"></div>
    <button onclick="startMotion()">Start Motion</button>
    <button onclick="stopMotion()">Stop Motion</button>
  </div>
  <div class="controls">
    <label>Velocity: <input type="range" id="velocity" min="1" max="10" value="5"></label>
    <div id="info">Click Start to begin the simulation</div>
  </div>
</div>`,
                            css_content: `
.lab-container { padding: 20px; font-family: Arial, sans-serif; }
.experiment-area { 
  width: 100%; 
  height: 300px; 
  border: 2px solid #333; 
  position: relative; 
  margin: 20px 0; 
  background: linear-gradient(to bottom, #87CEEB, #98FB98);
}
.ball { 
  width: 30px; 
  height: 30px; 
  background: red; 
  border-radius: 50%; 
  position: absolute; 
  top: 50%; 
  left: 10px; 
  transition: left 0.1s linear;
}
.controls { margin: 20px 0; }
button { 
  padding: 10px 20px; 
  margin: 5px; 
  background: #007bff; 
  color: white; 
  border: none; 
  border-radius: 5px; 
  cursor: pointer;
}
button:hover { background: #0056b3; }`,
                            js_content: `
let animationId;
let position = 10;
let isMoving = false;

function startMotion() {
  if (isMoving) return;
  isMoving = true;
  const ball = document.getElementById('ball');
  const velocity = document.getElementById('velocity').value;
  const info = document.getElementById('info');
  
  function animate() {
    position += parseInt(velocity);
    if (position > 500) position = 10;
    
    ball.style.left = position + 'px';
    info.textContent = \`Position: \${position}px, Velocity: \${velocity}px/frame\`;
    
    if (isMoving) {
      animationId = requestAnimationFrame(animate);
    }
  }
  animate();
}

function stopMotion() {
  isMoving = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  document.getElementById('info').textContent = 'Motion stopped';
}`
                          }));
                          
                          toast({
                            title: "Sample Loaded",
                            description: "Simple physics lab loaded successfully"
                          });
                        }}
                        className="justify-start"
                      >
                        <Atom className="h-4 w-4 mr-2" />
                        Load Simple Physics Lab (Motion Simulation)
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Learning Objectives */}
              <div>
                <Label>Learning Objectives</Label>
                {formData.learning_objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={objective}
                      onChange={(e) => updateArrayField('learning_objectives', index, e.target.value)}
                      placeholder="Enter learning objective"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayField('learning_objectives', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayField('learning_objectives')}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Objective
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLab}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Lab
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab) => (
          <Card key={lab.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{lab.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {lab.subject} • Class {lab.class_grade}
                  </CardDescription>
                </div>
                <Badge variant={lab.difficulty_level === 'beginner' ? 'default' : lab.difficulty_level === 'intermediate' ? 'secondary' : 'destructive'}>
                  {lab.difficulty_level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {lab.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {lab.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {lab.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{lab.tags.length - 3} more
                  </Badge>
                )}
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>{lab.estimated_duration} min</span>
                <span>{lab.learning_objectives.length} objectives</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPreviewDialog(lab)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(lab)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteLab(lab.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {labs.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <FlaskConical className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Virtual Labs Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first virtual laboratory experiment to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Lab
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Preview: {selectedLab?.title}</DialogTitle>
            <DialogDescription>
              Interactive preview of the virtual lab
            </DialogDescription>
          </DialogHeader>
          
          {selectedLab && (
            <div className="space-y-4">
              {/* Preview Controls */}
              <div className="flex gap-2 p-4 bg-gray-50 rounded-lg">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
                    if (previewWindow) {
                      previewWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Preview: ${selectedLab.title}</title>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                              ${selectedLab.css_content || ''}
                            </style>
                          </head>
                          <body>
                            ${selectedLab.html_content}
                            <script>
                              ${selectedLab.js_content || ''}
                            </script>
                          </body>
                        </html>
                      `);
                      previewWindow.document.close();
                    }
                  }}
                >
                  Open in New Window
                </Button>
                <div className="text-sm text-gray-600 flex items-center">
                  HTML: {selectedLab.html_content?.length || 0} chars | 
                  CSS: {selectedLab.css_content?.length || 0} chars | 
                  JS: {selectedLab.js_content?.length || 0} chars
                </div>
              </div>
              
              {/* Iframe Preview */}
              <div className="h-[60vh] border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Preview: ${selectedLab.title}</title>
                        <style>
                          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                          ${selectedLab.css_content || ''}
                        </style>
                      </head>
                      <body>
                        ${selectedLab.html_content}
                        <script>
                          try {
                            ${selectedLab.js_content || ''}
                          } catch (error) {
                            console.error('JavaScript error in lab:', error);
                            document.body.innerHTML += '<div style="background: #fee; color: #c00; padding: 10px; margin: 10px 0; border-radius: 4px;">JavaScript Error: ' + error.message + '</div>';
                          }
                        </script>
                      </body>
                    </html>
                  `}
                  className="w-full h-full"
                  title="Virtual Lab Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar to Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Virtual Lab</DialogTitle>
            <DialogDescription>
              Update the virtual laboratory experiment
            </DialogDescription>
          </DialogHeader>
          
          {/* Same form content as create dialog */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Lab Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Simple Pendulum Experiment"
                />
              </div>
              <div>
                <Label htmlFor="edit-subject">Subject</Label>
                <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.value} value={subject.value}>
                        <div className="flex items-center gap-2">
                          <subject.icon className="h-4 w-4" />
                          {subject.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-topic">Topic</Label>
                <Input
                  id="edit-topic"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., Oscillations and Waves"
                />
              </div>
              <div>
                <Label htmlFor="edit-grade">Class Grade</Label>
                <Select value={formData.class_grade.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, class_grade: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Class {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-difficulty">Difficulty Level</Label>
                <Select value={formData.difficulty_level} onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty_level: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="5"
                  max="300"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 30 }))}
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn and do in this lab"
                rows={3}
              />
            </div>

            {/* Code Editor */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
              </TabsList>
              
              <TabsContent value="html">
                <div>
                  <Label>HTML Content</Label>
                  <Textarea
                    value={formData.html_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                    rows={15}
                    className="font-mono text-sm"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Characters: {formData.html_content.length}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="css">
                <div>
                  <Label>CSS Styles</Label>
                  <Textarea
                    value={formData.css_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, css_content: e.target.value }))}
                    rows={15}
                    className="font-mono text-sm"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Characters: {formData.css_content.length}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="js">
                <div>
                  <Label>JavaScript Code</Label>
                  <Textarea
                    value={formData.js_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, js_content: e.target.value }))}
                    rows={15}
                    className="font-mono text-sm"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Characters: {formData.js_content.length}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLab}>
                <Save className="h-4 w-4 mr-2" />
                Update Lab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VirtualLabManager;