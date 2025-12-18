import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Bot, BookOpen } from "lucide-react";

interface OfflineRAGIndicatorProps {
  isOffline?: boolean;
  className?: string;
}

const OfflineRAGIndicator = ({ isOffline = false, className = "" }: OfflineRAGIndicatorProps) => {
  if (!isOffline) {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <Wifi className="h-3 w-3 text-green-500" />
        <span>Connected to AI Knowledge Base</span>
      </div>
    );
  }

  return (
    <Alert className={`border-blue-500/50 bg-blue-500/10 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <WifiOff className="h-4 w-4 text-blue-500" />
          <Badge variant="outline" className="border-blue-500/30 text-blue-600">
            <BookOpen className="h-3 w-3 mr-1" />
            Offline Mode
          </Badge>
        </div>
        
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Using Offline Knowledge Base</span>
              </div>
              <p className="text-sm">
                I'm currently using my built-in curriculum knowledge to help you. 
                All core topics in Mathematics, Physics, and Chemistry are available!
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs">✓ NCERT curriculum coverage</span>
                <span className="text-xs">✓ Step-by-step explanations</span>
                <span className="text-xs">✓ Practice problems</span>
              </div>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default OfflineRAGIndicator;