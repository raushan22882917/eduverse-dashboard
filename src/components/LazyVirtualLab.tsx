import { lazy, Suspense, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FlaskConical } from 'lucide-react';

// Lazy load the heavy VirtualLabInterface component
const VirtualLabInterface = lazy(() => import('@/components/VirtualLabInterface'));

const VirtualLabSkeleton = () => (
  <Card className="w-full h-96">
    <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
        <FlaskConical className="h-8 w-8 text-primary animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Loading Virtual Lab</h3>
        <p className="text-sm text-muted-foreground">Preparing interactive environment...</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Initializing lab components
        </div>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface LazyVirtualLabProps {
  lab: any;
  userId: string;
  onComplete?: (session: any) => void;
}

const LazyVirtualLab = memo(({ lab, userId, onComplete }: LazyVirtualLabProps) => {
  return (
    <Suspense fallback={<VirtualLabSkeleton />}>
      <VirtualLabInterface 
        lab={lab} 
        userId={userId} 
        onComplete={onComplete}
      />
    </Suspense>
  );
});

LazyVirtualLab.displayName = "LazyVirtualLab";

export default LazyVirtualLab;