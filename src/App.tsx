import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProfileSetup from "./pages/ProfileSetup";
import StudentDashboard from "./pages/StudentDashboard";
import AllSubjects from "./pages/AllSubjects";
import Achievements from "./pages/Achievements";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import DoubtSolver from "./pages/DoubtSolver";
import Homework from "./pages/Homework";
import Microplan from "./pages/Microplan";
import ContentLibrary from "./pages/ContentLibrary";
import ContentDetail from "./pages/ContentDetail";
import Classroom from "./pages/Classroom";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import Analytics from "./pages/Analytics";
import ContentManagement from "./pages/ContentManagement";
import ExamList from "./pages/ExamList";
import ExamTest from "./pages/ExamTest";
import ExamResults from "./pages/ExamResults";
import ExamHistory from "./pages/ExamHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/student/classroom" element={<Classroom />} />
            <Route path="/dashboard/student/subjects" element={<AllSubjects />} />
            <Route path="/dashboard/student/content" element={<ContentLibrary />} />
            <Route path="/dashboard/student/content/:contentId" element={<ContentDetail />} />
            <Route path="/dashboard/student/achievements" element={<Achievements />} />
            <Route path="/dashboard/student/microplan" element={<Microplan />} />
            <Route path="/dashboard/student/doubt" element={<DoubtSolver />} />
            <Route path="/dashboard/student/homework" element={<Homework />} />
            <Route path="/dashboard/student/messages" element={<Messages />} />
            <Route path="/dashboard/student/settings" element={<Settings />} />
            <Route path="/dashboard/student/exams" element={<ExamList />} />
            <Route path="/dashboard/student/exam/start/:examSetId" element={<ExamTest />} />
            <Route path="/dashboard/student/exam/results/:sessionId" element={<ExamResults />} />
            <Route path="/dashboard/student/exam/history" element={<ExamHistory />} />
            <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/admin/users" element={<UserManagement />} />
            <Route path="/dashboard/admin/analytics" element={<Analytics />} />
            <Route path="/dashboard/admin/content" element={<ContentManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
