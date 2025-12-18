import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, Bot, AlertTriangle } from "lucide-react";

interface AITutorOfflineIndicatorProps {
  onRetry?: () => void;
  className?: string;
}

const AITutorOfflineIndicator = ({ onRetry, className = "" }: AITutorOfflineIndicatorProps) => {
  return (
    <Alert className={`border-orange-500/50 bg-orange-500/10 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <WifiOff className="h-4 w-4 text-orange-500" />
          <Badge variant="outline" className="border-orange-500/30 text-orange-600">
            <Bot className="h-3 w-3 mr-1" />
            AI Service
          </Badge>
        </div>
        
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">AI Tutoring Service Unavailable</span>
              </div>
              <p className="text-sm">
                Our AI tutoring system is currently being set up. You can still use the chat interface, 
                and we'll provide helpful guidance using our offline knowledge base.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs">✓ Basic math and science help available</span>
                <span className="text-xs">✓ Study tips and guidance</span>
              </div>
            </div>
          </AlertDescription>
        </div>
        
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-orange-500/30 text-orange-600 hover:bg-orange-500/20 flex-shrink-0"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default AITutorOfflineIndicator;