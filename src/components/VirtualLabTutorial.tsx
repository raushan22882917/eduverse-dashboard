import React from 'react';
import StepByStepGuide from './StepByStepGuide';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FlaskConical, 
  Hand, 
  Eye, 
  Brain, 
  Play, 
  Settings, 
  Camera,
  Zap,
  Target,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
  Code,
  Palette,
  Upload,
  Download,
  Share
} from 'lucide-react';

interface VirtualLabTutorialProps {
  onComplete?: () => void;
  labType?: 'physics' | 'chemistry' | 'biology' | 'general';
}

const VirtualLabTutorial: React.FC<VirtualLabTutorialProps> = ({ 
  onComplete,
  labType = 'general' 
}) => {
  const getLabSpecificContent = (type: string) => {
    switch (type) {
      case 'physics':
        return {
          example: 'Simple Pendulum Experiment',
          description: 'Learn to control pendulum motion with gestures',
          icon: <Zap className="h-6 w-6" />
        };
      case 'chemistry':
        return {
          example: 'Acid-Base Titration',
          description: 'Perform virtual titration with hand controls',
          icon: <FlaskConical className="h-6 w-6" />
        };
      case 'biology':
        return {
          example: 'Cell Structure Observation',
          description: 'Use gestures to control microscope settings',
          icon: <Eye className="h-6 w-6" />
        };
      default:
        return {
          example: 'Interactive Science Lab',
          description: 'General virtual laboratory experience',
          icon: <Target className="h-6 w-6" />
        };
    }
  };

  const labContent = getLabSpecificContent(labType);

  const tutorialSteps = [
    {
      id: 'introduction',
      title: 'Welcome to Virtual Labs',
      description: 'Learn about interactive virtual laboratory experiments',
      duration: 3,
      difficulty: 'easy' as const,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              {labContent.icon}
            </div>
            <h2 className="text-2xl font-bold mb-2">Virtual Laboratory System</h2>
            <p className="text-muted-foreground mb-6">
              Experience interactive science experiments with hand gesture controls and AI assistance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="text-center">
                <Hand className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <CardTitle className="text-lg">Gesture Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Control experiments using natural hand movements detected by your camera
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Brain className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <CardTitle className="text-lg">AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get real-time help and explanations during your experiments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <CardTitle className="text-lg">Performance Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor your accuracy, speed, and creativity in real-time
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>What you'll learn:</strong> How to navigate virtual labs, use gesture controls, 
              interact with AI assistance, and track your learning progress.
            </AlertDescription>
          </Alert>
        </div>
      ),
      tips: [
        'Virtual labs work best with good lighting for camera detection',
        'Make sure your camera is positioned to see your hands clearly',
        'Each lab has different gesture controls - we\'ll show you how to use them'
      ]
    },
    {
      id: 'lab-selection',
      title: 'Selecting a Virtual Lab',
      description: 'Choose and start your first virtual experiment',
      duration: 2,
      difficulty: 'easy' as const,
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Finding the Right Lab</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Lab Categories</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Physics - Motion, Forces, Energy</span>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded">
                  <FlaskConical className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Chemistry - Reactions, Titrations</span>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Eye className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Biology - Cell Structure, Microscopy</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Difficulty Levels</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Beginner</span>
                  <Badge className="bg-green-100 text-green-800">Easy</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Intermediate</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Advanced</span>
                  <Badge className="bg-red-100 text-red-800">Hard</Badge>
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Example: {labContent.example}
              </CardTitle>
              <CardDescription>{labContent.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <span>⏱️ 30 min</span>
                <span>🎯 5 objectives</span>
                <span>📊 Beginner level</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      tips: [
        'Start with beginner-level labs to get familiar with the interface',
        'Check the estimated duration before starting',
        'Read the learning objectives to understand what you\'ll learn'
      ]
    },
    {
      id: 'camera-setup',
      title: 'Camera & Gesture Setup',
      description: 'Configure your camera for hand gesture recognition',
      duration: 5,
      difficulty: 'medium' as const,
      prerequisites: ['Working camera/webcam', 'Good lighting conditions'],
      content: (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Your browser will request camera permission. 
              Click "Allow" to enable gesture controls.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Camera Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="w-full h-32 bg-gradient-to-b from-blue-100 to-blue-200 rounded border-2 border-dashed border-blue-300 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                      <p className="text-sm text-blue-600">Camera View Area</p>
                    </div>
                  </div>
                </div>
                <ul className="text-sm space-y-1">
                  <li>✅ Position camera at eye level</li>
                  <li>✅ Ensure hands are visible in frame</li>
                  <li>✅ Maintain 2-3 feet distance</li>
                  <li>✅ Good lighting on your hands</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hand className="h-5 w-5" />
                  Basic Gestures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 border rounded">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      👋
                    </div>
                    <div>
                      <div className="font-medium text-sm">Wave</div>
                      <div className="text-xs text-muted-foreground">Reset/Start action</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 border rounded">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      👉
                    </div>
                    <div>
                      <div className="font-medium text-sm">Point</div>
                      <div className="text-xs text-muted-foreground">Highlight elements</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 border rounded">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      ✊
                    </div>
                    <div>
                      <div className="font-medium text-sm">Grab</div>
                      <div className="text-xs text-muted-foreground">Interact/Click</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Test Your Setup</div>
                  <div className="text-sm text-muted-foreground">
                    Try waving at your camera. You should see gesture detection feedback.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      warnings: [
        'Ensure good lighting - poor lighting affects gesture detection',
        'Keep your hands within the camera frame',
        'Avoid wearing gloves or having objects in your hands'
      ],
      tips: [
        'Test gestures before starting the actual experiment',
        'If gestures aren\'t detected, adjust your lighting or camera position',
        'You can always use mouse/touch as a backup if gestures don\'t work'
      ]
    },
    {
      id: 'lab-interface',
      title: 'Understanding the Lab Interface',
      description: 'Navigate the virtual lab controls and features',
      duration: 4,
      difficulty: 'medium' as const,
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Lab Interface Overview</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Control Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Play className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Start/Pause Lab</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Hand className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Toggle Gesture Control</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">AI Assistant</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Accuracy</span>
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div className="w-3/4 h-full bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Speed</span>
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div className="w-1/2 h-full bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Creativity</span>
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div className="w-2/3 h-full bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Main Experiment Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    {labContent.icon}
                  </div>
                  <h4 className="font-semibold">Interactive Experiment</h4>
                  <p className="text-sm text-muted-foreground">
                    This is where your virtual experiment will appear. You can interact with 
                    elements using gestures or mouse clicks.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="outline">Gesture Controlled</Badge>
                    <Badge variant="outline">Interactive</Badge>
                    <Badge variant="outline">Real-time</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      tips: [
        'The performance metrics update in real-time as you work',
        'Use the AI assistant when you need help understanding concepts',
        'The experiment area responds to both gestures and traditional clicks'
      ]
    },
    {
      id: 'ai-assistant',
      title: 'Using the AI Assistant',
      description: 'Get help and explanations during experiments',
      duration: 3,
      difficulty: 'easy' as const,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Learning Assistant</h3>
            <p className="text-muted-foreground">
              Get instant help, explanations, and guidance throughout your experiment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What You Can Ask</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-2 bg-muted rounded text-sm">
                  "What happens if I increase the temperature?"
                </div>
                <div className="p-2 bg-muted rounded text-sm">
                  "Explain the chemical reaction I'm seeing"
                </div>
                <div className="p-2 bg-muted rounded text-sm">
                  "Why did the pendulum stop swinging?"
                </div>
                <div className="p-2 bg-muted rounded text-sm">
                  "What should I do next?"
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Response Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Explanation</Badge>
                  <span className="text-sm">Concept clarification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Hint</Badge>
                  <span className="text-sm">Gentle guidance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Correction</Badge>
                  <span className="text-sm">Error identification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800">Guidance</Badge>
                  <span className="text-sm">Next steps</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tip:</strong> The AI assistant considers your current experiment state 
              and performance when providing responses. The more specific your question, 
              the better the help you'll receive!
            </AlertDescription>
          </Alert>

          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-purple-600 mt-1" />
                <div className="flex-1">
                  <div className="font-medium mb-1">Sample AI Interaction</div>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-2 rounded border-l-2 border-blue-500">
                      <strong>You:</strong> "Why isn't my titration changing color?"
                    </div>
                    <div className="bg-white p-2 rounded border-l-2 border-purple-500">
                      <strong>AI:</strong> "The color change in titration occurs at the equivalence point. 
                      You may need to add more titrant or ensure you've added the indicator. 
                      Try adding a few more drops slowly."
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      tips: [
        'Ask specific questions about what you\'re observing',
        'The AI can explain both the "what" and "why" of experiments',
        'Don\'t hesitate to ask for help - it won\'t negatively impact your score significantly'
      ]
    },
    {
      id: 'experiment-practice',
      title: 'Practice Experiment',
      description: 'Try a simple experiment with all the features',
      duration: 10,
      difficulty: 'medium' as const,
      prerequisites: ['Camera setup completed', 'Understanding of basic gestures'],
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Hands-On Practice</h3>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is a simplified practice experiment to help you get comfortable with 
              the virtual lab interface before starting real experiments.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Practice Tasks</CardTitle>
              <CardDescription>Complete these tasks to master the interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <div className="flex-1">
                    <div className="font-medium">Enable Gesture Control</div>
                    <div className="text-sm text-muted-foreground">Click the gesture control button and allow camera access</div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>

                <div className="flex items-center gap-3 p-3 border rounded">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <div className="flex-1">
                    <div className="font-medium">Test Wave Gesture</div>
                    <div className="text-sm text-muted-foreground">Wave your hand to see gesture detection feedback</div>
                  </div>
                  <Circle className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-3 p-3 border rounded">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <div className="flex-1">
                    <div className="font-medium">Ask AI Assistant</div>
                    <div className="text-sm text-muted-foreground">Type a question in the AI assistant panel</div>
                  </div>
                  <Circle className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-3 p-3 border rounded">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">4</div>
                  <div className="flex-1">
                    <div className="font-medium">Monitor Performance</div>
                    <div className="text-sm text-muted-foreground">Watch how your performance metrics change</div>
                  </div>
                  <Circle className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Success Indicators</span>
                </div>
                <ul className="text-sm space-y-1">
                  <li>✅ Camera feed visible</li>
                  <li>✅ Gesture detection working</li>
                  <li>✅ AI responses received</li>
                  <li>✅ Performance metrics updating</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Troubleshooting</span>
                </div>
                <ul className="text-sm space-y-1">
                  <li>🔧 Check camera permissions</li>
                  <li>🔧 Improve lighting conditions</li>
                  <li>🔧 Adjust hand position</li>
                  <li>🔧 Refresh page if needed</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
      tips: [
        'Take your time with each task - there\'s no rush',
        'If something doesn\'t work, try the troubleshooting steps',
        'This practice will make real experiments much smoother'
      ]
    },
    {
      id: 'completion',
      title: 'Tutorial Complete!',
      description: 'You\'re ready to start virtual lab experiments',
      duration: 2,
      difficulty: 'easy' as const,
      content: (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Trophy className="h-10 w-10 text-green-600" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-2">Congratulations! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              You've successfully completed the Virtual Lab tutorial and are ready to start experimenting!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Hand className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <div className="font-medium">Gesture Control</div>
                <div className="text-sm text-muted-foreground">Mastered</div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Brain className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <div className="font-medium">AI Assistant</div>
                <div className="text-sm text-muted-foreground">Ready to Help</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <div className="font-medium">Lab Interface</div>
                <div className="text-sm text-muted-foreground">Understood</div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> Choose a virtual lab from the available experiments 
              and start exploring! Remember, you can always return to this tutorial if you need a refresher.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={onComplete}>
              <Play className="h-5 w-5 mr-2" />
              Start First Experiment
            </Button>
            <Button variant="outline" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Download Guide
            </Button>
          </div>
        </div>
      ),
      tips: [
        'You can access this tutorial anytime from the help menu',
        'Start with beginner-level experiments to build confidence',
        'Don\'t forget to use the AI assistant when you need help!'
      ]
    }
  ];

  return (
    <StepByStepGuide
      title="Virtual Lab Tutorial"
      description="Learn to use interactive virtual laboratories with gesture controls and AI assistance"
      steps={tutorialSteps}
      onStepComplete={(stepId) => {
        console.log(`Completed step: ${stepId}`);
      }}
      onGuideComplete={() => {
        console.log('Tutorial completed!');
        onComplete?.();
      }}
      showProgress={true}
      allowSkip={true}
      autoProgress={false}
    />
  );
};

export default VirtualLabTutorial;