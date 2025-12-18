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
import Notifications from "./pages/Notifications";
import CreateNotification from "./pages/CreateNotification";
import Settings from "./pages/Settings";
import Homework from "./pages/Homework";
import HomeworkSubmission from "./pages/HomeworkSubmission";
import Microplan from "./pages/Microplan";
import ContentLibrary from "./pages/ContentLibrary";
import ContentDetail from "./pages/ContentDetail";
import Classroom from "./pages/Classroom";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import Analytics from "./pages/Analytics";
import ContentManagement from "./pages/ContentManagement";
import ManageContent from "./pages/ManageContent";
import ExamList from "./pages/ExamList";
import ExamTest from "./pages/ExamTest";
import ExamResults from "./pages/ExamResults";
import ExamHistory from "./pages/ExamHistory";
import ExamAttemptsTable from "./pages/ExamAttemptsTable";
import QuizTest from "./pages/QuizTest";
import FocusTimer from "./pages/FocusTimer";
import AITutoring from "./pages/AITutoring";
import EnhancedAITutor from "./pages/EnhancedAITutor";
import AITutorPage from "./pages/dashboard/student/ai-tutor";
import TeacherTools from "./pages/TeacherTools";
import TeacherStudentManagement from "./pages/TeacherStudentManagement";
import TeacherPerformance from "./pages/TeacherPerformance";
import TeacherContent from "./pages/TeacherContent";
import TeacherExamCreation from "./pages/TeacherExamCreation";
import TeacherHomeworkCreation from "./pages/TeacherHomeworkCreation";
import TeacherCreateContent from "./pages/TeacherCreateContent";
import TeacherViewContent from "./pages/TeacherViewContent";
import TeacherExamSubmissions from "./pages/TeacherExamSubmissions";
import TeacherQuizManagement from "./pages/TeacherQuizManagement";
import TeacherQuizCreation from "./pages/TeacherQuizCreation";
import TeacherQuizDetail from "./pages/TeacherQuizDetail";
import TeacherAITutorMonitoring from "./pages/TeacherAITutorMonitoring";
import Chat from "./pages/Chat";
import UserContentUpload from "./pages/UserContentUpload";
import ContentDownloads from "./pages/ContentDownloads";
import PYQPractice from "./pages/PYQPractice";
import DrawInAir from "./pages/DrawInAir";
import QuizCreatorPage from "./pages/QuizCreatorPage";
import QuizPreviewPage from "./pages/QuizPreviewPage";
import QuizSharePage from "./pages/QuizSharePage";
import GlobalScreenLens from "./components/GlobalScreenLens";

import SchoolManagement from "./pages/SchoolManagement";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary>
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
            <Route path="/dashboard/student/content/downloads" element={<ContentDownloads />} />
            <Route path="/dashboard/student/achievements" element={<Achievements />} />
            <Route path="/dashboard/student/microplan" element={<Microplan />} />
            <Route path="/dashboard/student/homework" element={<Homework />} />
            <Route path="/dashboard/student/homework/submit/:sessionId" element={<HomeworkSubmission />} />
            <Route path="/dashboard/student/notifications" element={<Notifications />} />
            <Route path="/dashboard/student/settings" element={<Settings />} />
            <Route path="/dashboard/student/exams" element={<ExamList />} />
            <Route path="/dashboard/student/exam/start/:examSetId" element={<ExamTest />} />
            <Route path="/dashboard/student/practice/pyq" element={<PYQPractice />} />
            <Route path="/dashboard/student/draw-in-air" element={<DrawInAir />} />
            <Route path="/draw-in-air" element={<DrawInAir />} />
            <Route path="/dashboard/student/practice/pyq" element={<PYQPractice />} />

            <Route path="/dashboard/student/exam/results/:sessionId" element={<ExamResults />} />
            <Route path="/dashboard/student/exam/history" element={<ExamHistory />} />
            <Route path="/dashboard/student/exam/attempts" element={<ExamAttemptsTable />} />
            <Route path="/dashboard/student/quiz/start/:microplanId" element={<QuizTest />} />
            <Route path="/dashboard/student/quiz/results/:sessionId" element={<QuizTest />} />
            <Route path="/dashboard/student/upload-content" element={<UserContentUpload />} />
            <Route path="/dashboard/student/focus" element={<FocusTimer />} />
            <Route path="/dashboard/student/ai-tutoring" element={<AITutoring />} />
            <Route path="/dashboard/student/ai-tutor" element={<AITutorPage />} />
            <Route path="/dashboard/student/chat" element={<Chat />} />
            <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
            <Route path="/dashboard/teacher/students" element={<TeacherStudentManagement />} />
            <Route path="/dashboard/teacher/performance" element={<TeacherPerformance />} />
            <Route path="/dashboard/teacher/content" element={<TeacherContent />} />
            <Route path="/dashboard/teacher/create" element={<TeacherCreateContent />} />
            <Route path="/dashboard/teacher/view-content" element={<TeacherViewContent />} />
            <Route path="/dashboard/teacher/exams/submissions/:examSetId" element={<TeacherExamSubmissions />} />
            <Route path="/dashboard/teacher/exams/create" element={<TeacherExamCreation />} />
            <Route path="/dashboard/teacher/homework/create" element={<TeacherHomeworkCreation />} />
            <Route path="/dashboard/teacher/quizzes" element={<TeacherQuizManagement />} />
            <Route path="/dashboard/teacher/quizzes/create" element={<TeacherQuizCreation />} />
            <Route path="/dashboard/teacher/quizzes/:quizId" element={<TeacherQuizDetail />} />
            <Route path="/quiz-creator" element={<QuizCreatorPage />} />
            <Route path="/quiz-preview" element={<QuizPreviewPage />} />
            <Route path="/quiz-share/:shareKey" element={<QuizSharePage />} />
            <Route path="/dashboard/teacher/tools" element={<TeacherTools />} />
            <Route path="/dashboard/teacher/ai-tutor-monitoring" element={<TeacherAITutorMonitoring />} />
            <Route path="/dashboard/teacher/notifications" element={<Notifications />} />
            <Route path="/dashboard/teacher/notifications/create" element={<CreateNotification />} />
            <Route path="/dashboard/teacher/settings" element={<Settings />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/admin/users" element={<UserManagement />} />
            <Route path="/dashboard/admin/schools" element={<SchoolManagement />} />
            <Route path="/dashboard/admin/analytics" element={<Analytics />} />
            <Route path="/dashboard/admin/content" element={<ContentManagement />} />
            <Route path="/dashboard/admin/content/manage" element={<ManageContent />} />
            <Route path="/dashboard/admin/notifications" element={<Notifications />} />
            <Route path="/dashboard/admin/notifications/create" element={<CreateNotification />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Global Screen Lens - Available on all pages for authenticated users */}
          <GlobalScreenLens />
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
