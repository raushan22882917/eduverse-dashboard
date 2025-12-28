import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  Target, 
  Heart,
  Brain,
  Globe,
  Award,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Star
} from "lucide-react";

const About = () => {
  const teamMembers = [
    {
      name: "Dr. Sarah Johnson",
      role: "CEO & Co-Founder",
      bio: "Former Stanford professor with 15+ years in educational technology",
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "CTO & Co-Founder", 
      bio: "AI researcher and former Google engineer specializing in machine learning",
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Education",
      bio: "Curriculum designer with expertise in personalized learning methodologies",
      avatar: "ER"
    }
  ];

  const values = [
    {
      icon: Target,
      title: "Student-Centered",
      description: "Every decision we make prioritizes student success and learning outcomes"
    },
    {
      icon: Brain,
      title: "Innovation-Driven",
      description: "We leverage cutting-edge AI to create breakthrough learning experiences"
    },
    {
      icon: Globe,
      title: "Accessible Education",
      description: "Making quality education available to learners everywhere, regardless of background"
    },
    {
      icon: Heart,
      title: "Empathy & Support",
      description: "We understand learning challenges and provide compassionate, personalized support"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="border-b bg-card/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">EduVerse</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/about" className="text-primary font-medium">About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
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
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            <Rocket className="h-4 w-4 mr-2" />
            About EduVerse
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Transforming Education with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              AI Innovation
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            We're on a mission to make personalized, high-quality education accessible to every learner worldwide through the power of artificial intelligence.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-foreground">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                At EduVerse, we believe that every student deserves a personalized learning experience that adapts to their unique needs, pace, and learning style. Our AI-powered platform breaks down traditional barriers to education, making it possible for anyone, anywhere, to access world-class learning resources.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Founded in 2023 by a team of educators, technologists, and AI researchers, we've already helped over 10,000 students achieve their academic goals through our innovative approach to personalized learning.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-muted-foreground">10,000+ Active Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-muted-foreground">500+ Expert Teachers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-muted-foreground">95% Satisfaction Rate</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="border-2 border-primary/20 shadow-xl">
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-xl mb-6">
                    <Lightbulb className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-card-foreground">Our Vision</h3>
                    <p className="text-muted-foreground">
                      To create a world where every learner has access to personalized, AI-powered education that unlocks their full potential.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Democratize quality education</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Eliminate learning barriers</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Empower global learners</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Our Core Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at EduVerse
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 p-4 group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-card-foreground">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Meet Our Team</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Passionate educators and technologists working together to revolutionize learning
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center font-bold text-2xl text-primary group-hover:scale-110 transition-transform duration-300">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-muted-foreground leading-relaxed">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-2 border-primary/20 shadow-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Ready to Join Our Mission?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Be part of the educational revolution. Start your personalized learning journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
                <Link to="/signup">
                  Start Learning Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">EduVerse</span>
            </div>
            <p className="text-muted-foreground">© 2025 EduVerse Platform. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;