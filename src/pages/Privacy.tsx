import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Shield, 
  Lock,
  Eye,
  Database,
  UserCheck,
  Calendar,
  Mail,
  Globe,
  FileText,
  Settings,
  AlertTriangle
} from "lucide-react";

const Privacy = () => {
  const lastUpdated = "December 27, 2025";

  const sections = [
    {
      id: "overview",
      title: "1. Privacy Overview",
      icon: Shield,
      content: [
        "At EduVerse, we are committed to protecting your privacy and ensuring the security of your personal information.",
        "This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational platform.",
        "We believe in transparency and want you to understand exactly how your data is handled.",
        "By using EduVerse, you consent to the data practices described in this policy."
      ]
    },
    {
      id: "collection",
      title: "2. Information We Collect",
      icon: Database,
      content: [
        "Account Information: Name, email address, password, profile picture, and educational preferences.",
        "Learning Data: Progress tracking, quiz results, study patterns, time spent on activities, and performance analytics.",
        "Content Data: Notes, assignments, uploaded files, and user-generated content within the platform.",
        "Technical Data: IP address, browser type, device information, and usage analytics for service improvement.",
        "Communication Data: Messages sent through our platform, support tickets, and feedback submissions."
      ]
    },
    {
      id: "usage",
      title: "3. How We Use Your Information",
      icon: Settings,
      content: [
        "Personalized Learning: Create adaptive learning paths and provide personalized AI tutoring experiences.",
        "Progress Tracking: Monitor your educational progress and provide detailed analytics to you and your teachers.",
        "Service Improvement: Analyze usage patterns to enhance our platform features and user experience.",
        "Communication: Send important updates, educational content, and respond to your inquiries.",
        "Security: Protect against fraud, unauthorized access, and ensure platform security."
      ]
    },
    {
      id: "sharing",
      title: "4. Information Sharing",
      icon: UserCheck,
      content: [
        "Teachers and Administrators: Your learning progress and performance data may be shared with your assigned teachers and school administrators.",
        "Parents/Guardians: For users under 18, parents may access their child's learning progress and account information.",
        "Service Providers: We may share data with trusted third-party services that help us operate our platform (hosting, analytics, etc.).",
        "Legal Requirements: We may disclose information when required by law or to protect our rights and safety.",
        "We never sell your personal information to third parties for marketing purposes."
      ]
    },
    {
      id: "security",
      title: "5. Data Security",
      icon: Lock,
      content: [
        "We implement industry-standard security measures including encryption, secure servers, and regular security audits.",
        "All data transmission is encrypted using SSL/TLS protocols to protect information in transit.",
        "Access to personal data is restricted to authorized personnel who need it to provide our services.",
        "We regularly update our security practices and conduct vulnerability assessments.",
        "In case of a data breach, we will notify affected users and authorities as required by law."
      ]
    },
    {
      id: "retention",
      title: "6. Data Retention",
      icon: Calendar,
      content: [
        "We retain your account information for as long as your account is active or as needed to provide services.",
        "Learning progress data is retained to maintain continuity of your educational experience.",
        "Inactive accounts may be deleted after 3 years of inactivity, with prior notice to users.",
        "You can request deletion of your data at any time, subject to legal and operational requirements.",
        "Some data may be retained in anonymized form for research and service improvement purposes."
      ]
    },
    {
      id: "rights",
      title: "7. Your Privacy Rights",
      icon: Eye,
      content: [
        "Access: You can request a copy of all personal data we hold about you.",
        "Correction: You can update or correct your personal information through your account settings.",
        "Deletion: You can request deletion of your account and associated data.",
        "Portability: You can request your data in a portable format to transfer to another service.",
        "Opt-out: You can opt out of non-essential communications and certain data processing activities."
      ]
    },
    {
      id: "cookies",
      title: "8. Cookies and Tracking",
      icon: Globe,
      content: [
        "We use cookies and similar technologies to enhance your experience and analyze platform usage.",
        "Essential cookies are necessary for platform functionality and cannot be disabled.",
        "Analytics cookies help us understand how users interact with our platform to improve services.",
        "You can control cookie preferences through your browser settings.",
        "We do not use cookies for targeted advertising or share cookie data with advertising networks."
      ]
    },
    {
      id: "children",
      title: "9. Children's Privacy",
      icon: UserCheck,
      content: [
        "We take special care to protect the privacy of users under 18 years of age.",
        "For users under 13, we comply with COPPA (Children's Online Privacy Protection Act) requirements.",
        "Parental consent is required for users under 13 to create accounts and use our services.",
        "Parents can review, modify, or delete their child's personal information at any time.",
        "We limit data collection from minors to what is necessary for educational purposes."
      ]
    },
    {
      id: "international",
      title: "10. International Data Transfers",
      icon: Globe,
      content: [
        "Your data may be processed and stored in countries other than your own.",
        "We ensure appropriate safeguards are in place for international data transfers.",
        "We comply with applicable data protection laws including GDPR for EU users.",
        "Data transfers are conducted using approved mechanisms such as Standard Contractual Clauses.",
        "You can contact us for more information about the safeguards we use for international transfers."
      ]
    },
    {
      id: "changes",
      title: "11. Policy Updates",
      icon: FileText,
      content: [
        "We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.",
        "We will notify users of significant changes via email or platform notifications.",
        "The updated policy will be posted on this page with a new 'Last Updated' date.",
        "Continued use of our services after policy updates constitutes acceptance of the changes.",
        "We encourage you to review this policy periodically to stay informed about how we protect your privacy."
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
            <Shield className="h-4 w-4 mr-2" />
            Privacy & Security
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Privacy{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              Policy
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
            Your privacy matters to us. Learn how we collect, use, and protect your personal information.
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
              {sections.slice(0, 8).map((section) => (
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

      {/* Privacy Content */}
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
            <h2 className="text-2xl font-bold mb-4 text-foreground">Privacy Questions?</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              If you have any questions about this Privacy Policy or how we handle your data, please contact our privacy team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Link to="/contact">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Privacy Team
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-2">
                <Link to="/terms">View Terms of Service</Link>
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
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;