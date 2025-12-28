import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import VirtualLabManager from '@/components/VirtualLabManager';

const AdminVirtualLabs: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AdminSidebar />
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <VirtualLabManager userRole="admin" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminVirtualLabs;