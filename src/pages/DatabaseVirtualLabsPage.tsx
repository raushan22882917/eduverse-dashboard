import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StudentSidebar from '@/components/StudentSidebar';
import DatabaseVirtualLabs from '@/components/DatabaseVirtualLabs';

const DatabaseVirtualLabsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access Virtual Labs</div>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <StudentSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <DatabaseVirtualLabs />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DatabaseVirtualLabsPage;