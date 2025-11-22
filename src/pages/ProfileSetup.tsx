import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      // Fetch user role
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setRole(data.role);
          }
        });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
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

        // Insert student profile
        const { error: studentError } = await supabase.from("student_profiles").insert({
          user_id: user.id,
          class_grade: parseInt(classGrade),
          school_name: schoolName,
          parent_email: parentEmail || null,
          parent_phone: parentPhone || null,
          learning_goals: learningGoals || null,
        });

        if (studentError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: studentError.message,
          });
          setLoading(false);
          return;
        }
      }

      // Update profile as completed
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

      toast({
        title: "Profile completed!",
        description: "Welcome to AI Tutor Platform",
      });

      navigate(`/dashboard/${role}`);
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

  if (authLoading || !role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">Admin profile setup coming soon...</p>
              </div>
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
