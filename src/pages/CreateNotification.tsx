import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import TeacherSidebar from "@/components/TeacherSidebar";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Users, X, GraduationCap, UserCheck } from "lucide-react";

interface Student {
  user_id: string;
  full_name: string;
  class_grade?: number;
  avatar_url?: string;
}

interface Teacher {
  user_id: string;
  full_name: string;
  avatar_url?: string;
}

const CreateNotification = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userRole, setUserRole] = useState<'admin' | 'teacher' | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [recipientType, setRecipientType] = useState<'students' | 'teachers' | 'both'>('students');
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("announcement");
  const [priority, setPriority] = useState("medium");
  const [actionUrl, setActionUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'admin') {
        fetchAllUsers();
      } else {
        fetchStudents();
      }
    }
  }, [user, userRole]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        // Try alternative query
        const { data: rolesArray } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .limit(1);
        
        if (rolesArray && rolesArray.length > 0) {
          const role = rolesArray[0].role;
          setUserRole(role === 'admin' ? 'admin' : 'teacher');
        }
      } else if (roleData) {
        setUserRole(roleData.role === 'admin' ? 'admin' : 'teacher');
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchAllUsers = async () => {
    if (!user) return;

    try {
      setLoadingRecipients(true);
      
      // Fetch all profiles with roles
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      const { data: studentProfiles } = await supabase
        .from("student_profiles")
        .select("user_id, class_grade");

      if (!profiles || !roles) return;

      // Separate students and teachers
      const studentsList: Student[] = [];
      const teachersList: Teacher[] = [];

      profiles.forEach((profile) => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        const studentProfile = studentProfiles?.find(sp => sp.user_id === profile.user_id);

        if (userRole?.role === 'student') {
          studentsList.push({
            user_id: profile.user_id,
            full_name: profile.full_name || "Unknown Student",
            class_grade: studentProfile?.class_grade,
            avatar_url: profile.avatar_url
          });
        } else if (userRole?.role === 'teacher') {
          teachersList.push({
            user_id: profile.user_id,
            full_name: profile.full_name || "Unknown Teacher",
            avatar_url: profile.avatar_url
          });
        }
      });

      setStudents(studentsList);
      setTeachers(teachersList);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch users",
      });
    } finally {
      setLoadingRecipients(false);
    }
  };

  const fetchStudents = async () => {
    if (!user) return;

    try {
      setLoadingRecipients(true);
      const data = await api.teacher.getStudents(user.id);
      
      // Fetch profile details for each student
      const studentsWithProfiles = await Promise.all(
        (data || []).map(async (student: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", student.user_id)
            .single();

          return {
            user_id: student.user_id,
            full_name: profile?.full_name || "Unknown Student",
            class_grade: student.class_grade,
            avatar_url: profile?.avatar_url
          };
        })
      );

      setStudents(studentsWithProfiles);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch students",
      });
    } finally {
      setLoadingRecipients(false);
    }
  };

  const toggleRecipient = useCallback((userId: string) => {
    setSelectedRecipients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const getFilteredRecipients = useMemo(() => {
    // Early return if userRole not loaded yet
    if (!userRole) return [];
    
    // Compute isAdmin inside useMemo to avoid initialization issues
    const isAdmin = userRole === 'admin';
    let allRecipients: Array<(Student & { type: 'student' }) | (Teacher & { type: 'teacher' })> = [];
    
    if (!isAdmin) {
      // For teachers, only show students
      allRecipients = students.map(s => ({ ...s, type: 'student' as const }));
    } else {
      // For admins, filter by recipient type
      if (recipientType === 'students') {
        allRecipients = students.map(s => ({ ...s, type: 'student' as const }));
      } else if (recipientType === 'teachers') {
        allRecipients = teachers.map(t => ({ ...t, type: 'teacher' as const }));
      } else {
        // Both
        allRecipients = [
          ...students.map(s => ({ ...s, type: 'student' as const })),
          ...teachers.map(t => ({ ...t, type: 'teacher' as const }))
        ];
      }
    }
    
    if (!searchQuery.trim()) {
      return allRecipients;
    }
    return allRecipients.filter(r =>
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, teachers, recipientType, searchQuery, userRole]);

  const selectAll = useCallback(() => {
    const filtered = getFilteredRecipients;
    if (selectedRecipients.size === filtered.length && filtered.length > 0) {
      setSelectedRecipients(new Set());
    } else {
      setSelectedRecipients(new Set(filtered.map(r => r.user_id)));
    }
  }, [selectedRecipients.size, getFilteredRecipients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title and message are required",
      });
      return;
    }

    if (selectedRecipients.size === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one recipient",
      });
      return;
    }

    if (!user) return;

    try {
      setSending(true);
      
      // Create notification for each selected recipient
      const promises = Array.from(selectedRecipients).map(userId =>
        api.notifications.create({
          user_id: userId,
          title: title.trim(),
          message: message.trim(),
          type: type,
          priority: priority,
          action_url: actionUrl.trim() || undefined,
          created_by: user.id
        })
      );

      await Promise.all(promises);

      const recipientCount = selectedRecipients.size;
      const recipientText = userRole === 'admin'
        ? `${recipientCount} recipient(s) (${recipientType})`
        : `${recipientCount} student(s)`;

      toast({
        title: "Success",
        description: `Notification sent to ${recipientText}`,
      });

      // Reset form
      setTitle("");
      setMessage("");
      setActionUrl("");
      setSelectedRecipients(new Set());
      setType("announcement");
      setPriority("medium");
      setRecipientType('students');
      
      // Navigate back to appropriate notifications page
      if (userRole === 'admin') {
        navigate("/dashboard/admin");
      } else {
        navigate("/dashboard/teacher/notifications");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send notifications",
      });
    } finally {
      setSending(false);
    }
  };

  const allSelected = getFilteredRecipients.length > 0 && selectedRecipients.size === getFilteredRecipients.length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading || !userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const Sidebar = userRole === 'admin' ? AdminSidebar : TeacherSidebar;
  const isAdmin = userRole === 'admin';

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Notification</h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "Send notifications to teachers and students"
                : "Send notifications to your students"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Notification Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Details</CardTitle>
                    <CardDescription>
                      Enter the notification title and message
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., New Assignment Available"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter the notification message..."
                        rows={6}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={type} onValueChange={setType}>
                          <SelectTrigger id="type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="announcement">Announcement</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="homework">Homework</SelectItem>
                            <SelectItem value="exam">Exam</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="grade">Grade</SelectItem>
                            <SelectItem value="message">Message</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger id="priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actionUrl">Action URL (Optional)</Label>
                      <Input
                        id="actionUrl"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        placeholder="e.g., /dashboard/student/exams"
                      />
                      <p className="text-xs text-muted-foreground">
                        URL to navigate when notification is clicked
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recipient Selection */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <CardTitle>
                          {isAdmin ? "Select Recipients" : "Select Students"}
                        </CardTitle>
                        <CardDescription>
                          {selectedRecipients.size} selected
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    {isAdmin && (
                      <Tabs value={recipientType} onValueChange={(v) => {
                        setRecipientType(v as 'students' | 'teachers' | 'both');
                        setSelectedRecipients(new Set());
                        setSearchQuery("");
                      }}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="students">
                            <Users className="h-4 w-4 mr-2" />
                            Students
                          </TabsTrigger>
                          <TabsTrigger value="teachers">
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Teachers
                          </TabsTrigger>
                          <TabsTrigger value="both">
                            <UserCheck className="h-4 w-4 mr-2" />
                            Both
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Input
                        placeholder={isAdmin ? "Search recipients..." : "Search students..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-3"
                      />
                      <ScrollArea className="h-[500px]">
                        {loadingRecipients ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : getFilteredRecipients.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No recipients found</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {getFilteredRecipients.map((recipient) => (
                              <div
                                key={recipient.user_id}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent"
                              >
                                <Checkbox
                                  checked={selectedRecipients.has(recipient.user_id)}
                                  onCheckedChange={() => toggleRecipient(recipient.user_id)}
                                />
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                  {recipient.type === 'teacher' && (
                                    <Badge variant="outline" className="text-xs">
                                      Teacher
                                    </Badge>
                                  )}
                                  {recipient.type === 'student' && (
                                    <Badge variant="secondary" className="text-xs">
                                      Student
                                    </Badge>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {recipient.full_name}
                                    </p>
                                    {'class_grade' in recipient && recipient.class_grade && (
                                      <p className="text-xs text-muted-foreground">
                                        Grade {recipient.class_grade}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isAdmin) {
                    navigate("/dashboard/admin");
                  } else {
                    navigate("/dashboard/teacher/notifications");
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sending || selectedRecipients.size === 0}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedRecipients.size} {isAdmin 
                      ? recipientType === 'both' 
                        ? 'Recipient(s)'
                        : recipientType === 'teachers'
                        ? 'Teacher(s)'
                        : 'Student(s)'
                      : 'Student(s)'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateNotification;

