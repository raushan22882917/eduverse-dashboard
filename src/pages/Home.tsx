import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Shield, BookOpen, TrendingUp, Award } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">AI Tutor</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
          Learn Smarter with <span className="text-primary">AI-Powered</span> Education
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Personalized learning experiences for students, powerful tools for teachers, and comprehensive management for administrators.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/signup">Start Learning Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Built for Every Role</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-lg border">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">For Students</h3>
            <p className="text-muted-foreground mb-4">
              Personalized lesson plans, progress tracking, achievements, and 24/7 AI tutor support to help you excel.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Adaptive learning paths</li>
              <li>• Real-time progress tracking</li>
              <li>• Gamified achievements</li>
              <li>• AI homework help</li>
            </ul>
          </div>

          <div className="bg-card p-8 rounded-lg border">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">For Teachers</h3>
            <p className="text-muted-foreground mb-4">
              Manage classes, track student progress, create assignments, and get AI-powered insights.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Class management tools</li>
              <li>• Student analytics</li>
              <li>• Assignment creation</li>
              <li>• Performance insights</li>
            </ul>
          </div>

          <div className="bg-card p-8 rounded-lg border">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">For Admins</h3>
            <p className="text-muted-foreground mb-4">
              Complete platform oversight with user management, analytics, and system configuration.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• User role management</li>
              <li>• System analytics</li>
              <li>• Content moderation</li>
              <li>• Platform settings</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Active Students</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Teachers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <p className="text-muted-foreground">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4 text-foreground">Ready to Transform Your Learning?</h2>
        <p className="text-xl text-muted-foreground mb-8">Join thousands of students achieving their goals.</p>
        <Button size="lg" asChild>
          <Link to="/signup">Get Started Now</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 AI Tutor Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
