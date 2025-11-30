import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Shield, BookOpen, TrendingUp, Award, Sparkles, Zap, Target } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 -z-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
      </div>

      {/* Navigation */}
      <nav className="relative border-b bg-card/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">EduVerse</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild className="hover:bg-primary/5">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-24 md:py-32 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Learning Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
            Learn Smarter with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              AI-Powered
            </span>{" "}
            Education
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Personalized learning experiences for students, powerful tools for teachers, and comprehensive management for administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all hover:scale-105 text-lg px-8 py-6">
              <Link to="/signup">Start Learning Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 border-2 hover:bg-primary/5">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Built for Every Role</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tailored solutions designed to empower every member of the educational ecosystem
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="group bg-card p-8 rounded-xl border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-card-foreground">For Students</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Personalized lesson plans, progress tracking, achievements, and 24/7 AI tutor support to help you excel.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Adaptive learning paths</span>
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span>Real-time progress tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span>Gamified achievements</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>AI homework help</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="group bg-card p-8 rounded-xl border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-card-foreground">For Teachers</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Manage classes, track student progress, create assignments, and get AI-powered insights.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Class management tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Student analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Assignment creation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span>Performance insights</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="group bg-card p-8 rounded-xl border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-card-foreground">For Admins</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Complete platform oversight with user management, analytics, and system configuration.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>User role management</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>System analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Content moderation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Platform settings</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 py-20 border-y-2 border-primary/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                10K+
              </div>
              <p className="text-lg text-muted-foreground font-medium">Active Students</p>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                500+
              </div>
              <p className="text-lg text-muted-foreground font-medium">Teachers</p>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                95%
              </div>
              <p className="text-lg text-muted-foreground font-medium">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-card to-card/50 p-12 rounded-2xl border-2 border-primary/20 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Join thousands of students achieving their goals with AI-powered personalized education.
          </p>
          <Button size="lg" asChild className="shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-lg px-10 py-7">
            <Link to="/signup">Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p className="font-medium">© 2025 EduVerse Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
