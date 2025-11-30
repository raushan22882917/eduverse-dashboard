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
          {/* Main Chat Area with Built-in Sidebar */}
          <div className="flex-1 flex flex-col">
            <ChatInterface userId={user?.id || ''} />
          </div>
        </div>
      </main>
    </div>
  );
}

