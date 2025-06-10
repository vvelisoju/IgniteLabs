import React from "react";
import { Switch, Route, useLocation, useRoute } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "./lib/simplified-auth";
import { Loader2 } from "lucide-react";
import { useEffect, ReactNode, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";

// Landing Page
import LandingPage from "@/pages/landing/LandingPage";

// Policy Pages
import TermsOfService from "@/pages/policies/TermsOfService";
import PrivacyPolicy from "@/pages/policies/PrivacyPolicy";
import RefundPolicy from "@/pages/policies/RefundPolicy";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

// Dashboard
import Dashboard from "@/pages/dashboard/Dashboard";

// Batches
import Batches from "@/pages/batches/Batches";
import BatchDetail from "@/pages/batches/BatchDetail";

// Courses
import Courses from "@/pages/courses/Courses";
import CourseDetail from "@/pages/courses/CourseDetail";
import CourseContentForm from "@/pages/courses/CourseContentForm";

// Assignments
import Assignments from "@/pages/assignments/Assignments";
import AssignmentDetail from "@/pages/assignments/AssignmentDetail";

// Students Management
import Students from "@/pages/students/Students";
import StudentDetail from "@/pages/students/StudentDetail";
import FeesPage from "@/pages/fees/Fees";
import Leads from "@/pages/leads/Leads";
import LeadDetail from "@/pages/leads/LeadDetail";

// Code Editor
import CodeEditorPage from "@/pages/code-editor/CodeEditorPage";

// Analytics
import Analytics from "@/pages/analytics/Analytics";

// Profile
import Profile from "@/pages/profile/Profile";

// Settings
import Settings from "@/pages/settings/Settings";

// Lazy-loaded components
const LazyTrainers = lazy(() => import("@/pages/trainers/Trainers"));
const LazyTrainerBatches = lazy(() => import("@/pages/trainers/TrainerBatches"));

// AppShell component
function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isLoginPage] = useRoute('/auth/login');
  const [isRegisterPage] = useRoute('/auth/register');
  const [isForgotPasswordPage] = useRoute('/auth/forgot-password');
  const [isResetPasswordPage] = useRoute('/auth/reset-password');
  const [isLandingPage] = useRoute('/');
  const [isTermsPage] = useRoute('/terms-of-service');
  const [isPrivacyPage] = useRoute('/privacy-policy');
  const [isRefundPage] = useRoute('/refund-policy');
  const [, navigate] = useLocation();
  
  // Check if we're on a public page (landing or policy pages)
  const isPublicPage = isLandingPage || isTermsPage || isPrivacyPage || isRefundPage;
  // Check if we're on an auth page
  const isAuthPage = isLoginPage || isRegisterPage || isForgotPasswordPage || isResetPasswordPage;
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthPage && !isPublicPage) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, isLoading, isAuthPage, isPublicPage, navigate]);

  // If we're still loading the auth state, show a loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  // If not authenticated and not on auth/public pages, show nothing until redirect happens
  if (!isAuthenticated && !isAuthPage && !isPublicPage) {
    return null;
  }

  // For auth pages or public pages, don't show the app shell
  if (isAuthPage || isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-6 pb-16 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Landing Page as home */}
      <Route path="/" component={LandingPage} />
      
      {/* Policy Pages */}
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/refund-policy" component={RefundPolicy} />
      
      {/* Auth Routes */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      
      {/* Dashboard */}
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Batches */}
      <Route path="/batches" component={Batches} />
      <Route path="/batches/:id" component={BatchDetail} />
      
      {/* Courses */}
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id/content/new" component={CourseContentForm} />
      <Route path="/courses/:id" component={CourseDetail} />
      
      {/* Assignments */}
      <Route path="/assignments" component={Assignments} />
      <Route path="/assignments/:id" component={AssignmentDetail} />
      
      {/* Students Management */}
      <Route path="/leads" component={Leads} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/students" component={Students} />
      <Route path="/students/:id" component={StudentDetail} />
      <Route path="/fees" component={FeesPage} />
      
      {/* Trainer Management */}
      <Route path="/trainers">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <LazyTrainers />
        </Suspense>
      </Route>
      <Route path="/trainers/:id/batches">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <LazyTrainerBatches />
        </Suspense>
      </Route>
      
      {/* Code Editor */}
      <Route path="/code-editor" component={CodeEditorPage} />
      
      {/* Analytics */}
      <Route path="/analytics" component={Analytics} />
      
      {/* Profile */}
      <Route path="/profile" component={Profile} />
      
      {/* Settings */}
      <Route path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <HelmetProvider>
        <AuthProvider>
          <AppShell>
            <Router />
          </AppShell>
        </AuthProvider>
      </HelmetProvider>
      <Toaster />
    </>
  );
}

export default App;
