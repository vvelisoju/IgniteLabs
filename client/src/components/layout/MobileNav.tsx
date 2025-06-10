import { Link, useLocation } from 'wouter';
import { Home, Users, BookOpen, Code, BarChart2, UserPlus, IndianRupee, PhoneCall, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/simplified-auth';

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };
  
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  return (
    <div className="md:hidden fixed bottom-0 w-full border-t border-neutral-200 bg-white">
      <div className={cn(
        isManager ? "grid-cols-8" : "grid-cols-5",
        "grid"
      )}>
        <Link href="/" className={cn(
            "flex flex-col items-center pt-2 pb-1",
            isActive('/') ? "text-primary-600" : "text-neutral-600 hover:text-primary-600"
          )}>
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
        </Link>
        
        <Link href="/batches" className={cn(
            "flex flex-col items-center pt-2 pb-1",
            isActive('/batches') ? "text-primary-600" : "text-neutral-600 hover:text-primary-600"
          )}>
            <Users className="h-6 w-6" />
            <span className="text-xs">Batches</span>
        </Link>
        
        <Link href="/courses" className={cn(
            "flex flex-col items-center pt-2 pb-1",
            isActive('/courses') ? "text-primary-600" : "text-neutral-600 hover:text-primary-600"
          )}>
            <BookOpen className="h-6 w-6" />
            <span className="text-xs">Courses</span>
        </Link>
        
        {isManager && (
          <>
            <Link href="/leads" className={cn(
                "flex flex-col items-center pt-2 pb-1",
                isActive('/leads') ? "text-primary-600" : "text-neutral-600 hover:text-primary-600"
              )}>
                <PhoneCall className="h-6 w-6" />
                <span className="text-xs">Leads</span>
            </Link>
            <Link href="/students" className={cn(
                "flex flex-col items-center pt-2 pb-1",
                isActive('/students') ? "text-primary-600" : "text-neutral-600 hover:text-primary-600"
              )}>
                <UserPlus className="h-6 w-6" />
                <span className="text-xs">Students</span>
            </Link>
            <Link href="/fees" className={cn(
                "flex flex-col items-center pt-2 pb-1",
                isActive('/fees') ? "text-primary-600" : "text-neutral-600 hover:text-primary-600"
              )}>
                <IndianRupee className="h-6 w-6" />
                <span className="text-xs">Fees</span>
            </Link>
            <Link href="/trainers" className={cn(
                "flex flex-col items-center pt-2 pb-1",
                isActive('/trainers') ? "text-primary-600" : "text-neutral-600 hover:text-primary-600"
              )}>
                <GraduationCap className="h-6 w-6" />
                <span className="text-xs">Trainers</span>
            </Link>
          </>
        )}
        
        <Link href="/code-editor" className={cn(
            "flex flex-col items-center pt-2 pb-1",
            isActive('/code-editor') ? "text-primary-600" : "text-neutral-600 hover:text-primary-600"
          )}>
            <Code className="h-6 w-6" />
            <span className="text-xs">Code</span>
        </Link>
        
        <Link href="/analytics" className={cn(
            "flex flex-col items-center pt-2 pb-1",
            isActive('/analytics') ? "text-primary-600" : "text-neutral-600 hover:text-primary-600"
          )}>
            <BarChart2 className="h-6 w-6" />
            <span className="text-xs">Analytics</span>
        </Link>
      </div>
    </div>
  );
}
