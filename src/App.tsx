import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/app-context";
import { ThemeProvider } from "@/lib/theme";
import LoginPage from "./pages/Login";
import OnboardingPage from "./pages/Onboarding";
import Landing from "./pages/Landing";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const ModulesPage = lazy(() => import("./pages/Modules"));
const ModuleDetail = lazy(() => import("./pages/ModuleDetail"));
const TaskPlayer = lazy(() => import("./pages/TaskPlayer"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Verify = lazy(() => import("./pages/Verify"));
const Settings = lazy(() => import("./pages/Settings"));
const ProgressPage = lazy(() => import("./pages/Progress"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const AdminPage = lazy(() => import("./pages/Admin"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboard"));
const AdminQuestions = lazy(() => import("./pages/AdminQuestions"));
const AdminAnnouncements = lazy(() => import("./pages/AdminAnnouncements"));
const AdminImportPage = lazy(() => import("./pages/AdminImport"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const Loader = () => (
  <div className="min-h-screen-safe flex items-center justify-center text-muted-foreground text-sm">Loading…</div>
);

// Dev mode: authentication disabled. Protected is a pass-through.
function Protected({ children }: { children: JSX.Element; requireOnboarding?: boolean }) {
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:certNo" element={<Verify />} />
        <Route path="/onboarding" element={<Protected requireOnboarding={false}><OnboardingPage /></Protected>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/modules" element={<Protected><ModulesPage /></Protected>} />
        <Route path="/modules/:id" element={<Protected><ModuleDetail /></Protected>} />
        <Route path="/tasks/:taskId" element={<Protected><TaskPlayer /></Protected>} />
        <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
        <Route path="/certificates" element={<Protected><Certificates /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/progress" element={<Protected><ProgressPage /></Protected>} />
        <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
        <Route path="/admin" element={<Protected requireOnboarding={false}><AdminPage /></Protected>} />
        <Route path="/admin/dashboard" element={<Protected requireOnboarding={false}><AdminDashboardPage /></Protected>} />
        <Route path="/admin/questions" element={<Protected requireOnboarding={false}><AdminQuestions /></Protected>} />
        <Route path="/admin/announcements" element={<Protected requireOnboarding={false}><AdminAnnouncements /></Protected>} />
        <Route path="/admin/import" element={<Protected requireOnboarding={false}><AdminImportPage /></Protected>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Sonner />
        <AppProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
