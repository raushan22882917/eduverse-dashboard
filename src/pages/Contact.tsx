import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin,
  MessageCircle,
  Send,
  Clock,
  Globe,
  Users,
  HeadphonesIcon
} from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      contact: "support@eduverse.com",
      availability: "24/7 Response"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our team",
      contact: "+1 (555) 123-4567",
      availability: "Mon-Fri, 9AM-6PM EST"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Instant messaging support",
      contact: "Available in app",
      availability: "24/7 Available"
    },
    {
      icon: MapPin,
      title: "Office Location",
      description: "Visit our headquarters",
      contact: "123 Education St, Learning City, LC 12345",
      availability: "Mon-Fri, 9AM-5PM EST"
    }
  ];

  const faqs = [
    {
      question: "How do I get started with EduVerse?",
      answer: "Simply sign up for a free account and complete your profile setup. Our AI will create a personalized learning path for you."
    },
    {
      question: "Is EduVerse suitable for all age groups?",
      answer: "Yes! EduVerse adapts to learners of all ages, from elementary students to adult learners and professionals."
    },
    {
      question: "What subjects does EduVerse cover?",
      answer: "We cover a wide range of subjects including Mathematics, Science, Languages, History, and many more, with new content added regularly."
    },
    {
      question: "How does the AI tutoring work?",
      answer: "Our AI analyzes your learning patterns, strengths, and areas for improvement to provide personalized explanations, practice problems, and study recommendations."
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
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            <Link to="/contact" className="text-primary font-medium">Contact</Link>
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
            <HeadphonesIcon className="h-4 w-4 mr-2" />
            Contact Support
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Get in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              Touch
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Have questions about EduVerse? We're here to help! Reach out to our friendly support team.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactMethods.map((method, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 p-4 group-hover:scale-110 transition-transform duration-300">
                  <method.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-card-foreground">{method.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{method.description}</p>
                <p className="font-medium text-card-foreground mb-2">{method.contact}</p>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {method.availability}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Form & FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Send className="h-6 w-6 text-primary" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-2 block">
                      Full Name *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      required
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-2 block">
                      Email Address *
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                      className="border-2 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">
                    Subject *
                  </label>
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="What's this about?"
                    required
                    className="border-2 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">
                    Message *
                  </label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us more about your question or feedback..."
                    rows={6}
                    required
                    className="border-2 focus:border-primary resize-none"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div>
            <h2 className="text-3xl font-bold mb-6 text-foreground">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-card-foreground mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">Still have questions?</h3>
                <p className="text-muted-foreground mb-4">
                  Join our community forum to connect with other learners and get answers from our team.
                </p>
                <Button variant="outline" className="border-2">
                  <Globe className="h-4 w-4 mr-2" />
                  Visit Community Forum
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
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
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;