import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/lib/app-context";
import LoginPage from "./pages/Login";
import OnboardingPage from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import DailyPracticePage from "./pages/DailyPractice";
import GrammarPage from "./pages/Grammar";
import VocabularyPage from "./pages/Vocabulary";
import SpeakingPage from "./pages/Speaking";
import PlacementPage from "./pages/Placement";
import MockTestPage from "./pages/MockTest";
import ProgressPage from "./pages/Progress";
import ProfilePage from "./pages/Profile";
import AdminPage from "./pages/Admin";
import AdminCoursesPage from "./pages/AdminCourses";
import CoursesPage from "./pages/Courses";
import AdminAssessmentsPage from "./pages/AdminAssessments";
import AssessmentsPage from "./pages/Assessments";
import SubmissionsPage from "./pages/Submissions";
import AdminSubmissionsPage from "./pages/AdminSubmissions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function Protected({ children, requireOnboarding = true }: { children: JSX.Element; requireOnboarding?: boolean }) {
  const { isAuthenticated, onboardingComplete, loading } = useApp();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (requireOnboarding && !onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, onboardingComplete, loading } = useApp();
  return (
    <Routes>
      <Route path="/" element={
        loading ? <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
        : !isAuthenticated ? <LoginPage />
        : !onboardingComplete ? <Navigate to="/onboarding" />
        : <Navigate to="/dashboard" />
      } />
      <Route path="/onboarding" element={<Protected requireOnboarding={false}><OnboardingPage /></Protected>} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/daily-practice" element={<Protected><DailyPracticePage /></Protected>} />
      <Route path="/grammar" element={<Protected><GrammarPage /></Protected>} />
      <Route path="/vocabulary" element={<Protected><VocabularyPage /></Protected>} />
      <Route path="/speaking" element={<Protected><SpeakingPage /></Protected>} />
      <Route path="/placement" element={<Protected><PlacementPage /></Protected>} />
      <Route path="/mock-test" element={<Protected><MockTestPage /></Protected>} />
      <Route path="/progress" element={<Protected><ProgressPage /></Protected>} />
      <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
      <Route path="/admin" element={<Protected requireOnboarding={false}><AdminPage /></Protected>} />
      <Route path="/admin/courses" element={<Protected requireOnboarding={false}><AdminCoursesPage /></Protected>} />
      <Route path="/admin/assessments" element={<Protected requireOnboarding={false}><AdminAssessmentsPage /></Protected>} />
      <Route path="/courses" element={<Protected><CoursesPage /></Protected>} />
      <Route path="/assessments" element={<Protected><AssessmentsPage /></Protected>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
