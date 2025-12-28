import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Hand, 
  MessageCircle,
  Trophy,
  Clock,
  Target,
  Brain,
  Camera,
  Settings,
  Maximize,
  Minimize
} from 'lucide-react';
import { api } from '@/lib/api';
import { VirtualLab, VirtualLabSession, GestureCommand, LabPerformanceMetrics } from '@/types/virtualLab';
import { useToast } from '@/hooks/use-toast';

interface VirtualLabInterfaceProps {
  lab: VirtualLab;
  userId: string;
  onComplete?: (session: VirtualLabSession) => void;
}

const VirtualLabInterface: React.FC<VirtualLabInterfaceProps> = ({ lab, userId, onComplete }) => {
  const [session, setSession] = useState<VirtualLabSession | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [performance, setPerformance] = useState<LabPerformanceMetrics>({
    accuracy: 0,
    speed: 0,
    efficiency: 0,
    creativity: 0,
    problem_solving: 0,
    overall_score: 0
  });
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [labContent, setLabContent] = useState<string>('');
  const [isLoadingLab, setIsLoadingLab] = useState(true);
  
  const labFrameRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureIntervalRef = useRef<NodeJS.Timeout>();
  const sessionTimerRef = useRef<NodeJS.Timeout>();
  
  const { toast } = useToast();

  // Memoized lab content loader
  const loadLabContent = useCallback(async () => {
    if (!lab.content_url) return;
    
    setIsLoadingLab(true);
    try {
      // Use fetch with cache for better performance
      const response = await fetch(lab.content_url, {
        cache: 'force-cache' // Cache the HTML content
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load lab content: ${response.statusText}`);
      }
      
      const content = await response.text();
      setLabContent(content);
    } catch (error) {
      console.error('Error loading lab content:', error);
      toast({
        title: "Error loading lab",
        description: "Failed to load lab content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingLab(false);
    }
  }, [lab.content_url, toast]);

  // Memoized session initialization
  const initializeSession = useCallback(async () => {
    try {
      const response = await api.virtualLabs.startSession({
        user_id: userId,
        lab_id: lab.id,
        session_name: `${lab.title} - ${new Date().toLocaleString()}`
      });
      setSession(response.session);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize lab session",
        variant: "destructive"
      });
    }
  }, [userId, lab.id, lab.title]);

  const startLab = async () => {
    setIsActive(true);
    await recordInteraction('lab_started', { timestamp: new Date().toISOString() });
    
    if (gestureEnabled) {
      await initializeGestureRecognition();
    }
  };

  const pauseLab = async () => {
    setIsActive(false);
    await recordInteraction('lab_paused', { 
      session_duration: sessionTime,
      timestamp: new Date().toISOString() 
    });
    
    if (gestureIntervalRef.current) {
      clearInterval(gestureIntervalRef.current);
    }
  };

  const stopLab = async () => {
    setIsActive(false);
    
    if (session) {
      try {
        // Calculate final performance
        const finalPerformance = await calculatePerformance();
        
        // Update session with completion data
        await api.virtualLabs.updateSession(session.id, {
          completed_at: new Date().toISOString(),
          duration_minutes: Math.round(sessionTime / 60),
          performance_score: finalPerformance.overall_score,
          completion_status: 'completed'
        });

        await recordInteraction('lab_completed', { 
          final_performance: finalPerformance,
          total_duration: sessionTime,
          timestamp: new Date().toISOString() 
        });

        toast({
          title: "Lab Completed!",
          description: `Great work! Your overall score: ${finalPerformance.overall_score.toFixed(1)}%`
        });

        if (onComplete) {
          onComplete({
            ...session,
            completed_at: new Date().toISOString(),
            duration_minutes: Math.round(sessionTime / 60),
            performance_score: finalPerformance.overall_score,
            completion_status: 'completed'
          });
        }
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
    
    if (gestureIntervalRef.current) {
      clearInterval(gestureIntervalRef.current);
    }
  };

  const resetLab = async () => {
    setIsActive(false);
    setSessionTime(0);
    setPerformance({
      accuracy: 0,
      speed: 0,
      efficiency: 0,
      creativity: 0,
      problem_solving: 0,
      overall_score: 0
    });
    
    // Reload the lab iframe
    if (labFrameRef.current) {
      labFrameRef.current.src = labFrameRef.current.src;
    }
    
    await recordInteraction('lab_reset', { timestamp: new Date().toISOString() });
  };

  const initializeGestureRecognition = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start gesture detection loop
      gestureIntervalRef.current = setInterval(() => {
        detectGestures();
      }, 100); // Check for gestures every 100ms

      toast({
        title: "Gesture Control Enabled",
        description: "You can now control the lab with hand gestures!"
      });
    } catch (error) {
      console.error('Error initializing gesture recognition:', error);
      toast({
        title: "Camera Access Required",
        description: "Please allow camera access to use gesture controls",
        variant: "destructive"
      });
    }
  };

  const detectGestures = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Draw video frame to canvas for processing
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Simple gesture detection (in a real implementation, you'd use MediaPipe or similar)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const gesture = analyzeGesture(imageData);
    
    if (gesture && gesture !== currentGesture) {
      setCurrentGesture(gesture);
      handleGestureCommand(gesture);
    }
  };

  const analyzeGesture = (imageData: ImageData): string => {
    // Simplified gesture analysis
    // In a real implementation, you would use machine learning models
    // like MediaPipe Hands or TensorFlow.js for accurate hand tracking
    
    const data = imageData.data;
    let motionPixels = 0;
    
    // Simple motion detection based on pixel intensity changes
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 100) motionPixels++;
    }
    
    const motionRatio = motionPixels / (imageData.width * imageData.height);
    
    // Basic gesture classification
    if (motionRatio > 0.3) return 'wave';
    if (motionRatio > 0.2) return 'point';
    if (motionRatio > 0.1) return 'grab';
    
    return '';
  };

  const handleGestureCommand = async (gesture: string) => {
    const gestureCommand: GestureCommand = {
      type: gesture as any,
      target_element: 'lab-container',
      coordinates: { x: 0, y: 0 }
    };

    // Execute gesture command in lab iframe
    if (labFrameRef.current && labFrameRef.current.contentWindow) {
      try {
        // Send gesture command to lab
        labFrameRef.current.contentWindow.postMessage({
          type: 'gesture_command',
          gesture: gestureCommand
        }, '*');

        // Record the interaction
        await recordInteraction('gesture_command', {
          gesture_type: gesture,
          timestamp: new Date().toISOString()
        }, gesture);

        // Update performance based on gesture use
        setPerformance(prev => ({
          ...prev,
          creativity: Math.min(100, prev.creativity + 2),
          overall_score: calculateOverallScore({
            ...prev,
            creativity: Math.min(100, prev.creativity + 2)
          })
        }));

      } catch (error) {
        console.error('Error sending gesture command:', error);
      }
    }
  };

  const recordInteraction = async (
    interactionType: string, 
    interactionData: any, 
    gestureType?: string
  ) => {
    if (!session) return;

    try {
      await api.virtualLabs.recordInteraction({
        session_id: session.id,
        interaction_type: interactionType,
        interaction_data: interactionData,
        gesture_type: gestureType,
        performance_impact: gestureType ? 0.1 : 0
      });

      // Update session interaction count
      setSession(prev => prev ? {
        ...prev,
        interactions_count: prev.interactions_count + 1,
        gesture_commands_used: gestureType ? prev.gesture_commands_used + 1 : prev.gesture_commands_used
      } : null);

    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const calculatePerformance = async (): Promise<LabPerformanceMetrics> => {
    if (!session) return performance;

    try {
      const response = await api.virtualLabs.getPerformanceMetrics(session.id);
      const metrics = response.metrics;
      setPerformance(metrics);
      return metrics;
    } catch (error) {
      console.error('Error calculating performance:', error);
      return performance;
    }
  };

  const calculateOverallScore = (metrics: LabPerformanceMetrics): number => {
    return (metrics.accuracy + metrics.speed + metrics.efficiency + metrics.creativity + metrics.problem_solving) / 5;
  };

  const handleAIAssistance = async () => {
    if (!aiQuery.trim() || !session) return;

    try {
      setSession(prev => prev ? {
        ...prev,
        ai_assistance_requests: prev.ai_assistance_requests + 1
      } : null);

      const response = await api.virtualLabs.requestAIAssistance({
        session_id: session.id,
        user_query: aiQuery,
        context_data: {
          current_performance: performance,
          session_time: sessionTime,
          lab_title: lab.title
        },
        response_type: 'explanation'
      });

      setAiResponse(response.assistance.ai_response);
      setAiQuery('');

      // Slight performance impact for using AI assistance
      setPerformance(prev => ({
        ...prev,
        problem_solving: Math.max(0, prev.problem_solving - 1),
        overall_score: calculateOverallScore({
          ...prev,
          problem_solving: Math.max(0, prev.problem_solving - 1)
        })
      }));

    } catch (error) {
      console.error('Error getting AI assistance:', error);
      toast({
        title: "AI Assistant Error",
        description: "Failed to get AI assistance. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lab Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{lab.title}</CardTitle>
              <CardDescription>
                {lab.subject} • Class {lab.class_grade} • {lab.estimated_duration} min
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={lab.difficulty_level === 'beginner' ? 'default' : 
                             lab.difficulty_level === 'intermediate' ? 'secondary' : 'destructive'}>
                {lab.difficulty_level}
              </Badge>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lab Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Lab Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              {!isActive ? (
                <Button onClick={startLab} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Lab
                </Button>
              ) : (
                <Button onClick={pauseLab} variant="outline" className="w-full">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Lab
                </Button>
              )}
              
              <Button onClick={stopLab} variant="destructive" className="w-full">
                <Square className="h-4 w-4 mr-2" />
                Complete Lab
              </Button>
              
              <Button onClick={resetLab} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Lab
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Gesture Control</span>
                <Button
                  variant={gestureEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setGestureEnabled(!gestureEnabled);
                    if (!gestureEnabled && isActive) {
                      initializeGestureRecognition();
                    }
                  }}
                >
                  <Hand className="h-4 w-4" />
                </Button>
              </div>
              
              {gestureEnabled && currentGesture && (
                <Alert>
                  <Hand className="h-4 w-4" />
                  <AlertDescription>
                    Current gesture: <strong>{currentGesture}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Accuracy</span>
                  <span>{performance.accuracy.toFixed(1)}%</span>
                </div>
                <Progress value={performance.accuracy} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Speed</span>
                  <span>{performance.speed.toFixed(1)}%</span>
                </div>
                <Progress value={performance.speed} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Creativity</span>
                  <span>{performance.creativity.toFixed(1)}%</span>
                </div>
                <Progress value={performance.creativity} className="h-2" />
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Overall Score</span>
                  <span>{performance.overall_score.toFixed(1)}%</span>
                </div>
                <Progress value={performance.overall_score} className="h-3 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Time Elapsed</span>
                <span className="font-mono">{formatTime(sessionTime)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Interactions</span>
                <span>{session.interactions_count}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gestures Used</span>
                <span>{session.gesture_commands_used}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">AI Assistance</span>
                <span>{session.ai_assistance_requests}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <textarea
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask for help or explanation..."
                className="w-full p-2 border rounded-md text-sm resize-none"
                rows={3}
              />
              
              <Button 
                onClick={handleAIAssistance} 
                disabled={!aiQuery.trim()}
                className="w-full"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
            </div>
            
            {aiResponse && (
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {aiResponse}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Lab Interface */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            {/* Lab iframe */}
            <iframe
              ref={labFrameRef}
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body { 
                        margin: 0; 
                        padding: 20px; 
                        font-family: Arial, sans-serif;
                        background: #f8f9fa;
                      }
                      .lab-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 8px;
                        padding: 20px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                      }
                      ${lab.css_content || ''}
                    </style>
                  </head>
                  <body>
                    <div class="lab-container" id="lab-container">
                      ${lab.html_content}
                    </div>
                    
                    <script>
                      // Listen for gesture commands from parent
                      window.addEventListener('message', function(event) {
                        if (event.data.type === 'gesture_command') {
                          const gesture = event.data.gesture;
                          handleGestureCommand(gesture);
                        }
                      });
                      
                      function handleGestureCommand(gesture) {
                        // Basic gesture handling
                        const container = document.getElementById('lab-container');
                        if (!container) return;
                        
                        switch(gesture.type) {
                          case 'wave':
                            // Trigger animation or reset
                            container.style.transform = 'scale(1.02)';
                            setTimeout(() => container.style.transform = 'scale(1)', 200);
                            break;
                          case 'point':
                            // Highlight interactive elements
                            const buttons = container.querySelectorAll('button');
                            buttons.forEach(btn => {
                              btn.style.boxShadow = '0 0 10px #007bff';
                              setTimeout(() => btn.style.boxShadow = '', 1000);
                            });
                            break;
                          case 'grab':
                            // Simulate click on first interactive element
                            const firstButton = container.querySelector('button');
                            if (firstButton) firstButton.click();
                            break;
                        }
                      }
                      
                      // Custom lab JavaScript
                      ${lab.js_content || ''}
                      
                      // Track interactions
                      document.addEventListener('click', function(e) {
                        window.parent.postMessage({
                          type: 'lab_interaction',
                          element: e.target.tagName,
                          id: e.target.id,
                          timestamp: new Date().toISOString()
                        }, '*');
                      });
                    </script>
                  </body>
                </html>
              `}
              className="w-full h-[600px] border-0 rounded-lg"
              title={lab.title}
            />

            {/* Gesture Recognition Overlay */}
            {gestureEnabled && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4" />
                  <span className="text-sm font-medium">Gesture Control</span>
                </div>
                
                <video
                  ref={videoRef}
                  className="w-32 h-24 rounded border"
                  muted
                  playsInline
                />
                
                <canvas
                  ref={canvasRef}
                  width={160}
                  height={120}
                  className="hidden"
                />
                
                {currentGesture && (
                  <div className="mt-2 text-xs text-center">
                    <Badge variant="outline">{currentGesture}</Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {lab.learning_objectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{objective}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualLabInterface;