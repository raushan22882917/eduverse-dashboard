import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QuizPreview from '@/components/QuizPreview';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';

const QuizSharePage: React.FC = () => {
  const { shareKey } = useParams<{ shareKey: string }>();
  const [quizData, setQuizData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareKey) {
      try {
        const storedQuiz = localStorage.getItem(shareKey);
        if (storedQuiz) {
          const parsed = JSON.parse(storedQuiz);
          setQuizData(parsed);
        } else {
          setError('Quiz not found. The link may have expired or is invalid.');
        }
      } catch (err) {
        setError('Failed to load quiz data.');
      }
    }
  }, [shareKey]);

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <FileQuestion className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading quiz...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <QuizPreview quizData={quizData} />;
};

export default QuizSharePage;