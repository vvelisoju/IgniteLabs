import { useState, useEffect, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useAuth } from '@/lib/simplified-auth';
import { useLocation, useRoute } from 'wouter';
import { Loader2 } from 'lucide-react';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const [isLoginPage] = useRoute('/login');
  const [isRegisterPage] = useRoute('/register');
  const [, navigate] = useLocation();

  // Handle authentication redirects
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage && !isRegisterPage) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, isLoginPage, isRegisterPage, navigate]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  // If not authenticated and not on login/register page, show nothing until redirect happens
  if (!isAuthenticated && !isLoginPage && !isRegisterPage) {
    return null;
  }

  // For login and register pages, don't show the app shell
  if (isLoginPage || isRegisterPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Desktop Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

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
