import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Shield, 
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Lock,
  Globe,
  Mail
} from "lucide-react";

const Terms = () => {
  const lastUpdated = "December 27, 2025";

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      icon: CheckCircle2,
      content: [
        "By accessing and using EduVerse, you accept and agree to be bound by the terms and provision of this agreement.",
        "If you do not agree to abide by the above, please do not use this service.",
        "These terms apply to all visitors, users, and others who access or use the service."
      ]
    },
    {
      id: "description",
      title: "2. Service Description",
      icon: FileText,
      content: [
        "EduVerse is an AI-powered educational platform that provides personalized learning experiences for students, teachers, and administrators.",
        "We offer various features including AI tutoring, progress tracking, content management, and virtual laboratories.",
        "The service is provided on an 'as is' and 'as available' basis."
      ]
    },
    {
      id: "accounts",
      title: "3. User Accounts",
      icon: Lock,
      content: [
        "You must create an account to access certain features of our service.",
        "You are responsible for safeguarding your account credentials and for all activities under your account.",
        "You must provide accurate and complete information when creating your account.",
        "You must be at least 13 years old to create an account. Users under 18 require parental consent."
      ]
    },
    {
      id: "conduct",
      title: "4. User Conduct",
      icon: Shield,
      content: [
        "You agree not to use the service for any unlawful purposes or to solicit others to perform unlawful acts.",
        "You are prohibited from violating or attempting to violate the security of the service.",
        "You may not use our service to transmit, distribute, or store material that is unlawful, defamatory, or inappropriate.",
        "Academic integrity must be maintained - cheating, plagiarism, or sharing answers is prohibited."
      ]
    },
    {
      id: "content",
      title: "5. Content and Intellectual Property",
      icon: Globe,
      content: [
        "All content provided on EduVerse, including text, graphics, logos, and software, is our property or licensed to us.",
        "You retain ownership of content you create and upload, but grant us a license to use it for service provision.",
        "You may not reproduce, distribute, or create derivative works from our content without permission.",
        "We respect intellectual property rights and expect users to do the same."
      ]
    },
    {
      id: "privacy",
      title: "6. Privacy and Data Protection",
      icon: Lock,
      content: [
        "Your privacy is important to us. Please review our Privacy Policy for information on data collection and use.",
        "We implement appropriate security measures to protect your personal information.",
        "We may use aggregated, anonymized data for research and service improvement purposes.",
        "You have the right to access, correct, or delete your personal data in accordance with applicable laws."
      ]
    },
    {
      id: "payments",
      title: "7. Payments and Subscriptions",
      icon: Scale,
      content: [
        "Some features require paid subscriptions. Pricing is clearly displayed before purchase.",
        "Subscriptions automatically renew unless cancelled before the renewal date.",
        "Refunds are provided in accordance with our refund policy.",
        "We reserve the right to change pricing with appropriate notice to existing subscribers."
      ]
    },
    {
      id: "termination",
      title: "8. Termination",
      icon: AlertTriangle,
      content: [
        "We may terminate or suspend your account immediately for violations of these terms.",
        "You may terminate your account at any time through your account settings.",
        "Upon termination, your right to use the service ceases immediately.",
        "We will retain your data in accordance with our data retention policy and applicable laws."
      ]
    },
    {
      id: "disclaimers",
      title: "9. Disclaimers and Limitations",
      icon: AlertTriangle,
      content: [
        "The service is provided 'as is' without warranties of any kind, express or implied.",
        "We do not guarantee that the service will be uninterrupted, secure, or error-free.",
        "We are not liable for any indirect, incidental, or consequential damages.",
        "Our total liability shall not exceed the amount paid by you for the service in the past 12 months."
      ]
    },
    {
      id: "changes",
      title: "10. Changes to Terms",
      icon: Calendar,
      content: [
        "We reserve the right to modify these terms at any time.",
        "Changes will be effective immediately upon posting on this page.",
        "Continued use of the service after changes constitutes acceptance of the new terms.",
        "We will notify users of significant changes via email or platform notifications."
      ]
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
            <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            <Link to="/terms" className="text-primary font-medium">Terms</Link>
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
            <Scale className="h-4 w-4 mr-2" />
            Legal Information
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Terms of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              Service
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
            Please read these terms carefully before using EduVerse. By using our service, you agree to these terms.
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="container mx-auto px-4 py-8">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-auto p-2 text-left"
                  onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <section.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-xs">{section.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Terms Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section) => (
            <Card key={section.id} id={section.id} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.content.map((paragraph, index) => (
                    <p key={index} className="text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-2 border-primary/20 shadow-xl max-w-4xl mx-auto">
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-foreground">Questions About These Terms?</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              If you have any questions about these Terms of Service, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Link to="/contact">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-2">
                <Link to="/privacy">View Privacy Policy</Link>
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
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;