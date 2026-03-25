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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, onboardingComplete } = useApp();
  return (
    <Routes>
      <Route path="/" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/onboarding" element={isAuthenticated ? <OnboardingPage /> : <Navigate to="/" />} />
      <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/daily-practice" element={isAuthenticated ? <DailyPracticePage /> : <Navigate to="/" />} />
      <Route path="/grammar" element={isAuthenticated ? <GrammarPage /> : <Navigate to="/" />} />
      <Route path="/vocabulary" element={isAuthenticated ? <VocabularyPage /> : <Navigate to="/" />} />
      <Route path="/speaking" element={isAuthenticated ? <SpeakingPage /> : <Navigate to="/" />} />
      <Route path="/placement" element={isAuthenticated ? <PlacementPage /> : <Navigate to="/" />} />
      <Route path="/mock-test" element={isAuthenticated ? <MockTestPage /> : <Navigate to="/" />} />
      <Route path="/progress" element={isAuthenticated ? <ProgressPage /> : <Navigate to="/" />} />
      <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/" />} />
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
