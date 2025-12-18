import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Maximize, 
  Eye, 
  Copy, 
  MousePointer, 
  Keyboard, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play
} from "lucide-react";

interface ExamWelcomeScreenProps {
  examTitle: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  onStart: () => void;
  onRequestFullscreen: () => Promise<boolean>;
}

const ExamWelcomeScreen = ({
  examTitle,
  duration,
  totalQuestions,
  totalMarks,
  onStart,
  onRequestFullscreen
}: ExamWelcomeScreenProps) => {
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleEnterFullscreen = async () => {
    const success = await onRequestFullscreen();
    setFullscreenEnabled(success);
  };

  const canStart = fullscreenEnabled && agreedToTerms;

  const securityFeatures = [
    {
      icon: Maximize,
      title: "Fullscreen Mode",
      description: "Exam must be taken in fullscreen mode",
      status: fullscreenEnabled ? "enabled" : "required"
    },
    {
      icon: Eye,
      title: "Tab Monitoring",
      description: "Switching tabs will be detected and logged",
      status: "active"
    },
    {
      icon: Copy,
      title: "Copy/Paste Disabled",
      description: "Text copying and pasting is disabled",
      status: "active"
    },
    {
      icon: MousePointer,
      title: "Right-Click Disabled",
      description: "Context menu is disabled during exam",
      status: "active"
    },
    {
      icon: Keyboard,
      title: "Keyboard Shortcuts",
      description: "Developer tools shortcuts are blocked",
      status: "active"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Shield className="h-4 w-4" />
            <span>Secure Exam Environment</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">{examTitle}</h1>
          <div className="flex items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{duration} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{totalQuestions} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{totalMarks} marks</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Security Requirements */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Requirements
              </CardTitle>
              <CardDescription>
                This exam uses advanced security measures to ensure integrity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{feature.title}</span>
                      <Badge 
                        variant={feature.status === "enabled" ? "default" : feature.status === "required" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {feature.status === "enabled" ? "✓ Enabled" : 
                         feature.status === "required" ? "Required" : "Active"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Instructions & Start */}
          <Card className="border-2 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Follow these steps to begin your exam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Fullscreen */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    fullscreenEnabled ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    1
                  </div>
                  <span className="font-medium">Enable Fullscreen Mode</span>
                </div>
                <Button
                  onClick={handleEnterFullscreen}
                  disabled={fullscreenEnabled}
                  className="w-full"
                  variant={fullscreenEnabled ? "secondary" : "default"}
                >
                  {fullscreenEnabled ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Fullscreen Enabled
                    </>
                  ) : (
                    <>
                      <Maximize className="h-4 w-4 mr-2" />
                      Enter Fullscreen
                    </>
                  )}
                </Button>
              </div>

              {/* Step 2: Agree to Terms */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    agreedToTerms ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    2
                  </div>
                  <span className="font-medium">Agree to Exam Terms</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="agree-terms" className="text-sm text-muted-foreground cursor-pointer">
                    I understand and agree to the exam security requirements. I acknowledge that any violations 
                    will be logged and may result in exam termination.
                  </label>
                </div>
              </div>

              {/* Step 3: Start Exam */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    canStart ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    3
                  </div>
                  <span className="font-medium">Begin Exam</span>
                </div>
                <Button
                  onClick={onStart}
                  disabled={!canStart}
                  className="w-full"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning Alert */}
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <strong>Important:</strong> Once you start the exam, the timer will begin and cannot be paused. 
            Make sure you have a stable internet connection and won't be interrupted.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default ExamWelcomeScreen;