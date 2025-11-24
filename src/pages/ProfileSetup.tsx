import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Shield, Mail, Phone, Building, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const studentSchema = z.object({
  classGrade: z.number().min(6).max(12),
  schoolName: z.string().min(2, "School name is required"),
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  parentPhone: z.string().optional(),
  learningGoals: z.string().optional(),
});

const ProfileSetup = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [classGrade, setClassGrade] = useState<string>("6");
  const [schoolName, setSchoolName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  // Admin fields
  const [adminDepartment, setAdminDepartment] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [adminTitle, setAdminTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      // Check if profile is already completed
      supabase
        .from("profiles")
        .select("profile_completed")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile?.profile_completed) {
            // Profile already completed, redirect to dashboard
            // First check role to know where to redirect
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", user.id)
              .maybeSingle()
              .then(({ data: roleData }) => {
                if (roleData) {
                  navigate(`/dashboard/${roleData.role}`);
                } else {
                  navigate("/dashboard/student"); // Default to student
                }
              });
            return;
          }
        });

      // Check for pending role from signup
      const pendingRole = sessionStorage.getItem('pending_role');
      if (pendingRole) {
        setRole(pendingRole as string);
        return;
      }

      // Fetch user role if already exists
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching role:", error);
          }
          if (data) {
            setRole(data.role);
            
            // If admin, fetch existing profile data
            if (data.role === "admin" && user) {
              supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle()
                .then(({ data: profileData }) => {
                  if (profileData) {
                    // Set admin email from user metadata or profile
                    setAdminEmail(user.email || "");
                  }
                });
            }
          } else {
            // No role found - user needs to set one up
            // Default to student if coming from signup without role
            const pendingRole = sessionStorage.getItem('pending_role');
            if (pendingRole) {
              setRole(pendingRole);
            } else {
              // If no pending role, default to student
              setRole("student");
            }
          }
        });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // First, insert or ensure user role exists
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: role as any }, { onConflict: 'user_id,role' });

      if (roleError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: roleError.message,
        });
        setLoading(false);
        return;
      }

      // Clear pending role from session storage
      sessionStorage.removeItem('pending_role');

      if (role === "student") {
        // Validate student data
        const validation = studentSchema.safeParse({
          classGrade: parseInt(classGrade),
          schoolName,
          parentEmail: parentEmail || undefined,
          parentPhone,
          learningGoals,
        });

        if (!validation.success) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: validation.error.errors[0].message,
          });
          setLoading(false);
          return;
        }

        // Insert or update student profile (use upsert in case profile already exists)
        const { error: studentError } = await supabase
          .from("student_profiles")
          .upsert({
            user_id: user.id,
            class_grade: parseInt(classGrade),
            school_name: schoolName,
            parent_email: parentEmail || null,
            parent_phone: parentPhone || null,
            learning_goals: learningGoals || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (studentError) {
          console.error("Student profile error:", studentError);
          toast({
            variant: "destructive",
            title: "Error",
            description: studentError.message || "Failed to save student profile",
          });
          setLoading(false);
          return;
        }
      }

      // Ensure profile exists, then update as completed
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: createError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || "User",
            profile_completed: true,
          });

        if (createError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: createError.message,
          });
          setLoading(false);
          return;
        }
      } else {
        // Update existing profile as completed
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ profile_completed: true })
          .eq("user_id", user.id);

        if (updateError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: updateError.message,
          });
          setLoading(false);
          return;
        }
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to AI Tutor Platform",
      });

      // Navigate to appropriate dashboard based on role
      if (role === "student") {
        navigate("/dashboard/student");
      } else if (role === "admin") {
        navigate("/dashboard/admin");
      } else if (role === "teacher") {
        navigate("/dashboard/teacher");
      } else {
        navigate("/dashboard/student"); // Default fallback
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If no role is set yet, show a message or default to student
  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Setting up your profile...</p>
            <Button 
              onClick={() => {
                const pendingRole = sessionStorage.getItem('pending_role') || 'student';
                setRole(pendingRole);
              }}
              className="mt-4"
            >
              Continue Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">AI Tutor</span>
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            {role === "student" && "Tell us about yourself to personalize your learning experience"}
            {role === "teacher" && "Set up your teaching profile"}
            {role === "admin" && "Configure your administrator profile"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {role === "student" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classGrade">Class / Grade</Label>
                    <Select value={classGrade} onValueChange={setClassGrade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                          <SelectItem key={grade} value={grade.toString()}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      type="text"
                      placeholder="Your school name"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Parent / Guardian Information (Optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        placeholder="parent@example.com"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentPhone">Parent Phone</Label>
                      <Input
                        id="parentPhone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learningGoals">Learning Goals (Optional)</Label>
                  <Textarea
                    id="learningGoals"
                    placeholder="What would you like to achieve? e.g., Improve math skills, prepare for exams..."
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                    rows={4}
                  />
                </div>
              </>
            )}

            {role === "teacher" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Teacher profile setup coming soon...</p>
              </div>
            )}

            {role === "admin" && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Administrator Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminTitle">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Job Title / Position
                        </div>
                      </Label>
                      <Input
                        id="adminTitle"
                        type="text"
                        placeholder="e.g., Platform Administrator, System Admin"
                        value={adminTitle}
                        onChange={(e) => setAdminTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminDepartment">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Department
                        </div>
                      </Label>
                      <Input
                        id="adminDepartment"
                        type="text"
                        placeholder="e.g., IT, Operations, Management"
                        value={adminDepartment}
                        onChange={(e) => setAdminDepartment(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Contact Email
                        </div>
                      </Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="admin@example.com"
                        value={adminEmail || user?.email || ""}
                        onChange={(e) => setAdminEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminPhone">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact Phone
                        </div>
                      </Label>
                      <Input
                        id="adminPhone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Administrative Notes (Optional)</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Any additional notes or information about your administrative role..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Admin Info Display */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Shield className="h-4 w-4" />
                      <span>Administrator Account</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">User ID:</span>
                        <p className="font-mono text-xs mt-1">{user?.id?.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Account Email:</span>
                        <p className="mt-1">{user?.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Full Name:</span>
                        <p className="mt-1">{user?.user_metadata?.full_name || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Role:</span>
                        <p className="mt-1 font-semibold text-primary">Administrator</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Complete Setup"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default ProfileSetup;
