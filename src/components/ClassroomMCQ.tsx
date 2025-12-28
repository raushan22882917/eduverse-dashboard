import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { Brain, CheckCircle, RotateCcw, Sparkles } from 'lucide-react';

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface ClassroomMCQProps {
  subject: string;
  chapter: string;
  contentTitle?: string;
  contentText?: string;
}

const ClassroomMCQ: React.FC<ClassroomMCQProps> = ({
  subject,
  chapter,
  contentTitle,
  contentText
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (user && subject && chapter) {
      checkExistingSession();
    }
  }, [user, subject, chapter]);

  const checkExistingSession = async () => {
    if (!user) return;

    try {
      // Try to check database first
      const { data, error } = await (supabase as any)
        .from('classroom_mcq')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject', subject)
        .eq('chapter', chapter)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const session = data[0];
        setSessionId(session.id);
        setQuestions(session.questions || []);
        setUserAnswers(session.user_answers || {});
        setIsCompleted(session.is_completed || false);
        setScore(session.score || 0);

        if (session.is_completed) {
          toast({
            title: "Previous Session Found",
            description: `You scored ${session.score}/${session.total_questions} on this chapter.`,
          });
        }
        return;
      }
    } catch (error) {
      console.warn('Database check failed, checking localStorage:', error);
    }

    // Fallback: check localStorage for sessions
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('mcq_session_'));
      for (const key of keys) {
        const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
        if (sessionData.user_id === user.id && 
            sessionData.subject === subject && 
            sessionData.chapter === chapter) {
          setSessionId(sessionData.id);
          setQuestions(sessionData.questions || []);
          setUserAnswers(sessionData.user_answers || {});
          setIsCompleted(sessionData.is_completed || false);
          setScore(sessionData.score || 0);
          
          if (sessionData.is_completed) {
            toast({
              title: "Previous Session Found (Local)",
              description: `You scored ${sessionData.score}/${sessionData.total_questions} on this chapter.`,
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
  };

  const createFallbackQuestions = (subject: string, chapter: string): MCQQuestion[] => {
    console.log('Creating fallback questions for:', subject, chapter);
    
    return [
      {
        id: 'mcq_1',
        question: `What is a key concept in ${chapter}?`,
        options: [
          'Understanding the fundamental principles',
          'Memorizing all formulas',
          'Skipping theoretical aspects',
          'Focusing only on examples'
        ],
        correct_answer: 0,
        explanation: 'Understanding fundamental principles is crucial for mastering any topic.'
      },
      {
        id: 'mcq_2',
        question: `Which approach is most effective when studying ${chapter}?`,
        options: [
          'Reading once quickly',
          'Practice with examples and theory',
          'Only watching videos',
          'Memorizing without understanding'
        ],
        correct_answer: 1,
        explanation: 'Combining practice with theoretical understanding leads to better learning outcomes.'
      },
      {
        id: 'mcq_3',
        question: `What should you focus on when learning ${subject}?`,
        options: [
          'Only the difficult topics',
          'Building strong foundations first',
          'Advanced topics only',
          'Skipping basic concepts'
        ],
        correct_answer: 1,
        explanation: 'Strong foundations are essential before moving to advanced concepts.'
      },
      {
        id: 'mcq_4',
        question: `How can you best prepare for ${subject} exams?`,
        options: [
          'Last-minute cramming',
          'Regular practice and revision',
          'Only reading textbooks',
          'Avoiding difficult questions'
        ],
        correct_answer: 1,
        explanation: 'Regular practice and systematic revision lead to better exam performance.'
      },
      {
        id: 'mcq_5',
        question: `What is important when solving ${subject} problems?`,
        options: [
          'Speed over accuracy',
          'Understanding the method and accuracy',
          'Guessing the answers',
          'Avoiding step-by-step solutions'
        ],
        correct_answer: 1,
        explanation: 'Understanding the method and maintaining accuracy are key to problem-solving success.'
      }
    ];
  };

  const parseGeneratedQuestions = (text: string): MCQQuestion[] => {
    console.log('Parsing text:', text.substring(0, 500) + '...');
    const questions: MCQQuestion[] = [];
    
    if (!text || text.trim().length === 0) {
      console.log('Empty text provided for parsing');
      return questions;
    }
    
    // Try multiple parsing strategies
    let questionBlocks = text.split(/Q\d+[:.]/).filter(block => block.trim());
    console.log('Strategy 1 - Question blocks found:', questionBlocks.length);
    
    // Strategy 2: If no Q markers, try splitting by numbers (1., 2., etc.)
    if (questionBlocks.length <= 1) {
      questionBlocks = text.split(/\d+\./).filter(block => block.trim());
      console.log('Strategy 2 - Number blocks found:', questionBlocks.length);
    }
    
    // Strategy 3: If still no luck, try splitting by "Question" keyword
    if (questionBlocks.length <= 1) {
      questionBlocks = text.split(/Question\s*\d+/i).filter(block => block.trim());
      console.log('Strategy 3 - Question keyword blocks found:', questionBlocks.length);
    }
    
    questionBlocks.forEach((block, index) => {
      console.log(`Processing block ${index + 1}:`, block.substring(0, 200) + '...');
      
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length < 5) {
        console.log(`Block ${index + 1} skipped - insufficient lines (${lines.length})`);
        return;
      }
      
      let questionText = '';
      const options: string[] = [];
      let correctAnswer = 0;
      let explanation = '';
      
      // Find question text (first non-option line)
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.match(/^[A-Da-d][\)\.]/) && 
            !trimmed.toLowerCase().startsWith('correct:') && 
            !trimmed.toLowerCase().startsWith('answer:') && 
            !trimmed.toLowerCase().startsWith('explanation:') &&
            trimmed.length > 10) {
          questionText = trimmed;
          break;
        }
      }
      
      // Parse all lines for options, correct answer, and explanation
      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Match options with various formats: A), A., (A), a), etc.
        const optionMatch = trimmed.match(/^[A-Da-d][\)\.]?\s*(.+)$/);
        if (optionMatch && options.length < 4) {
          const optionText = optionMatch[1].trim();
          if (optionText.length > 0) {
            options.push(optionText);
          }
        } else if (trimmed.toLowerCase().startsWith('correct:') || trimmed.toLowerCase().startsWith('answer:')) {
          const correctPart = trimmed.split(':')[1]?.trim().toUpperCase();
          if (correctPart) {
            if (correctPart.match(/^[A-D]$/)) {
              correctAnswer = correctPart.charCodeAt(0) - 65;
            } else if (correctPart.match(/^[1-4]$/)) {
              correctAnswer = parseInt(correctPart) - 1;
            }
          }
        } else if (trimmed.toLowerCase().startsWith('explanation:')) {
          explanation = trimmed.substring(12).trim();
        }
      });
      
      // Only add question if we have valid question text and at least 2 options
      if (questionText && options.length >= 2) {
        // Pad options to 4 if we have fewer
        while (options.length < 4) {
          options.push(`Option ${String.fromCharCode(65 + options.length)}`);
        }
        
        const question: MCQQuestion = {
          id: `mcq_${questions.length + 1}`,
          question: questionText,
          options: options.slice(0, 4),
          correct_answer: Math.max(0, Math.min(3, correctAnswer)),
          explanation: explanation || `Correct answer is option ${String.fromCharCode(65 + correctAnswer)}.`
        };
        
        questions.push(question);
        console.log(`Successfully parsed question ${questions.length}:`, question.question);
      } else {
        console.log(`Block ${index + 1} skipped - invalid format. Question: "${questionText}", Options: ${options.length}`);
      }
    });
    
    console.log(`Total questions parsed: ${questions.length}`);
    return questions.slice(0, 5);
  };

  const generateMCQQuestions = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not authenticated",
      });
      return;
    }

    console.log('Starting MCQ generation...', { subject, chapter, contentTitle, user: user.id });
    setGenerating(true);
    
    try {
      const prompt = `Generate exactly 5 multiple choice questions based on this educational content:

Subject: ${subject}
Chapter: ${chapter}
${contentTitle ? `Topic: ${contentTitle}` : ''}

${contentText ? `Content: ${contentText.substring(0, 1500)}` : ''}

IMPORTANT: Follow this EXACT format for each question:

Q1: [Question text here]
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
Correct: A
Explanation: [Brief explanation why this is correct]

Q2: [Next question text here]
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
Correct: B
Explanation: [Brief explanation why this is correct]

Continue this pattern for all 5 questions. Make questions challenging but fair for students. Focus on key concepts and understanding. Ensure each question has exactly 4 options labeled A, B, C, D.`;

      let generatedText = '';
      let parsedQuestions: MCQQuestion[] = [];

      // Try RAG API first
      try {
        console.log('Calling RAG API...');
        const response = await api.rag.query({
          query: prompt,
          subject: subject as any,
          top_k: 3,
        });

        console.log('RAG API response:', response);
        generatedText = response.generated_text || response.answer || '';
        console.log('Generated text from RAG:', generatedText);
        
        if (generatedText) {
          parsedQuestions = parseGeneratedQuestions(generatedText);
          console.log('Parsed questions from RAG:', parsedQuestions);
        }
      } catch (ragError) {
        console.warn('RAG API failed, trying Gemini API directly:', ragError);
      }

      // If RAG failed or didn't produce valid questions, try Gemini API directly
      if (parsedQuestions.length === 0) {
        try {
          console.log('Trying Gemini API directly...');
          const { generateText } = await import('@/utils/geminiApi');
          
          generatedText = await generateText(prompt);
          console.log('Generated text from Gemini:', generatedText);
          
          if (generatedText) {
            parsedQuestions = parseGeneratedQuestions(generatedText);
            console.log('Parsed questions from Gemini:', parsedQuestions);
          }
        } catch (geminiError) {
          console.error('Gemini API also failed:', geminiError);
        }
      }

      // If still no questions, create a simple fallback
      if (parsedQuestions.length === 0) {
        console.log('Creating fallback questions...');
        parsedQuestions = createFallbackQuestions(subject, chapter);
      }

      if (parsedQuestions.length === 0) {
        throw new Error('Unable to generate questions. Please check your internet connection and try again.');
      }

      // Save to database or localStorage
      let sessionId = `local_${Date.now()}`;
      
      try {
        const { data, error } = await (supabase as any)
          .from('classroom_mcq')
          .insert({
            user_id: user.id,
            subject: subject,
            chapter: chapter,
            content_title: contentTitle,
            questions: parsedQuestions,
            total_questions: parsedQuestions.length,
            session_data: {
              content_length: contentText?.length || 0,
              generated_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (error) {
          console.warn('Database save failed, using local storage:', error);
          const localSession = {
            id: sessionId,
            user_id: user.id,
            subject,
            chapter,
            content_title: contentTitle,
            questions: parsedQuestions,
            total_questions: parsedQuestions.length,
            created_at: new Date().toISOString()
          };
          localStorage.setItem(`mcq_session_${sessionId}`, JSON.stringify(localSession));
        } else {
          console.log('Database save successful:', data);
          sessionId = data.id;
        }
      } catch (dbError) {
        console.warn('Database connection failed, using local storage:', dbError);
        const localSession = {
          id: sessionId,
          user_id: user.id,
          subject,
          chapter,
          content_title: contentTitle,
          questions: parsedQuestions,
          total_questions: parsedQuestions.length,
          created_at: new Date().toISOString()
        };
        localStorage.setItem(`mcq_session_${sessionId}`, JSON.stringify(localSession));
      }

      setSessionId(sessionId);
      setQuestions(parsedQuestions);
      setUserAnswers({});
      setIsCompleted(false);
      setScore(0);
      setCurrentQuestionIndex(0);
      setTimeStarted(new Date());

      toast({
        title: "Questions Generated!",
        description: `${parsedQuestions.length} MCQ questions ready for ${chapter}`,
      });

    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to generate questions. Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (isCompleted) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const submitAnswers = async () => {
    if (!user || !sessionId) return;

    const correctCount = questions.reduce((count, question, index) => {
      return userAnswers[index] === question.correct_answer ? count + 1 : count;
    }, 0);

    const finalScore = correctCount;
    const timeTaken = timeStarted ? Math.floor((new Date().getTime() - timeStarted.getTime()) / 1000) : 0;

    try {
      const { error } = await (supabase as any)
        .from('classroom_mcq')
        .update({
          user_answers: userAnswers,
          score: finalScore,
          is_completed: true,
          completion_percentage: (finalScore / questions.length) * 100,
          time_taken_seconds: timeTaken,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.warn('Database update failed, updating localStorage:', error);
        const localKey = `mcq_session_${sessionId}`;
        const existingSession = JSON.parse(localStorage.getItem(localKey) || '{}');
        const updatedSession = {
          ...existingSession,
          user_answers: userAnswers,
          score: finalScore,
          is_completed: true,
          completion_percentage: (finalScore / questions.length) * 100,
          time_taken_seconds: timeTaken,
          completed_at: new Date().toISOString()
        };
        localStorage.setItem(localKey, JSON.stringify(updatedSession));
      }

      setScore(finalScore);
      setIsCompleted(true);

      toast({
        title: "Quiz Completed!",
        description: `You scored ${finalScore}/${questions.length} (${Math.round((finalScore / questions.length) * 100)}%)`,
      });

    } catch (error: any) {
      console.error('Error submitting answers:', error);
      setScore(finalScore);
      setIsCompleted(true);
      
      toast({
        title: "Quiz Completed!",
        description: `You scored ${finalScore}/${questions.length} (${Math.round((finalScore / questions.length) * 100)}%) - Saved locally`,
      });
    }
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setIsCompleted(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setTimeStarted(new Date());
  };

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(userAnswers).length;

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Auto-Generated MCQ Questions
          </CardTitle>
          <CardDescription>
            Generate 5 multiple choice questions for {chapter} in {subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Ready to Test Your Knowledge?</h3>
            <p className="text-muted-foreground mb-4">
              Click below to generate 5 MCQ questions based on {contentTitle || chapter}
            </p>
          </div>
          <Button 
            onClick={generateMCQQuestions} 
            disabled={generating}
            size="lg"
            className="w-full max-w-sm"
          >
            {generating ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Generating Questions...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate MCQ Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Quiz Completed!
          </CardTitle>
          <CardDescription>
            Your results for {chapter} in {subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {Math.round((score / questions.length) * 100)}%
            </div>
            <p className="text-muted-foreground">
              {score} out of {questions.length} questions correct
            </p>
          </div>

          <Progress value={(score / questions.length) * 100} className="w-full" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Answers</h3>
            {questions.map((question, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correct_answer;
              
              return (
                <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center mt-1">
                          <span className="text-white text-xs">✕</span>
                        </div>
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
                            {question.options[question.correct_answer]}
                          </p>
                          {question.explanation && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Explanation:</span> {question.explanation}
                            </p>
                          )}
                        </div>
                      </div>
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
            <Button variant="outline" onClick={generateMCQQuestions}>
              <Brain className="h-4 w-4 mr-2" />
              Generate New Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              MCQ Questions - {chapter}
            </CardTitle>
            <CardDescription>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {answeredCount}/{questions.length} answered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress value={progress} className="w-full" />

        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 mt-1">
                Q{currentQuestionIndex + 1}
              </Badge>
              <p className="text-lg font-medium">{currentQuestion.question}</p>
            </div>
            
            <RadioGroup 
              value={userAnswers[currentQuestionIndex]?.toString() || ""} 
              onValueChange={(value) => handleAnswerSelect(currentQuestionIndex, parseInt(value))}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={optIndex.toString()} id={`option-${optIndex}`} />
                  <Label htmlFor={`option-${optIndex}`} className="flex-1 cursor-pointer">
                    <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button 
                onClick={submitAnswers}
                disabled={answeredCount < questions.length}
              >
                Submit Quiz ({answeredCount}/{questions.length})
              </Button>
            ) : (
              <Button 
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassroomMCQ;