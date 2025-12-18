import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, X, Wifi } from "lucide-react";

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
}

const ApiErrorBoundary = ({ children }: ApiErrorBoundaryProps) => {
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Listen for API errors
    const handleApiError = (event: CustomEvent) => {
      const error = event.detail;
      if (error.status === 404 && !apiErrors.includes(error.message)) {
        setApiErrors(prev => [...prev, error.message]);
      }
    };

    // Create custom event listener for API errors
    window.addEventListener('api-error' as any, handleApiError);

    return () => {
      window.removeEventListener('api-error' as any, handleApiError);
    };
  }, [apiErrors]);

  const dismissError = (error: string) => {
    setDismissed(prev => new Set([...prev, error]));
  };

  const retryConnection = () => {
    setApiErrors([]);
    setDismissed(new Set());
    window.location.reload();
  };

  const visibleErrors = apiErrors.filter(error => !dismissed.has(error));

  return (
    <>
      {children}
      
      {/* API Error Notifications */}
      {visibleErrors.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md space-y-2">
          {visibleErrors.slice(0, 3).map((error, index) => (
            <Alert key={index} variant="destructive" className="shadow-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                Service Unavailable
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissError(error)}
                  className="h-auto p-1 hover:bg-destructive/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              </AlertTitle>
              <AlertDescription className="text-sm">
                Some features may be limited. Using offline mode.
              </AlertDescription>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryConnection}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            </Alert>
          ))}
          
          {visibleErrors.length > 3 && (
            <Alert className="shadow-lg">
              <Wifi className="h-4 w-4" />
              <AlertTitle>Multiple Service Issues</AlertTitle>
              <AlertDescription>
                {visibleErrors.length - 3} more services are experiencing issues.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </>
  );
};

export default ApiErrorBoundary;