import { useState, useEffect } from "react";
import { Brain } from "lucide-react";

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
  className = ""
}: InteractiveLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % 3);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 ${className}`}>
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        {/* Simple animated logo */}
        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-3xl flex items-center justify-center animate-pulse shadow-lg">
          <Brain className="h-10 w-10 text-white" />
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        {/* Simple animated dots */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>

        {/* Simple progress indicator */}
        <div className="flex justify-center gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentStep ? 'bg-primary scale-125' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveLoader;