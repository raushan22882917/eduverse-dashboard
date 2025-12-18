import { useState, useEffect } from "react";
import { GraduationCap, Lightbulb, Brain, Target, Sparkles, Rocket } from "lucide-react";

interface InteractiveLoaderProps {
  title?: string;
  subtitle?: string;
  steps?: string[];
  funFacts?: string[];
  className?: string;
}

const InteractiveLoader = ({ 
  title = "Loading...", 
  subtitle = "Please wait while we prepare everything for you",
  steps = [
    "Initializing application...",
    "Loading your data...",
    "Preparing interface..."
  ],
  funFacts = [
    "AI-powered learning can improve retention by up to 60%! 🧠",
    "Students learn 40% faster with personalized content! 📚",
    "Interactive learning increases engagement by 75%! 🎯",
    "Gamified education boosts motivation by 90%! 🏆"
  ],
  className = ""
}: InteractiveLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Cycle through steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    // Cycle through fun facts
    const factInterval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % funFacts.length);
    }, 3000);

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(factInterval);
      clearInterval(progressInterval);
    };
  }, [steps.length, funFacts.length]);

  const icons = [Brain, Target, Sparkles, Rocket, GraduationCap];
  const colors = ["text-blue-500", "text-green-500", "text-purple-500", "text-orange-500", "text-pink-500"];

  return (
    <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 ${className}`}>
      <div className="text-center space-y-8 max-w-md mx-auto p-6">
        {/* Animated Logo with Floating Icons */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-3xl flex items-center justify-center animate-pulse shadow-2xl">
            <GraduationCap className="h-12 w-12 text-white animate-bounce" />
          </div>
          
          {/* Floating Icons */}
          {icons.slice(0, 4).map((Icon, index) => {
            const angle = (index * 90) * (Math.PI / 180);
            const radius = 60;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <div
                key={index}
                className="absolute w-8 h-8 bg-card rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 border-primary/20"
                style={{
                  left: `calc(50% + ${x}px - 16px)`,
                  top: `calc(50% + ${y}px - 16px)`,
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <Icon className={`h-4 w-4 ${colors[index]}`} />
              </div>
            );
          })}
          
          {/* Pulsing Ring */}
          <div className="absolute -inset-8 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full animate-ping opacity-75"></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        {/* Animated Dots */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>

        {/* Current Step */}
        <div className="space-y-4">
          <div className="p-4 bg-card/80 rounded-xl border border-primary/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-card-foreground animate-pulse">
                {steps[currentStep]}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Initializing</span>
            <span>{Math.round(Math.min(progress, 100))}%</span>
          </div>
        </div>

        {/* Fun Facts Carousel */}
        <div className="relative h-20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-sm p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20 backdrop-blur-sm transition-all duration-500">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Did you know?</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {funFacts[currentFact]}
              </p>
            </div>
          </div>
        </div>

        {/* Loading Indicators */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= (progress / 20) ? 'bg-primary scale-125' : 'bg-muted'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveLoader;