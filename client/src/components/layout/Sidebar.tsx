import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Users, BookOpen, FileText, Code, BarChart2, MessageSquare, Settings, Flame, IndianRupee, PhoneCall, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/simplified-auth';

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  // Define base navigation items
  const baseNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/batches', label: 'Batches', icon: Users },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/assignments', label: 'Assignments', icon: FileText },
    { path: '/code-editor', label: 'Code Editor', icon: Code },
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  ];
  
  // Add manager-specific navigation items
  const managerNavItems = user?.role === 'manager' || user?.role === 'admin' 
    ? [
        { path: '/leads', label: 'Leads', icon: PhoneCall },
        { path: '/students', label: 'Students', icon: Users },
        { path: '/trainers', label: 'Trainers', icon: GraduationCap }
      ] 
    : [];
  
  // Add admin-specific navigation items if needed
  const adminNavItems: { path: string; label: string; icon: any }[] = [];
  
  // Combine nav items based on user role
  let navItems = [...baseNavItems];
  
  // Add manager-specific items for managers and admins
  if (managerNavItems.length > 0) {
    navItems = [...navItems, ...managerNavItems];
  }
  
  // Add admin-specific items for admins
  if (user?.role === 'admin' && adminNavItems.length > 0) {
    navItems = [...navItems, ...adminNavItems];
  }

  return (
    <aside className={cn(
      "hidden md:flex md:flex-col md:w-64 bg-white border-r border-neutral-100 shadow-sm transition-all",
      { "fixed inset-0 z-40 md:relative flex": open }
    )}>
      {/* Mobile Close Button */}
      {open && (
        <div className="md:hidden absolute right-4 top-4">
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Logo */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="bg-primary-600 text-white p-1 rounded">
            <Flame className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold text-primary-600">Ignite Labs</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
            {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium">{user?.name || 'User'}</p>
            <p className="text-sm text-neutral-500 flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-secondary-500"></span>
              <span>{user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'User'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={open ? onClose : undefined}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive(item.path)
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            )}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Settings Link */}
      <div className="p-4 border-t border-neutral-100">
        <Link
          href="/settings"
          onClick={open ? onClose : undefined}
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </Link>
        <button
          onClick={() => {
            logout();
            if (open) onClose();
          }}
          className="w-full flex items-center px-3 py-2 mt-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
