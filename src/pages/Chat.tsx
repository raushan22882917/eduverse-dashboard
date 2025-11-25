import { ChatInterface } from '@/components/ChatInterface';
import { useAuth } from '@/contexts/AuthContext';
import StudentSidebar from '@/components/StudentSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Sparkles, BookOpen, Lightbulb } from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b p-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">AI Chat Tutor</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Gemini AI</span>
                  <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded">Wolfram Alpha</span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">
              Ask any question about your subjects and get comprehensive, educational answers with step-by-step solutions
            </p>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <ChatInterface userId={user?.id || ''} />
          </div>

          {/* Sidebar with Tips */}
          <aside className="w-80 border-l p-6 bg-muted/30 overflow-y-auto">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Tips for Better Answers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Be Specific</p>
                    <p className="text-muted-foreground">
                      Ask detailed questions for better explanations
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Include Context</p>
                    <p className="text-muted-foreground">
                      Mention the topic or chapter you're studying
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Bot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Follow Up</p>
                    <p className="text-muted-foreground">
                      Ask follow-up questions to deepen understanding
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Math Problems</p>
                    <p className="text-muted-foreground">
                      For math questions, I use Wolfram Alpha for verified step-by-step solutions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Example Questions</CardTitle>
                <CardDescription>Try asking these:</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-3 bg-background rounded-lg border">
                  <p className="font-medium mb-1">Mathematics</p>
                  <p className="text-muted-foreground">
                    "Explain the concept of derivatives with examples"
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="font-medium mb-1">Physics</p>
                  <p className="text-muted-foreground">
                    "What are Newton's laws of motion? Give real-world examples"
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="font-medium mb-1">Chemistry</p>
                  <p className="text-muted-foreground">
                    "How do chemical bonds form? Explain ionic and covalent bonds"
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="font-medium mb-1">Biology</p>
                  <p className="text-muted-foreground">
                    "Explain the process of photosynthesis step by step"
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

