import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Star, 
  Award, 
  Target,
  Zap,
  Flame,
  Crown,
  Medal,
  CheckCircle2,
  Lock,
  Microscope
} from "lucide-react";

const Achievements = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [achievementsData, setAchievementsData] = useState<any>(null);
  const [loadingAchievements, setLoadingAchievements] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;
      
      setLoadingAchievements(true);
      try {
        const data = await api.progress.getAchievements(user.id);
        setAchievementsData(data);
      } catch (error: any) {
        console.error("Error fetching achievements:", error);
        // Only show error if it's not a network/CORS error
        if (error.message && !error.message.includes("Failed to fetch")) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to load achievements",
          });
        }
        // Set empty achievements on error
        setAchievementsData({ total_achievements: 0, achievements: [] });
      } finally {
        setLoadingAchievements(false);
      }
    };

    if (user) {
      fetchAchievements();
    }
  }, [user, toast]);

  // Transform API data to match UI format
  const achievements = achievementsData?.achievements?.map((ach: any, index: number) => ({
    id: ach.id || index,
    name: ach.name || ach.achievement_name || "Achievement",
    description: ach.description || `Earned in ${ach.subject || "subject"}`,
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    unlocked: true,
    unlockedDate: ach.earned_at || new Date().toISOString(),
    progress: 100,
    category: ach.category || "General",
    topic: ach.topic_id,
    subject: ach.subject
  })) || [];

  const unlockedCount = achievements.length;
  const totalCount = achievements.length || 0;
  const overallProgress = totalCount > 0 ? 100 : 0;

  if (loading || loadingAchievements) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Achievements</h1>
            <p className="text-muted-foreground">Track your learning milestones and accomplishments</p>
          </div>

          {/* Overall Progress Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>Your achievement collection progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{unlockedCount} / {totalCount}</span>
                  <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}% Complete</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Achievements Grid */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Unlocked Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {achievements
                .filter(a => a.unlocked)
                .map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <Card key={achievement.id} className="border-2 border-primary/20">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`${achievement.bgColor} p-3 rounded-lg`}>
                            <Icon className={`h-6 w-6 ${achievement.color}`} />
                          </div>
                          <Badge variant="default" className="bg-primary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Unlocked
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-2">{achievement.name}</CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Unlocked on {new Date(achievement.unlockedDate!).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>

          {/* Locked Achievements */}
          <div>
            <h2 className="text-2xl font-bold mb-4">In Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements
                .filter(a => !a.unlocked)
                .map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <Card key={achievement.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`${achievement.bgColor} p-3 rounded-lg opacity-50`}>
                            <Icon className={`h-6 w-6 ${achievement.color}`} />
                          </div>
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-2">{achievement.name}</CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Achievements;

