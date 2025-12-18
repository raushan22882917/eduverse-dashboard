import { Loader2, Sparkles } from "lucide-react";

interface InlineLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dots" | "pulse" | "spin";
  className?: string;
}

const InlineLoader = ({ 
  text = "Loading...", 
  size = "md", 
  variant = "default",
  className = "" 
}: InlineLoaderProps) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  if (variant === "dots") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex space-x-1">
          <div className={`bg-current rounded-full animate-bounce [animation-delay:-0.3s] ${
            size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
          }`}></div>
          <div className={`bg-current rounded-full animate-bounce [animation-delay:-0.15s] ${
            size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
          }`}></div>
          <div className={`bg-current rounded-full animate-bounce ${
            size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
          }`}></div>
        </div>
        <span className={textSizeClasses[size]}>{text}</span>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Sparkles className={`${sizeClasses[size]} animate-pulse`} />
        <span className={`${textSizeClasses[size]} animate-pulse`}>{text}</span>
      </div>
    );
  }

  if (variant === "spin") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className={`${sizeClasses[size]} animate-spin`} />
        <span className={textSizeClasses[size]}>{text}</span>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`}></div>
      <span className={textSizeClasses[size]}>{text}</span>
    </div>
  );
};

export default InlineLoader;