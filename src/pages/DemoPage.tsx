import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth, DemoRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  Brain, 
  FlaskConical, 
  Target, 
  BarChart3, 
  CheckCircle2, 
  ArrowLeft
} from "lucide-react";

const DemoPage = () => {
  const { loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const { role } = useParams<{ role?: string }>();

  const handleEnterDemo = (targetRole: DemoRole) => {
    loginAsDemo(targetRole);
    navigate(`/dashboard/${targetRole}`);
  };

  useEffect(() => {
    if (role === 'student' || role === 'teacher' || role === 'admin') {
      loginAsDemo(role as DemoRole);
      navigate(`/dashboard/${role}`);
    }
  }, [role]);

  const personas = [
    {
      role: 'student' as DemoRole,
      title: "Student Dashboard",
      subtitle: "Personalized AI-powered learning",
      badge: "Most Popular",
      color: "from-blue-500/10 via-purple-500/10 to-indigo-500/10",
      borderColor: "border-primary/30 hover:border-primary",
      iconBg: "bg-primary/10 text-primary",
      icon: GraduationCap,
      highlights: [
        "24/7 AI Tutor with conversational voice & problem breakdown",
        "Interactive Virtual Science & Physics Labs (Simulations)",
        "Daily AI Microplans with adaptive concept summaries",
        "PYQ practice sets, exams & gesture-based Air Drawing",
        "Real-time mastery scores, streaks and progress charts"
      ],
      ctaText: "Launch Student Demo",
      path: "/dashboard/student"
    },
    {
      role: 'teacher' as DemoRole,
      title: "Teacher Dashboard",
      subtitle: "Classroom insights & automated tools",
      badge: "Educators",
      color: "from-emerald-500/10 via-teal-500/10 to-green-500/10",
      borderColor: "border-emerald-500/30 hover:border-emerald-500",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      icon: Users,
      highlights: [
        "Live student roster, attendance & activity monitoring",
        "AI-assisted homework & exam generator with rubrics",
        "Comprehensive quiz creation, management & grading",
        "Real-time AI Tutor session monitoring & safety alerts",
        "Student weakness diagnostics and targeted interventions"
      ],
      ctaText: "Launch Teacher Demo",
      path: "/dashboard/teacher"
    },
    {
      role: 'admin' as DemoRole,
      title: "Administrator Dashboard",
      subtitle: "Institutional analytics & governance",
      badge: "Institutions",
      color: "from-amber-500/10 via-orange-500/10 to-red-500/10",
      borderColor: "border-amber-500/30 hover:border-amber-500",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: Shield,
      highlights: [
        "School-wide student, teacher & parent account controls",
        "Mastery analytics, retention rates & completion metrics",
        "Curriculum alignment, content library & subject setup",
        "Virtual lab management & system resource allocation",
        "Audit logs, platform notifications & compliance tracking"
      ],
      ctaText: "Launch Admin Demo",
      path: "/dashboard/admin"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none -z-10" />

      {/* Header */}
      <nav className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-primary/10 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">EduVerse</span>
            <Badge variant="outline" className="ml-2 border-primary/40 text-primary hidden sm:inline-flex">
              Demo Access
            </Badge>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hover:bg-primary/5 text-sm">
              <Link to="/" className="flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-pulse">
            <Sparkles className="h-4 w-4" />
            <span>Instant Demo Access • No Login Required</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
            Explore the <span className="bg-gradient-to-r from-primary via-purple-600 to-indigo-600 bg-clip-text text-transparent">EduVerse Dashboard</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Select a role below to jump directly into a fully interactive demo dashboard with live sample data, AI features, and progress tracking.
          </p>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <Card 
                key={p.role} 
                className={`relative flex flex-col border-2 ${p.borderColor} transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden bg-card`}
              >
                <div className={`h-2 w-full bg-gradient-to-r ${p.color}`} />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl ${p.iconBg}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <Badge variant="secondary" className="font-medium text-xs">
                      {p.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold">{p.title}</CardTitle>
                  <CardDescription className="text-sm">{p.subtitle}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Key Features to Explore:
                  </p>
                  <ul className="space-y-2.5 text-sm">
                    {p.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground/80">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{h}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button 
                    type="button"
                    className="w-full group shadow-md hover:shadow-lg transition-all h-12 text-base font-semibold"
                    onClick={() => handleEnterDemo(p.role)}
                  >
                    <span>{p.ctaText}</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Feature Highlights Grid */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-card to-card/60 border-2 border-primary/20 shadow-xl mb-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Everything You Can Test in Demo Mode</h2>
            <p className="text-muted-foreground text-sm">
              All demo dashboards are pre-loaded with realistic state, so you can freely navigate and test the user experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-background/60 border">
              <div className="bg-purple-500/10 p-2.5 rounded-lg w-fit text-purple-600 mb-3">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-base mb-1">AI Tutor & Explanations</h3>
              <p className="text-xs text-muted-foreground">Test intelligent step-by-step guidance on complex STEM concepts.</p>
            </div>

            <div className="p-4 rounded-xl bg-background/60 border">
              <div className="bg-teal-500/10 p-2.5 rounded-lg w-fit text-teal-600 mb-3">
                <FlaskConical className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-base mb-1">Interactive Virtual Labs</h3>
              <p className="text-xs text-muted-foreground">Perform science experiments with 3D models and real-time simulations.</p>
            </div>

            <div className="p-4 rounded-xl bg-background/60 border">
              <div className="bg-blue-500/10 p-2.5 rounded-lg w-fit text-blue-600 mb-3">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-base mb-1">Adaptive Daily Microplans</h3>
              <p className="text-xs text-muted-foreground">Generate tailored daily study agendas customized to academic goals.</p>
            </div>

            <div className="p-4 rounded-xl bg-background/60 border">
              <div className="bg-orange-500/10 p-2.5 rounded-lg w-fit text-orange-600 mb-3">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-base mb-1">Performance Analytics</h3>
              <p className="text-xs text-muted-foreground">Inspect student mastery levels, study streak metrics, and rank leaderboards.</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">
            Ready to create a permanent account with customized curricula?
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" asChild className="px-8 shadow-lg">
              <Link to="/signup">
                Sign Up for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign In with Existing Account</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoPage;
