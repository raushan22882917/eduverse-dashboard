import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { 
  MessageSquare, 
  Send, 
  Search,
  Bot,
  User,
  Check,
  CheckCheck,
  Sparkles,
  Wand2,
  Lightbulb,
  Users,
  Plus
} from "lucide-react";

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at?: string;
  last_message_content?: string;
  unread_count_participant1: number;
  unread_count_participant2: number;
  other_user?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [improving, setImproving] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [tone, setTone] = useState("professional");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [schoolTeachers, setSchoolTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchAvailableUsers();
      fetchSchoolTeachers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation && user) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoadingConversations(true);
      const convs = await api.messages.getConversations(user.id);
      
      // Fetch user details for each conversation
      const convsWithUsers = await Promise.all(
        convs.map(async (conv: any) => {
          const otherUserId = conv.participant1_id === user.id 
            ? conv.participant2_id 
            : conv.participant1_id;
          
          // Fetch user profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", otherUserId)
            .single();
          
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", otherUserId)
            .single();
          
          return {
            ...conv,
            other_user: {
              id: otherUserId,
              name: profile?.full_name || "Unknown User",
              role: roleData?.role || "student",
              avatar: profile?.avatar_url
            }
          };
        })
      );
      
      setConversations(convsWithUsers);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversations",
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchAvailableUsers = async () => {
    if (!user) return;
    
    try {
      // Get current user's role
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      const currentRole = userRole?.role || "student";
      
      // Fetch opposite role users (students see teachers, teachers see students)
      const targetRole = currentRole === "student" ? "teacher" : "student";
      
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", targetRole);
      
      if (!roles || roles.length === 0) return;
      
      const userIds = roles.map(r => r.user_id).filter(id => id !== user.id);
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      
      setAvailableUsers(profiles || []);
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  };

  const fetchSchoolTeachers = async () => {
    if (!user) return;
    
    try {
      setLoadingTeachers(true);
      
      // Get current user's role
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      const currentRole = userRole?.role || "student";
      let schoolId: string | null = null;
      
      // Get school_id based on user role
      if (currentRole === "student") {
        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("school_id")
          .eq("user_id", user.id)
          .single();
        
        schoolId = studentProfile?.school_id || null;
      } else if (currentRole === "teacher") {
        const { data: teacherProfile } = await supabase
          .from("teacher_profiles")
          .select("school_id")
          .eq("user_id", user.id)
          .single();
        
        schoolId = teacherProfile?.school_id || null;
      }
      
      if (!schoolId) {
        setSchoolTeachers([]);
        return;
      }
      
      // Fetch all teachers from the same school
      const { data: teacherProfiles } = await supabase
        .from("teacher_profiles")
        .select("user_id, subject_specializations")
        .eq("school_id", schoolId);
      
      if (!teacherProfiles || teacherProfiles.length === 0) {
        setSchoolTeachers([]);
        return;
      }
      
      const teacherIds = teacherProfiles
        .map(tp => tp.user_id)
        .filter(id => id !== user.id); // Exclude current user
      
      if (teacherIds.length === 0) {
        setSchoolTeachers([]);
        return;
      }
      
      // Fetch teacher profiles and roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", teacherIds);
      
      // Combine with teacher profile data
      const teachersWithDetails = (profiles || []).map(profile => {
        const teacherProfile = teacherProfiles.find(tp => tp.user_id === profile.user_id);
        return {
          ...profile,
          subject_specializations: teacherProfile?.subject_specializations || [],
        };
      });
      
      setSchoolTeachers(teachersWithDetails);
    } catch (error) {
      console.error("Error fetching school teachers:", error);
      setSchoolTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;
    
    try {
      setLoadingMessages(true);
      const msgs = await api.messages.getMessages({
        conversation_id: conversationId,
        user_id: user.id,
        limit: 100
      });
      setMessages(msgs || []);
      
      // Mark messages as read
      const unreadMessages = msgs.filter((m: Message) => !m.is_read && m.receiver_id === user.id);
      for (const msg of unreadMessages) {
        try {
          await api.messages.markAsRead(msg.id, user.id);
        } catch (e) {
          console.error("Error marking message as read:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleStartConversation = async (otherUserId: string) => {
    if (!user) return;
    
    try {
      const conversation = await api.messages.createConversation({
        participant1_id: user.id,
        participant2_id: otherUserId
      });
      
      setSelectedConversation(conversation.id);
      setShowNewChat(false);
      await fetchConversations();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start conversation",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !selectedConversation) return;

    const currentConv = conversations.find(c => c.id === selectedConversation);
    if (!currentConv) return;

    const receiverId = currentConv.participant1_id === user.id 
      ? currentConv.participant2_id 
      : currentConv.participant1_id;

    try {
      setSending(true);
      await api.messages.sendMessage({
        conversation_id: selectedConversation,
        sender_id: user.id,
        receiver_id: receiverId,
        content: message,
      });

      setMessage("");
      await fetchMessages(selectedConversation);
      await fetchConversations();
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      });
    } finally {
      setSending(false);
    }
  };

  const handleImproveMessage = async () => {
    if (!message.trim()) return;
    
    try {
      setImproving(true);
      const result = await api.messages.improveMessage({
        text: message,
        tone: tone,
        context: `Message to ${conversations.find(c => c.id === selectedConversation)?.other_user?.name || 'user'}`
      });
      
      setMessage(result.improved);
      toast({
        title: "Message improved",
        description: "Your message has been enhanced!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to improve message",
      });
    } finally {
      setImproving(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some context first",
      });
      return;
    }
    
    try {
      setLoadingSuggestions(true);
      const currentConv = conversations.find(c => c.id === selectedConversation);
      const recipientRole = currentConv?.other_user?.role || "teacher";
      
      const suggs = await api.messages.getSuggestions({
        context: message,
        recipient_role: recipientRole
      });
      
      setSuggestions(suggs || []);
      setShowAIHelper(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get suggestions",
      });
    } finally {
      setLoadingSuggestions(false);
    }
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

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  if (loading || loadingConversations) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 flex overflow-hidden bg-background">
        {/* Chat List Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Messages</h1>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNewChat(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
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
              {/* School Teachers Section */}
              {schoolTeachers.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-2 mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Teachers at Your School
                    </h3>
                  </div>
                  {loadingTeachers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {schoolTeachers.map((teacher) => {
                        const existingConv = conversations.find(
                          c => c.participant1_id === teacher.user_id || c.participant2_id === teacher.user_id
                        );
                        
                        return (
                          <div
                            key={teacher.user_id}
                            onClick={() => {
                              if (existingConv) {
                                setSelectedConversation(existingConv.id);
                              } else {
                                handleStartConversation(teacher.user_id);
                              }
                            }}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              existingConv && selectedConversation === existingConv.id
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-accent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={teacher.avatar_url} />
                                <AvatarFallback className="bg-primary/10">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {teacher.full_name}
                                </p>
                                {teacher.subject_specializations && teacher.subject_specializations.length > 0 && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {teacher.subject_specializations.join(", ")}
                                  </p>
                                )}
                              </div>
                              {existingConv && (
                                <Badge variant="outline" className="text-xs">
                                  Chat
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* Divider */}
              {schoolTeachers.length > 0 && conversations.length > 0 && (
                <div className="border-t my-4" />
              )}
              
              {/* Conversations Section */}
              <div className="mb-2">
                <div className="px-2 py-2 mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Conversations
                  </h3>
                </div>
              </div>
              
              {showNewChat && (
                <Card className="mb-2 p-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Start New Conversation</p>
                    <Select value={selectedUser || ""} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((u) => (
                          <SelectItem key={u.user_id} value={u.user_id}>
                            {u.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedUser) {
                            handleStartConversation(selectedUser);
                          }
                        }}
                        disabled={!selectedUser}
                      >
                        Start Chat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewChat(false);
                          setSelectedUser(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
              
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new conversation to begin messaging</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const unreadCount = conv.participant1_id === user?.id
                    ? conv.unread_count_participant1
                    : conv.unread_count_participant2;
                  
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                        selectedConversation === conv.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10">
                            {conv.other_user?.role === "teacher" ? (
                              <User className="h-5 w-5" />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">
                              {conv.other_user?.name || "Unknown User"}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(conv.last_message_at)}
                            </span>
                      </div>
                      <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message_content || "No messages yet"}
                            </p>
                            {unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5">
                                {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-card">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{currentConversation.other_user?.name || "Unknown User"}</h2>
                    <p className="text-sm text-muted-foreground capitalize">
                      {currentConversation.other_user?.role || "User"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation!</p>
                  </div>
                ) : (
                <div className="space-y-4">
                    {messages.map((msg) => {
                      const isSender = msg.sender_id === user?.id;
                      return (
                    <div
                      key={msg.id}
                          className={`flex gap-3 ${isSender ? "justify-end" : "justify-start"}`}
                    >
                          {!isSender && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10">
                                <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                              isSender
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-1 mt-1">
                              <span className={`text-xs ${isSender ? "opacity-70" : "text-muted-foreground"}`}>
                                {formatTimestamp(msg.created_at)}
                              </span>
                              {isSender && (
                            <span className="ml-1">
                                  {msg.is_read ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                          {isSender && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                      );
                    })}
                </div>
                )}
              </ScrollArea>

              {/* Message Input with AI Features */}
              <div className="p-4 border-t bg-card space-y-2">
                {/* AI Helper Panel */}
                {showAIHelper && suggestions.length > 0 && (
                  <Card className="p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">AI Suggestions</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAIHelper(false)}
                      >
                        ×
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start h-auto py-2"
                          onClick={() => {
                            setMessage(suggestion);
                            setShowAIHelper(false);
                          }}
                        >
                          <Lightbulb className="h-3 w-3 mr-2 shrink-0" />
                          <span className="text-xs">{suggestion}</span>
                        </Button>
                      ))}
                    </div>
                  </Card>
                )}
                
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                      className="flex-1 min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!message.trim() || improving}
                          >
                            {improving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Wand2 className="h-4 w-4" />
                            )}
                            <span className="ml-1">Improve</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Tone</p>
                            <Select value={tone} onValueChange={setTone}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="formal">Formal</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={handleImproveMessage}
                              disabled={improving}
                            >
                              {improving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Improving...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Improve Message
                                </>
                              )}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGetSuggestions}
                        disabled={!message.trim() || loadingSuggestions}
                      >
                        {loadingSuggestions ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Lightbulb className="h-4 w-4" />
                        )}
                        <span className="ml-1">Suggest</span>
                      </Button>
                    </div>
                    
                    <Button type="submit" disabled={!message.trim() || sending}>
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                    <Send className="h-4 w-4" />
                      )}
                  </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
                {availableUsers.length > 0 && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowNewChat(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Conversation
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
