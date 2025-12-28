import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Moon,
  Sun,
  Mail,
  Phone,
  MapPin,
  Save,
  Camera,
  Wifi,
  WifiOff,
  Key
} from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import GeminiApiKeySetup from "@/components/GeminiApiKeySetup";

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setLocation(user.user_metadata?.location || "");
      setLanguage(localStorage.getItem('preferred_language') || 'en');
      setLowBandwidthMode(localStorage.getItem('low_bandwidth_mode') === 'true');
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from("student_profiles")
        .select("parent_phone")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (profile) {
        setPhone(profile.parent_phone || "");
        // Location is not stored in student_profiles, keeping it empty
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });

      if (authError) throw authError;

      // Update student profile if exists
      // Note: Only update parent_phone as location is not in the schema
      const { error: profileError } = await supabase
        .from("student_profiles")
        .update({
          parent_phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Don't throw, as profile might not exist yet
      }
      
      // Store location in user metadata if provided
      if (location) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            location: location,
          },
        });
        if (metadataError) {
          console.error("Error updating location in metadata:", metadataError);
        }
      }

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save settings",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          {/* Profile Settings */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {fullName ? getInitials(fullName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, GIF or PNG. Max size of 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about your learning progress
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  disabled={!notificationsEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your device
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  disabled={!notificationsEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize the look and feel of your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <CardTitle>Language & Region</CardTitle>
              </div>
              <CardDescription>Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <LanguageSelector
                  defaultLanguage={language}
                  onLanguageChange={(lang) => {
                    setLanguage(lang);
                    localStorage.setItem('preferred_language', lang);
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="low-bandwidth">Low-Bandwidth Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Optimize for slower connections by reducing data usage
                  </p>
                </div>
                <Switch
                  id="low-bandwidth"
                  checked={lowBandwidthMode}
                  onCheckedChange={(checked) => {
                    setLowBandwidthMode(checked);
                    localStorage.setItem('low_bandwidth_mode', checked.toString());
                    if (checked) {
                      document.documentElement.setAttribute('data-low-bandwidth', 'true');
                    } else {
                      document.documentElement.removeAttribute('data-low-bandwidth');
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Access & Inclusion */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <CardTitle>Access & Inclusion</CardTitle>
              </div>
              <CardDescription>Accessibility and performance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="screen-reader">Screen Reader Support</Label>
                  <p className="text-sm text-muted-foreground">
                    Enhanced ARIA labels and semantic HTML
                  </p>
                </div>
                <Switch
                  id="screen-reader"
                  defaultChecked={true}
                  disabled={true}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="low-bandwidth-access">Low-Bandwidth Optimization</Label>
                  <p className="text-sm text-muted-foreground">
                    Compress images and reduce data usage
                  </p>
                </div>
                <Switch
                  id="low-bandwidth-access"
                  checked={lowBandwidthMode}
                  onCheckedChange={(checked) => {
                    setLowBandwidthMode(checked);
                    localStorage.setItem('low_bandwidth_mode', checked.toString());
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Privacy & Security</CardTitle>
              </div>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive">
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <CardTitle>AI Features Configuration</CardTitle>
              </div>
              <CardDescription>Configure API keys for enhanced AI features</CardDescription>
            </CardHeader>
            <CardContent>
              <GeminiApiKeySetup />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard/student")}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;

