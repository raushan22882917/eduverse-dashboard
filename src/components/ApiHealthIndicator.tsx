import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { api } from "@/lib/api";

interface ApiHealthIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

const ApiHealthIndicator = ({ showDetails = false, className = "" }: ApiHealthIndicatorProps) => {
  const [healthStatus, setHealthStatus] = useState<{
    status: 'checking' | 'healthy' | 'degraded' | 'offline';
    services: Record<string, boolean>;
    lastCheck: Date | null;
  }>({
    status: 'checking',
    services: {},
    lastCheck: null
  });

  const checkHealth = async () => {
    setHealthStatus(prev => ({ ...prev, status: 'checking' }));
    
    const services = {
      'Health Check': false,
      'RAG System': false,
      'Progress Tracking': false,
      'Microplan Generator': false,
      'Exam System': false
    };

    let healthyCount = 0;

    // Check health endpoint
    try {
      await api.health.check();
      services['Health Check'] = true;
      healthyCount++;
    } catch (error) {
      console.warn('Health check failed:', error);
    }

    // Check RAG system
    try {
      await api.rag.query({ query: 'test', subject: 'mathematics' });
      services['RAG System'] = true;
      healthyCount++;
    } catch (error) {
      console.warn('RAG system check failed:', error);
    }

    // Check progress system
    try {
      await api.progress.getSummary('test-user');
      services['Progress Tracking'] = true;
      healthyCount++;
    } catch (error) {
      console.warn('Progress system check failed:', error);
    }

    // Check microplan system
    try {
      await api.microplan.getToday('test-user');
      services['Microplan Generator'] = true;
      healthyCount++;
    } catch (error) {
      console.warn('Microplan system check failed:', error);
    }

    // Check exam system
    try {
      await api.exam.getSets();
      services['Exam System'] = true;
      healthyCount++;
    } catch (error) {
      console.warn('Exam system check failed:', error);
    }

    const totalServices = Object.keys(services).length;
    let status: 'healthy' | 'degraded' | 'offline';
    
    if (healthyCount === totalServices) {
      status = 'healthy';
    } else if (healthyCount > 0) {
      status = 'degraded';
    } else {
      status = 'offline';
    }

    setHealthStatus({
      status,
      services,
      lastCheck: new Date()
    });
  };

  useEffect(() => {
    checkHealth();
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (healthStatus.status) {
      case 'checking':
        return <Clock className="h-4 w-4 animate-pulse" />;
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (healthStatus.status) {
      case 'checking':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'healthy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'offline':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  const getStatusText = () => {
    switch (healthStatus.status) {
      case 'checking':
        return 'Checking...';
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Some Services Unavailable';
      case 'offline':
        return 'Services Offline';
    }
  };

  if (!showDetails) {
    return (
      <Badge variant="outline" className={`${getStatusColor()} ${className}`}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </Badge>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">System Status</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkHealth}
            disabled={healthStatus.status === 'checking'}
          >
            <RefreshCw className={`h-4 w-4 ${healthStatus.status === 'checking' ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          {healthStatus.lastCheck && (
            <>Last checked: {healthStatus.lastCheck.toLocaleTimeString()}</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Status</span>
            <Badge variant="outline" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Services</h4>
            {Object.entries(healthStatus.services).map(([service, isHealthy]) => (
              <div key={service} className="flex items-center justify-between text-sm">
                <span>{service}</span>
                <div className="flex items-center gap-1">
                  {isHealthy ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span className={isHealthy ? 'text-green-500' : 'text-red-500'}>
                    {isHealthy ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {healthStatus.status === 'degraded' && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Some services are currently unavailable. The app will use fallback data where possible.
              </p>
            </div>
          )}

          {healthStatus.status === 'offline' && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                Backend services are currently offline. Please check your internet connection or try again later.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiHealthIndicator;