import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Sparkles, BookOpen, Users, Shield, ArrowLeft } from "lucide-react";
import InlineLoader from "@/components/InlineLoader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message,
        });
        return;
      }

      if (data.user) {
        // Get user role and navigate to appropriate dashboard
        try {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (roleError) {
            // If maybeSingle() fails with 406, try alternative approach
            if (roleError.code === 'PGRST116' || roleError.message?.includes('406')) {
              const { data: rolesArray } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", data.user.id)
                .limit(1);
              
              if (rolesArray && rolesArray.length > 0) {
                navigate(`/dashboard/${rolesArray[0].role}`);
                return;
              }
            } else {
              console.error("Error fetching user role:", roleError);
            }
          } else if (roleData) {
            // Navigate to the appropriate dashboard based on role
            navigate(`/dashboard/${roleData.role}`);
            return;
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
        
        // Default to student dashboard if no role found or error occurred
        navigate("/dashboard/student");
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 -z-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
      </div>

      {/* Header */}
      <nav className="relative border-b bg-card/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-primary/10 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">EduVerse</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hover:bg-primary/5">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="hover:bg-primary/5">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative flex items-center justify-center min-h-[calc(100vh-140px)] p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Welcome Content */}
          <div className="hidden lg:block space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                <span>Welcome Back to EduVerse</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold mb-6 text-foreground leading-tight">
                Continue Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                  Learning Journey
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Access your personalized dashboard, track your progress, and continue learning with AI-powered education.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Personalized Learning</h3>
                  <p className="text-sm text-muted-foreground">AI-adapted content just for you</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Collaborative Learning</h3>
                  <p className="text-sm text-muted-foreground">Connect with peers and teachers</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Secure Platform</h3>
                  <p className="text-sm text-muted-foreground">Your data is safe and protected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-2xl border-2 border-primary/20">
              <CardHeader className="space-y-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-2xl font-bold text-foreground">EduVerse</span>
                </div>
                <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
                <CardDescription className="text-base">
                  Sign in to access your personalized learning dashboard
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Link to="/forgot-password" className="text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-all hover:scale-105" 
                    disabled={loading}
                  >
                    {loading ? (
                      <InlineLoader text="Signing in..." variant="spin" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link to="/signup" className="text-primary hover:underline font-medium">
                        Create one now
                      </Link>
                    </p>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t bg-card/80 backdrop-blur-md mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">© 2025 EduVerse Platform. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/support" className="hover:text-primary transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
