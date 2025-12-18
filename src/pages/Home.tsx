import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  Shield, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Sparkles, 
  Zap, 
  Target,
  Play,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Brain,
  Clock,
  Globe,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Rocket
} from "lucide-react";

const Home = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({ students: 0, teachers: 0, satisfaction: 0 });

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "High School Student",
      content: "EduVerse's AI tutor helped me improve my math grades from C to A+ in just 3 months. The personalized learning path made all the difference!",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Dr. Michael Chen",
      role: "Mathematics Teacher",
      content: "As a teacher, I love how EduVerse provides detailed analytics on student progress. It helps me identify struggling students early and provide targeted support.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "University Student",
      content: "The 24/7 AI support is incredible. I can get help with complex physics problems at 2 AM when I'm studying for exams. Game changer!",
      rating: 5,
      avatar: "ER"
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Advanced algorithms adapt to your learning style",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Learn at your own pace, anytime, anywhere",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description: "Detailed analytics and performance insights",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Globe,
      title: "Global Community",
      description: "Connect with learners worldwide",
      color: "from-pink-500 to-rose-600"
    }
  ];

  // Animate stats on component mount
  useEffect(() => {
    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        callback(Math.floor(progress * (end - start) + start));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    const timer = setTimeout(() => {
      animateValue(0, 10000, 2000, (value) => 
        setAnimatedStats(prev => ({ ...prev, students: value }))
      );
      animateValue(0, 500, 2000, (value) => 
        setAnimatedStats(prev => ({ ...prev, teachers: value }))
      );
      animateValue(0, 95, 2000, (value) => 
        setAnimatedStats(prev => ({ ...prev, satisfaction: value }))
      );
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      <section className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-pulse">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Learning Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
              Learn Smarter with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 animate-gradient">
                AI-Powered
              </span>{" "}
              Education
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed">
              Personalized learning experiences for students, powerful tools for teachers, and comprehensive management for administrators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all hover:scale-105 text-lg px-8 py-6 group">
                <Link to="/signup">
                  Start Learning Free
                  <Rocket className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 border-2 hover:bg-primary/5 group">
                <Link to="/login">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right Side - Interactive Demo */}
          <div className="relative">
            <div className="bg-gradient-to-br from-card to-card/50 p-8 rounded-2xl border-2 border-primary/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">AI Tutor Demo</h3>
                  <p className="text-sm text-muted-foreground">Try asking a question!</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                  <p className="text-sm font-medium text-card-foreground">Student:</p>
                  <p className="text-muted-foreground">"Can you help me understand quadratic equations?"</p>
                </div>
                <div className="bg-accent/10 p-4 rounded-lg border-l-4 border-accent">
                  <p className="text-sm font-medium text-card-foreground">AI Tutor:</p>
                  <p className="text-muted-foreground">"Of course! Let me break down quadratic equations step by step with visual examples tailored to your learning style..."</p>
                </div>
              </div>
              
              <Button className="w-full group" asChild>
                <Link to="/signup">
                  Try AI Tutor Now
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-primary/10 p-3 rounded-full animate-bounce">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-accent/10 p-3 rounded-full animate-pulse">
              <Brain className="h-6 w-6 text-accent" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section className="relative container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-4 w-4 mr-2" />
            Powerful Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Why Choose EduVerse?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the future of education with our cutting-edge AI technology
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r ${feature.color} p-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
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

      {/* Testimonials Section */}
      <section className="relative bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-4 w-4 mr-2" />
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">What Our Users Say</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real stories from students and teachers who transformed their learning experience
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20 shadow-2xl">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-8">
                  <Quote className="h-12 w-12 text-primary/30" />
                  <div className="flex gap-1">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                
                <blockquote className="text-xl md:text-2xl text-card-foreground mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                      {testimonials[currentTestimonial].avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">{testimonials[currentTestimonial].name}</p>
                      <p className="text-muted-foreground">{testimonials[currentTestimonial].role}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-center gap-2 mt-6">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentTestimonial ? 'bg-primary w-8' : 'bg-primary/30'
                      }`}
                      onClick={() => setCurrentTestimonial(index)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 py-20 border-y-2 border-primary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Trusted by Thousands</h2>
            <p className="text-lg text-muted-foreground">Join our growing community of learners and educators</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                {animatedStats.students.toLocaleString()}+
              </div>
              <p className="text-lg text-muted-foreground font-medium">Active Students</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Learning every day</p>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                {animatedStats.teachers}+
              </div>
              <p className="text-lg text-muted-foreground font-medium">Expert Teachers</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Creating amazing content</p>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                {animatedStats.satisfaction}%
              </div>
              <p className="text-lg text-muted-foreground font-medium">Satisfaction Rate</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Users love our platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive CTA Section */}
      <section className="relative container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-2 border-primary/20 shadow-2xl overflow-hidden">
            <CardContent className="p-12 text-center relative">
              {/* Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 animate-pulse"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
                  <Rocket className="h-4 w-4" />
                  <span>Start Your Journey Today</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  Ready to Transform Your Learning?
                </h2>
                <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                  Join thousands of students achieving their goals with AI-powered personalized education. Start your free trial today!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Button size="lg" asChild className="shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-lg px-10 py-7 group">
                    <Link to="/signup">
                      Get Started Free
                      <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="text-lg px-10 py-7 border-2">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Free 14-day trial</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>No setup fees</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative border-t bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <span className="text-2xl font-bold text-foreground">EduVerse</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Transforming education with AI-powered personalized learning experiences.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <Globe className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Platform</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link to="/tutorials" className="hover:text-primary transition-colors">Tutorials</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/community" className="hover:text-primary transition-colors">Community</Link></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                <li><Link to="/security" className="hover:text-primary transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground">© 2025 EduVerse Platform. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Made with ❤️ for learners worldwide</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
