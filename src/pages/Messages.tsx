import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { 
  MessageSquare, 
  Send, 
  Search,
  Bot,
  User,
  Clock,
  Check,
  CheckCheck
} from "lucide-react";

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<string | null>("ai-tutor");
  const [message, setMessage] = useState("");
  const [doubtHistory, setDoubtHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDoubtHistory();
    }
  }, [user]);

  const fetchDoubtHistory = async () => {
    if (!user) return;
    
    try {
      setLoadingHistory(true);
      const history = await api.doubt.history({ user_id: user.id, limit: 20 });
      setDoubtHistory(history || []);
    } catch (error) {
      console.error("Error fetching doubt history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const chats = [
    {
      id: "ai-tutor",
      name: "AI Tutor Assistant",
      avatar: "🤖",
      lastMessage: doubtHistory.length > 0 
        ? doubtHistory[0].query?.substring(0, 50) + "..." 
        : "Ask me anything about your studies!",
      timestamp: doubtHistory.length > 0 
        ? formatTimestamp(doubtHistory[0].created_at) 
        : "Just now",
      unread: 0,
      isAI: true
    },
  ];

  const getMessagesForChat = () => {
    if (selectedChat === "ai-tutor") {
      return doubtHistory.map((doubt, index) => ({
        id: doubt.id || index,
        sender: index % 2 === 0 ? "You" : "AI Tutor Assistant",
        text: index % 2 === 0 
          ? doubt.query || doubt.text || ""
          : doubt.response?.generated_text || doubt.solution || "I'm here to help!",
        timestamp: formatTimestamp(doubt.created_at),
        isAI: index % 2 !== 0,
        isRead: true
      }));
    }
    return [];
  };

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const messages = getMessagesForChat();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      // Send message via doubt solver API
      const response = await api.doubt.text({
        user_id: user.id,
        text: message,
      });

      // Refresh history to show new message
      await fetchDoubtHistory();
      setMessage("");
      
      toast({
        title: "Message sent",
        description: "Your question has been processed!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      });
    }
  };

  if (loading || loadingHistory) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentChat = chats.find(chat => chat.id === selectedChat);

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 flex overflow-hidden bg-background">
        {/* Chat List Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                    selectedChat === chat.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10">
                        {chat.isAI ? <Bot className="h-5 w-5" /> : chat.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{chat.name}</p>
                        <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5">
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-card">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10">
                      {currentChat?.isAI ? <Bot className="h-5 w-5" /> : currentChat?.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{currentChat?.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {currentChat?.isAI ? "AI Assistant" : "Teacher"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.isAI ? "justify-start" : "justify-end"
                      }`}
                    >
                      {msg.isAI && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.isAI
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {msg.isAI && (
                          <p className="text-xs font-semibold mb-1 text-muted-foreground">
                            {msg.sender}
                          </p>
                        )}
                        <p className="text-sm">{msg.text}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs opacity-70">{msg.timestamp}</span>
                          {!msg.isAI && (
                            <span className="ml-1">
                              {msg.isRead ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      {!msg.isAI && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-card">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;

