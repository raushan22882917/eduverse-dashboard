import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    url: string;
  };
  auto_dismiss?: boolean;
  dismiss_after?: number;
  created_at: string;
  read: boolean;
}

interface NotificationSystemProps {
  userId: string;
  className?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ userId, className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Auto-dismiss notifications
  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.auto_dismiss && notification.dismiss_after) {
        const timer = setTimeout(() => {
          handleDismiss(notification.id);
        }, notification.dismiss_after);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await api.notifications.get(userId);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await api.notifications.dismiss(notificationId, userId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to dismiss notification",
      });
    }
  };

  const handleAction = (action: { label: string; url: string }) => {
    if (action.url.startsWith('http')) {
      window.open(action.url, '_blank');
    } else {
      window.location.href = action.url;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm space-y-3 ${className}`}>
      {notifications.slice(0, 5).map((notification) => (
        <Card
          key={notification.id}
          className={`relative p-4 border-l-4 shadow-lg transition-all duration-300 hover:shadow-xl ${getNotificationStyle(notification.type)}`}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(notification.id)}
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Notification Content */}
          <div className="pr-8">
            <div className="flex items-start gap-3">
              {getNotificationIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {notification.message}
                </p>
                
                {/* Timestamp */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(notification.created_at).toLocaleTimeString()}
                </p>

                {/* Action Button */}
                {notification.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(notification.action!)}
                    className="mt-3 text-xs h-7"
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Unread Badge */}
          {!notification.read && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 h-3 w-3 p-0 bg-primary"
            />
          )}
        </Card>
      ))}

      {/* Show count if more notifications */}
      {notifications.length > 5 && (
        <Card className="p-2 text-center bg-muted">
          <p className="text-xs text-muted-foreground">
            +{notifications.length - 5} more notifications
          </p>
        </Card>
      )}
    </div>
  );
};

export default NotificationSystem;