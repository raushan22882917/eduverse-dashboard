import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, RotateCcw, FileQuestion } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  explanation?: string;
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  subject: string;
  classGrade: number;
  durationMinutes: number;
  questions: QuizQuestion[];
  teacherId?: string;
  totalMarks: number;
  createdAt: string;
}

interface QuizPreviewProps {
  quizData?: QuizData;
  onClose?: () => void;
}

const QuizPreview: React.FC<QuizPreviewProps> = ({ quizData: propQuizData, onClose }) => {
  const { toast } = useToast();
  
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    // Load quiz data from props or localStorage
    if (propQuizData) {
      setQuizData(propQuizData);
    } else {
      const storedQuiz = localStorage.getItem('preview_quiz');
      if (storedQuiz) {
        try {
          const parsed = JSON.parse(storedQuiz);
          setQuizData(parsed);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load quiz data",
          });
        }
      }
    }
  }, [propQuizData]);

  useEffect(() => {
    if (quizStarted && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, timeRemaining]);

  const startQuiz = () => {
    if (!quizData) return;
    
    setQuizStarted(true);
    setTimeRemaining(quizData.durationMinutes * 60);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    
    toast({
      title: "Quiz Started",
      description: `You have ${quizData.durationMinutes} minutes to complete the quiz`,
    });
  };

  const selectAnswer = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (!quizData) return;
    
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!quizData) return;

    setShowResults(true);
    setQuizStarted(false);
    
    const score = calculateScore();
    toast({
      title: "Quiz Completed",
      description: `You scored ${score.correct}/${score.total} (${score.percentage}%)`,
    });
  };

  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0, totalMarks: 0, earnedMarks: 0 };

    let correct = 0;
    let earnedMarks = 0;
    const total = quizData.questions.length;
    const totalMarks = quizData.totalMarks;

    quizData.questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correct++;
        earnedMarks += question.marks;
      }
    });

    const percentage = Math.round((correct / total) * 100);

    return { correct, total, percentage, totalMarks, earnedMarks };
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setTimeRemaining(null);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!quizData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <FileQuestion className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Quiz Data</h2>
            <p className="text-muted-foreground mb-4">
              No quiz data found. Please create a quiz first.
            </p>
            {onClose && (
              <Button onClick={onClose}>
                Go Back
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quiz Results</CardTitle>
            <CardDescription>{quizData.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {score.percentage}%
              </div>
              <p className="text-muted-foreground">
                {score.correct} out of {score.total} questions correct
              </p>
              <p className="text-sm text-muted-foreground">
                {score.earnedMarks} out of {score.totalMarks} marks
              </p>
            </div>

            <Progress value={score.percentage} className="w-full" />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question Review</h3>
              {quizData.questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-2">
                            Q{index + 1}: {question.question}
                          </p>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="font-medium">Your answer:</span>{' '}
                              {userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}
                            </p>
                            <p>
                              <span className="font-medium">Correct answer:</span>{' '}
                              {question.options[question.correctAnswer]}
                            </p>
                            {question.explanation && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Explanation:</span> {question.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={isCorrect ? "default" : "destructive"}>
                          {question.marks} marks
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={resetQuiz}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{quizData.title}</CardTitle>
            <CardDescription>{quizData.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{quizData.questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{quizData.durationMinutes}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{quizData.totalMarks}</p>
                <p className="text-sm text-muted-foreground">Total Marks</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{quizData.subject}</p>
                <p className="text-sm text-muted-foreground">Subject</p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Instructions</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Read each question carefully</li>
                  <li>• Select the best answer for each question</li>
                  <li>• You can navigate between questions</li>
                  <li>• Submit when you're ready or when time runs out</li>
                </ul>
              </div>
              
              <Button onClick={startQuiz} size="lg">
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with timer and progress */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{quizData.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {timeRemaining !== null && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>

      <Progress value={progress} className="mb-6" />

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{currentQuestion.marks} marks</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={answers[currentQuestion.id] === index ? "default" : "outline"}
                className="w-full text-left justify-start h-auto p-4"
                onClick={() => selectAnswer(currentQuestion.id, index)}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex === quizData.questions.length - 1 ? (
            <Button onClick={handleSubmitQuiz}>
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={nextQuestion}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPreview;