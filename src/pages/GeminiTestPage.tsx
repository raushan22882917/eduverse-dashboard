import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import GeminiApiTest from '@/components/GeminiApiTest';

const GeminiTestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Gemini API Testing</h1>
          <p className="text-muted-foreground">
            Test the Google Generative AI library integration
          </p>
        </div>
        
        <GeminiApiTest />
      </div>
    </div>
  );
};

export default GeminiTestPage;