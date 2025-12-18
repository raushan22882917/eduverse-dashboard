import React from 'react';
import PDFLensTool from './PDFLensTool';
import { useAuth } from '@/contexts/AuthContext';

const GlobalScreenLens: React.FC = () => {
  const { user } = useAuth();

  // Only show for authenticated users
  if (!user) return null;

  return (
    <PDFLensTool
      subject="general"
      contentTitle="Screen Analysis"
    />
  );
};

export default GlobalScreenLens;