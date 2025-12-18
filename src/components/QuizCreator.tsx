import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Plus, Trash2, FileQuestion, Play, Download, Share2, Save } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  explanation?: string;
}

interface QuizData {
  title: string;
  description: string;
  subject: string;
  classGrade: number;
  durationMinutes: number;
  questions: QuizQuestion[];
  teacherId?: string; // Optional teacher ID
}

const subjects = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Art',
  'Music',
  'Physical Education'
];

const QuizCreator: React.FC = () => {
  const { toast } = useToast();
  
  const [quizData, setQuizData] = useState<QuizData>({
    title: '',
    description: '',
    subject: '',
    classGrade: 1,
    durationMinutes: 30,
    questions: [],
    teacherId: '' // Optional
  });

  const [currentQuestion, setCurrentQuestion] = useState<Partial<QuizQuestion>>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    marks: 1,
    explanation: ''
  });

  const addQuestion = () => {
    if (!currentQuestion.question?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a question",
      });
      return;
    }

    const validOptions = currentQuestion.options?.filter(opt => opt.trim()) || [];
    if (validOptions.length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide at least 2 options",
      });
      return;
    }

    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: currentQuestion.question!,
      options: currentQuestion.options!.filter(opt => opt.trim()),
      correctAnswer: currentQuestion.correctAnswer || 0,
      marks: currentQuestion.marks || 1,
      explanation: currentQuestion.explanation || ''
    };

    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    // Reset current question
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 1,
      explanation: ''
    });

    toast({
      title: "Question Added",
      description: "Question has been added to the quiz",
    });
  };

  const removeQuestion = (questionId: string) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const updateCurrentQuestionOption = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt) || []
    }));
  };

  const generateQuizJSON = () => {
    if (!quizData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a quiz title",
      });
      return;
    }

    if (quizData.questions.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one question",
      });
      return;
    }

    const quiz = {
      ...quizData,
      totalMarks: quizData.questions.reduce((sum, q) => sum + q.marks, 0),
      createdAt: new Date().toISOString(),
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    return quiz;
  };

  const saveQuizToDatabase = async () => {
    const quiz = generateQuizJSON();
    if (!quiz) return;

    try {
      // Save to database using the API
      const response = await api.teacher.createQuiz({
        teacher_id: quizData.teacherId || 'anonymous_teacher',
        title: quiz.title,
        subject: quiz.subject.toLowerCase() as any,
        description: quiz.description,
        quiz_data: {
          questions: quiz.questions.map((q, index) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correctAnswer,
            marks: q.marks,
            explanation: q.explanation,
            question_number: index + 1
          })),
          title: quiz.title,
          total_questions: quiz.questions.length
        },
        duration_minutes: quiz.durationMinutes,
        total_marks: quiz.totalMarks,
        class_grade: quiz.classGrade,
        metadata: {
          created_by: 'quiz_creator',
          teacher_id_optional: !quizData.teacherId,
          creation_source: 'manual'
        }
      });

      toast({
        title: "Quiz Saved Successfully!",
        description: "Your quiz has been saved to the database and can be accessed by students.",
      });

      return response;
    } catch (error: any) {
      console.error('Error saving quiz to database:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "Failed to save quiz to database. You can still download it as a file.",
      });
      throw error;
    }
  };

  const previewQuiz = () => {
    const quiz = generateQuizJSON();
    if (!quiz) return;

    // Store quiz in localStorage for preview
    localStorage.setItem('preview_quiz', JSON.stringify(quiz));
    
    toast({
      title: "Quiz Preview Ready",
      description: "Quiz has been prepared for preview mode",
    });

    // You can navigate to a preview page or open in a new window
    window.open('/quiz-preview', '_blank');
  };

  const downloadQuiz = () => {
    const quiz = generateQuizJSON();
    if (!quiz) return;

    const dataStr = JSON.stringify(quiz, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Quiz Downloaded",
      description: "Quiz has been downloaded as JSON file",
    });
  };

  const shareQuiz = () => {
    const quiz = generateQuizJSON();
    if (!quiz) return;

    // Store in localStorage with a shareable key
    const shareKey = `shared_quiz_${Date.now()}`;
    localStorage.setItem(shareKey, JSON.stringify(quiz));
    
    // Create shareable URL (you can modify this based on your routing)
    const shareUrl = `${window.location.origin}/quiz-share/${shareKey}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Quiz Link Copied",
        description: "Shareable quiz link has been copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Share Link Created",
        description: `Share this link: ${shareUrl}`,
      });
    });
  };

  const totalMarks = quizData.questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <FileQuestion className="h-8 w-8" />
            Quiz Creator
          </h1>
          <p className="text-muted-foreground">
            Create interactive quizzes without database storage
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveQuizToDatabase} disabled={quizData.questions.length === 0} className="bg-primary">
            <Save className="h-4 w-4 mr-2" />
            Save to Database
          </Button>
          <Button variant="outline" onClick={previewQuiz} disabled={quizData.questions.length === 0}>
            <Play className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={downloadQuiz} disabled={quizData.questions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={shareQuiz} disabled={quizData.questions.length === 0}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Quiz Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
          <CardDescription>Basic information about your quiz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Chapter 5 Review Quiz"
                value={quizData.title}
                onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="teacherId">Teacher ID (Optional)</Label>
              <Input
                id="teacherId"
                placeholder="e.g., teacher123 (optional)"
                value={quizData.teacherId}
                onChange={(e) => setQuizData(prev => ({ ...prev, teacherId: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={quizData.subject} onValueChange={(value) => setQuizData(prev => ({ ...prev, subject: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="classGrade">Class/Grade</Label>
              <Select value={quizData.classGrade.toString()} onValueChange={(value) => setQuizData(prev => ({ ...prev, classGrade: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={quizData.durationMinutes}
                onChange={(e) => setQuizData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 30 }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the quiz..."
              value={quizData.description}
              onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions Summary */}
      {quizData.questions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Questions ({quizData.questions.length})</CardTitle>
              <Badge variant="secondary">{totalMarks} Total Marks</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quizData.questions.map((question, index) => (
                <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Q{index + 1}: {question.question}</p>
                    <p className="text-sm text-muted-foreground">
                      {question.options.length} options • {question.marks} marks
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Question */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Question</CardTitle>
          <CardDescription>Create a multiple-choice question</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="question">Question *</Label>
            <Textarea
              id="question"
              placeholder="Enter your question here..."
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
            />
          </div>

          <div>
            <Label>Options *</Label>
            <div className="space-y-2">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateCurrentQuestionOption(index, e.target.value)}
                  />
                  <Button
                    variant={currentQuestion.correctAnswer === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                  >
                    {currentQuestion.correctAnswer === index ? "Correct" : "Mark Correct"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marks">Marks</Label>
              <Input
                id="marks"
                type="number"
                min="1"
                value={currentQuestion.marks}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Input
                id="explanation"
                placeholder="Explain the correct answer..."
                value={currentQuestion.explanation}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              />
            </div>
          </div>

          <Button onClick={addQuestion} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizCreator;