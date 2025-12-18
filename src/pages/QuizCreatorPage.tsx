import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCreator from '@/components/QuizCreator';
import QuizPreview from '@/components/QuizPreview';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const QuizCreatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);

  // Check if we're in preview mode from URL or localStorage
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'preview') {
      setShowPreview(true);
    }
  }, []);

  if (showPreview) {
    return (
      <div>
        <div className="container mx-auto p-6 max-w-4xl">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Creator
          </Button>
        </div>
        <QuizPreview onClose={() => setShowPreview(false)} />
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      <QuizCreator />
    </div>
  );
};

export default QuizCreatorPage;