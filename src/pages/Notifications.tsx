import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import TeacherSidebar from "@/components/TeacherSidebar";
import AdminSidebar from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Bell, 
  BellOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  CheckCheck,
  Plus,
  ChevronDown,
  ChevronUp,
  Info,
  Table2,
  LayoutGrid
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  metadata: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const Notifications = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchNotifications();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        // If maybeSingle() fails with 406, try alternative approach
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          const { data: rolesArray } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .limit(1);
          
          if (rolesArray && rolesArray.length > 0) {
            setUserRole(rolesArray[0].role);
          }
        } else {
          console.error("Error fetching user role:", error);
        }
      } else if (data?.role) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      // Default to student role if unable to fetch
      setUserRole("student");
    }
  };

  const fetchNotifications = async () => {
    if (!user) {
      console.log("No user, skipping notification fetch");
      return;
    }
    
    try {
      setLoadingNotifications(true);
      console.log("Fetching notifications for user:", user.id);
      
      // Try to fetch from API first
      try {
        const response = await api.notifications.getAll({
          user_id: user.id,
          limit: 500,
          offset: 0
        });
        
        console.log("API response:", response);
        
        // Handle both response formats: direct array or object with notifications property
        const notifications = Array.isArray(response) 
          ? response 
          : (response?.notifications || []);
        
        console.log("Parsed notifications:", notifications);
        
        if (notifications && Array.isArray(notifications) && notifications.length > 0) {
          console.log(`Found ${notifications.length} notifications from API`);
          setAllNotifications(notifications);
          return;
        } else {
          console.log("No notifications from API, trying Supabase direct");
        }
      } catch (apiError: any) {
        console.warn("API fetch failed, trying Supabase direct:", apiError);
      }
      
      // Fallback: Fetch directly from Supabase
      console.log("Fetching from Supabase directly...");
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);
      
      console.log("Supabase response - data:", data, "error:", error);
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      if (data && Array.isArray(data)) {
        // Transform Supabase data to match Notification interface
        const notifications = data.map((n: any) => ({
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type || "system",
          priority: n.priority || "medium",
          is_read: n.is_read || false,
          read_at: n.read_at || undefined,
          action_url: n.action_url || undefined,
          metadata: n.metadata || {},
          created_by: n.created_by || undefined,
          created_at: n.created_at,
          updated_at: n.updated_at,
        }));
        
        console.log(`Found ${notifications.length} notifications from Supabase`);
        setAllNotifications(notifications);
      } else {
        console.log("No notifications found");
        setAllNotifications([]);
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load notifications",
      });
      setAllNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user || markingRead) return;
    
    try {
      setMarkingRead(notificationId);
      await api.notifications.markAsRead(notificationId, user.id);
      
      // Update local state
      setAllNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      
      toast({
        title: "Notification marked as read",
        description: "Notification has been marked as read",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark notification as read",
      });
    } finally {
      setMarkingRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await api.notifications.markAllAsRead(user.id);
      await fetchNotifications();
      
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-blue-500";
      case "low":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return "📝";
      case "grade":
        return "📊";
      case "announcement":
        return "📢";
      case "homework":
        return "📚";
      case "exam":
        return "📋";
      case "quiz":
        return "❓";
      case "message":
        return "💬";
      default:
        return "🔔";
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a");
    } catch {
      return dateString;
    }
  };

  const toggleExpand = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const renderMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return <span className="text-xs text-muted-foreground italic">No metadata</span>;
    }
    
    return (
      <div className="space-y-1">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="font-medium text-muted-foreground">{key}:</span>
            <span className="text-foreground">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderNotificationsTable = (notifications: Notification[]) => {
    if (notifications.length === 0) {
      return (
        <div className="text-center py-12">
          <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No notifications found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">ID</TableHead>
              <TableHead className="min-w-[100px]">User ID</TableHead>
              <TableHead className="min-w-[150px]">Title</TableHead>
              <TableHead className="min-w-[200px]">Message</TableHead>
              <TableHead className="min-w-[100px]">Type</TableHead>
              <TableHead className="min-w-[100px]">Priority</TableHead>
              <TableHead className="min-w-[80px]">Read</TableHead>
              <TableHead className="min-w-[150px]">Read At</TableHead>
              <TableHead className="min-w-[200px]">Action URL</TableHead>
              <TableHead className="min-w-[100px]">Created By</TableHead>
              <TableHead className="min-w-[150px]">Created At</TableHead>
              <TableHead className="min-w-[150px]">Updated At</TableHead>
              <TableHead className="min-w-[200px]">Metadata</TableHead>
              <TableHead className="min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow 
                key={notification.id}
                className={notification.is_read ? "opacity-75" : "bg-muted/30"}
              >
                <TableCell className="font-mono text-xs">
                  {notification.id.substring(0, 8)}...
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {notification.user_id.substring(0, 8)}...
                </TableCell>
                <TableCell className="font-medium">{notification.title}</TableCell>
                <TableCell className="max-w-[200px] truncate">{notification.message}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {notification.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getPriorityColor(notification.priority)} text-white text-xs`}
                  >
                    {notification.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {notification.is_read ? (
                    <Badge variant="default" className="text-xs">Read</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Unread</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {notification.read_at ? formatTimestamp(notification.read_at) : "-"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">
                  {notification.action_url || "-"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {notification.created_by ? notification.created_by.substring(0, 8) + "..." : "-"}
                </TableCell>
                <TableCell className="text-xs">
                  {formatTimestamp(notification.created_at)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatTimestamp(notification.updated_at)}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {notification.metadata && Object.keys(notification.metadata).length > 0 ? (
                    <div className="text-xs">
                      {Object.keys(notification.metadata).length} key(s)
                      {expandedNotifications.has(notification.id) && (
                        <div className="mt-1 p-2 bg-muted rounded text-xs">
                          {renderMetadata(notification.metadata)}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs mt-1"
                        onClick={() => toggleExpand(notification.id)}
                      >
                        {expandedNotifications.has(notification.id) ? "Hide" : "Show"}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {notification.action_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          if (notification.action_url?.startsWith("http")) {
                            window.open(notification.action_url, "_blank");
                          } else {
                            navigate(notification.action_url || "#");
                          }
                        }}
                        title="View"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markingRead === notification.id}
                        title="Mark as Read"
                      >
                        {markingRead === notification.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const isExpanded = expandedNotifications.has(notification.id);
    
    return (
      <Card 
        className={`mb-3 transition-all hover:shadow-md ${
          notification.is_read ? "opacity-75" : "border-l-4 border-l-primary"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getTypeIcon(notification.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${notification.is_read ? "text-muted-foreground" : ""}`}>
                      {notification.title}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={`${getPriorityColor(notification.priority)} text-white text-xs`}
                    >
                      {notification.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {notification.type}
                    </Badge>
                  </div>
                  <p className={`text-sm ${notification.is_read ? "text-muted-foreground" : ""}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.is_read && (
                  <Badge variant="default" className="h-5 min-w-5 px-1.5 flex items-center justify-center">
                    New
                  </Badge>
                )}
              </div>
              
              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-muted-foreground">ID:</span>
                      <span className="ml-2 font-mono text-xs">{notification.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">User ID:</span>
                      <span className="ml-2 font-mono text-xs">{notification.user_id}</span>
                    </div>
                    {notification.created_by && (
                      <div>
                        <span className="font-medium text-muted-foreground">Created By:</span>
                        <span className="ml-2 font-mono text-xs">{notification.created_by}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-muted-foreground">Read Status:</span>
                      <span className="ml-2">{notification.is_read ? "Read" : "Unread"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Created At:</span>
                      <span className="ml-2">{formatTimestamp(notification.created_at)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Updated At:</span>
                      <span className="ml-2">{formatTimestamp(notification.updated_at)}</span>
                    </div>
                    {notification.read_at && (
                      <div>
                        <span className="font-medium text-muted-foreground">Read At:</span>
                        <span className="ml-2">{formatTimestamp(notification.read_at)}</span>
                      </div>
                    )}
                    {notification.action_url && (
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">Action URL:</span>
                        <span className="ml-2 break-all">{notification.action_url}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">Metadata:</span>
                    </div>
                    <div className="pl-5">
                      {renderMetadata(notification.metadata)}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(notification.created_at)}
                  </span>
                  {notification.action_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        if (notification.action_url?.startsWith("http")) {
                          window.open(notification.action_url, "_blank");
                        } else {
                          navigate(notification.action_url || "#");
                        }
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => toggleExpand(notification.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show Details
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={markingRead === notification.id}
                    >
                      {markingRead === notification.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading || loadingNotifications) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalUnread = allNotifications.filter(n => !n.is_read).length;
  const unreadNotifications = allNotifications.filter(n => !n.is_read);
  const readNotifications = allNotifications.filter(n => n.is_read);

  const SidebarComponent = userRole === "teacher" 
    ? TeacherSidebar 
    : userRole === "admin" 
    ? AdminSidebar 
    : StudentSidebar;

  return (
    <div className="flex min-h-screen w-full">
      <SidebarComponent />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold mb-2">Notifications</h1>
                <p className="text-muted-foreground">
                  All your notifications ({allNotifications.length} total, {totalUnread} unread)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-8 px-3"
                  >
                    <Table2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className="h-8 px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
                {userRole === "teacher" && (
                  <Button
                    variant="default"
                    onClick={() => navigate("/dashboard/teacher/notifications/create")}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Notification
                  </Button>
                )}
                {totalUnread > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleMarkAllAsRead}
                    className="gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark All Read ({totalUnread})
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* All Notifications */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all" className="gap-2">
                <Bell className="h-4 w-4" />
                All Notifications
                {allNotifications.length > 0 && (
                  <Badge variant="default" className="ml-2">
                    {allNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Unread
                {unreadNotifications.length > 0 && (
                  <Badge variant="default" className="ml-2">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Read
                {readNotifications.length > 0 && (
                  <Badge variant="default" className="ml-2">
                    {readNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Notifications</CardTitle>
                  <CardDescription>
                    Complete list of all your notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {viewMode === "table" ? (
                    <ScrollArea className="h-[600px]">
                      {renderNotificationsTable(allNotifications)}
                    </ScrollArea>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      {allNotifications.length === 0 ? (
                        <div className="text-center py-12">
                          <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <p className="text-muted-foreground">No notifications yet</p>
                        </div>
                      ) : (
                        <div>
                          {allNotifications.map((notification) => (
                            <NotificationCard key={notification.id} notification={notification} />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="unread" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Unread Notifications</CardTitle>
                  <CardDescription>
                    Notifications you haven't read yet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {viewMode === "table" ? (
                    <ScrollArea className="h-[600px]">
                      {renderNotificationsTable(unreadNotifications)}
                    </ScrollArea>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      {unreadNotifications.length === 0 ? (
                        <div className="text-center py-12">
                          <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <p className="text-muted-foreground">All caught up! No unread notifications</p>
                        </div>
                      ) : (
                        <div>
                          {unreadNotifications.map((notification) => (
                            <NotificationCard key={notification.id} notification={notification} />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="read" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Read Notifications</CardTitle>
                  <CardDescription>
                    Notifications you've already read
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {viewMode === "table" ? (
                    <ScrollArea className="h-[600px]">
                      {renderNotificationsTable(readNotifications)}
                    </ScrollArea>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      {readNotifications.length === 0 ? (
                        <div className="text-center py-12">
                          <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <p className="text-muted-foreground">No read notifications yet</p>
                        </div>
                      ) : (
                        <div>
                          {readNotifications.map((notification) => (
                            <NotificationCard key={notification.id} notification={notification} />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Notifications;

