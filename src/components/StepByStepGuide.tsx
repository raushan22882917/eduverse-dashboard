import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Target,
  Lightbulb,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Zap,
  Trophy,
  Eye,
  Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  duration?: number; // in minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  prerequisites?: string[];
  tips?: string[];
  warnings?: string[];
  completed?: boolean;
  optional?: boolean;
}

interface StepByStepGuideProps {
  title: string;
  description: string;
  steps: Step[];
  onStepComplete?: (stepId: string) => void;
  onGuideComplete?: () => void;
  autoProgress?: boolean;
  showProgress?: boolean;
  allowSkip?: boolean;
}

const StepByStepGuide: React.FC<StepByStepGuideProps> = ({
  title,
  description,
  steps,
  onStepComplete,
  onGuideComplete,
  autoProgress = false,
  showProgress = true,
  allowSkip = true
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set([steps[0]?.id]));
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const completedCount = completedSteps.size;
  const progressPercentage = (completedCount / totalSteps) * 100;

  // Timer for tracking time spent
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const markStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    
    if (onStepComplete) {
      onStepComplete(stepId);
    }

    // Check if all steps are completed
    if (newCompleted.size === totalSteps && onGuideComplete) {
      onGuideComplete();
    }

    // Auto-progress to next step if enabled
    if (autoProgress && currentStepIndex < totalSteps - 1) {
      setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
        setExpandedSteps(new Set([steps[currentStepIndex + 1]?.id]));
      }, 1000);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStepIndex(index);
    setExpandedSteps(new Set([steps[index]?.id]));
  };

  const nextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setExpandedSteps(new Set([steps[currentStepIndex + 1]?.id]));
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setExpandedSteps(new Set([steps[currentStepIndex - 1]?.id]));
    }
  };

  const resetGuide = () => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setExpandedSteps(new Set([steps[0]?.id]));
    setTimeSpent(0);
    setIsPlaying(false);
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalEstimatedTime = () => {
    return steps.reduce((total, step) => total + (step.duration || 5), 0);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Step Navigation */}
      <div className="w-80 bg-card border-r flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          
          {showProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{completedCount}/{totalSteps}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </div>

        {/* Guide Controls */}
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetGuide}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeSpent)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Est. Total: {getTotalEstimatedTime()} min</span>
            <Badge variant="outline" className="text-xs">
              {completedCount === totalSteps ? 'Complete' : 'In Progress'}
            </Badge>
          </div>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = index === currentStepIndex;
              const isExpanded = expandedSteps.has(step.id);
              
              return (
                <div key={step.id} className="mb-2">
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                      isCurrent && "bg-primary/10 border border-primary/20",
                      isCompleted && "bg-green-50 border border-green-200",
                      !isCurrent && !isCompleted && "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      goToStep(index);
                      toggleStepExpansion(step.id);
                    }}
                  >
                    {/* Step Status Icon */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className={cn(
                          "h-5 w-5",
                          isCurrent ? "text-primary" : "text-muted-foreground"
                        )} />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={cn(
                          "font-medium text-sm truncate",
                          isCurrent && "text-primary",
                          isCompleted && "text-green-700"
                        )}>
                          {step.title}
                        </h4>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {step.optional && (
                            <Badge variant="outline" className="text-xs">Optional</Badge>
                          )}
                          {step.difficulty && (
                            <Badge className={cn("text-xs", getDifficultyColor(step.difficulty))}>
                              {step.difficulty}
                            </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {step.description}
                      </p>
                      
                      {step.duration && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {step.duration} min
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Step Details */}
                  {isExpanded && (
                    <div className="ml-8 mt-2 p-3 bg-muted/30 rounded-lg">
                      {step.prerequisites && step.prerequisites.length > 0 && (
                        <div className="mb-2">
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">Prerequisites:</h5>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {step.prerequisites.map((prereq, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {prereq}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {step.tips && step.tips.length > 0 && (
                        <div className="mb-2">
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">Tips:</h5>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {step.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentStepIndex + 1} of {totalSteps}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextStep}
              disabled={currentStepIndex === totalSteps - 1}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Current Step Header */}
        <div className="p-6 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Step {currentStepIndex + 1}</span>
                {currentStep?.difficulty && (
                  <Badge className={getDifficultyColor(currentStep.difficulty)}>
                    {currentStep.difficulty}
                  </Badge>
                )}
                {currentStep?.optional && (
                  <Badge variant="outline">Optional</Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {currentStep?.duration && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {currentStep.duration} min
                </div>
              )}
              
              {!completedSteps.has(currentStep?.id || '') && (
                <Button
                  onClick={() => markStepComplete(currentStep?.id || '')}
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">{currentStep?.title}</h1>
          <p className="text-muted-foreground">{currentStep?.description}</p>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Warnings */}
              {currentStep.warnings && currentStep.warnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {currentStep.warnings.map((warning, i) => (
                        <div key={i}>{warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Prerequisites */}
              {currentStep.prerequisites && currentStep.prerequisites.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>Prerequisites:</strong>
                      <ul className="list-disc list-inside space-y-1">
                        {currentStep.prerequisites.map((prereq, i) => (
                          <li key={i}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Main Content */}
              <Card>
                <CardContent className="p-6">
                  {currentStep.content}
                </CardContent>
              </Card>

              {/* Tips */}
              {currentStep.tips && currentStep.tips.length > 0 && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>Tips:</strong>
                      <ul className="list-disc list-inside space-y-1">
                        {currentStep.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="p-6 border-t bg-card">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Step
            </Button>
            
            <div className="flex items-center gap-4">
              {allowSkip && !completedSteps.has(currentStep?.id || '') && (
                <Button
                  variant="ghost"
                  onClick={nextStep}
                  disabled={currentStepIndex === totalSteps - 1}
                >
                  Skip Step
                </Button>
              )}
              
              {currentStepIndex === totalSteps - 1 ? (
                <Button
                  onClick={() => onGuideComplete?.()}
                  disabled={completedSteps.size !== totalSteps}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Complete Guide
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={currentStepIndex === totalSteps - 1}
                >
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepByStepGuide;