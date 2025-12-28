import React from 'react';
import { useNavigate } from 'react-router-dom';
import VirtualLabTutorial from '@/components/VirtualLabTutorial';

const VirtualLabTutorialPage: React.FC = () => {
  const navigate = useNavigate();

  const handleTutorialComplete = () => {
    // Navigate to virtual labs page after tutorial completion
    navigate('/dashboard/student/virtual-labs');
  };

  return (
    <div className="min-h-screen bg-background">
      <VirtualLabTutorial 
        onComplete={handleTutorialComplete}
        labType="general"
      />
    </div>
  );
};

export default VirtualLabTutorialPage;