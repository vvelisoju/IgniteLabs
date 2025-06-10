import { useState } from 'react';
import { Bell, HelpCircle, Menu, Search } from 'lucide-react';
import { useAuth } from '@/lib/simplified-auth';
import { Link } from 'wouter';
import { Flame } from 'lucide-react';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const onOpenSidebar = () => setSidebarOpen(true);
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="bg-white shadow-sm border-b border-neutral-100">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Mobile Menu Button */}
        <button 
          type="button" 
          className="md:hidden text-neutral-500 hover:text-neutral-600"
          onClick={onOpenSidebar}
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="bg-primary-600 text-white p-1 rounded">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-primary-600">Ignite Labs</span>
        </div>

        {/* Search Bar on Desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-xl ml-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input 
              type="text" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-md leading-5 bg-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
              placeholder="Search for courses, assignments, etc."
            />
          </div>
        </div>

        {/* Right Nav Items */}
        <div className="flex items-center">
          {/* Notifications */}
          <button type="button" className="p-2 text-neutral-500 hover:text-neutral-600 relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-primary-600 ring-2 ring-white"></span>
          </button>

          {/* Help */}
          <button type="button" className="p-2 text-neutral-500 hover:text-neutral-600">
            <HelpCircle className="h-6 w-6" />
          </button>

          {/* User Menu (Mobile) */}
          <div className="ml-2 md:hidden">
            <Link href="/profile">
              <button type="button" className="flex items-center text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
