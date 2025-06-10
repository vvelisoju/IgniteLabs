import { useLocation } from 'wouter';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Shield } from 'lucide-react';

export default function ResetPassword() {
  const [location] = useLocation();
  
  // Extract token from URL query parameters - use the full window location to ensure we get all query params
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token') || '';
  
  console.log("Reset password token from URL:", token ? `${token.substring(0, 10)}...` : 'No token');
  
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center p-8 max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-red-50 p-3 rounded-full">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Reset Link</h1>
          <p className="text-gray-600 mb-6">
            The password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          <a 
            href="/auth/forgot-password" 
            className="inline-block shadow-md hover:shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/80 transition-all duration-300 text-white py-2 px-6 rounded-md"
          >
            Request New Link
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel with branding and information */}
      <div className="hidden md:flex md:w-1/2 bg-primary/5 p-8 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50 z-0"></div>
        
        {/* Floating tech badges for decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[10%] px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium text-primary border border-primary/10 animate-float-slow">HTML & CSS</div>
          <div className="absolute top-[35%] right-[15%] px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium text-primary border border-primary/10 animate-float">JavaScript</div>
          <div className="absolute bottom-[25%] left-[20%] px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium text-primary border border-primary/10 animate-float-slow">React.js</div>
          <div className="absolute bottom-[40%] right-[10%] px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium text-primary border border-primary/10 animate-float">Node.js</div>
        </div>
        
        <div className="relative z-10">
          <img 
            src="/assets/Ignite Labs Logo Horizental.png" 
            alt="Ignite Labs" 
            className="h-12 mb-8"
          />
          <h1 className="text-4xl font-bold mb-4">Create New<br />Password</h1>
          <p className="text-lg text-gray-600 mb-6">Almost there! Set a new password to secure your account and get back to learning.</p>
          
          <div className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-primary/10">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Account Security</h3>
              <p className="text-sm text-gray-600">Choose a strong password for better protection</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-sm text-gray-500 relative z-10">
          &copy; {new Date().getFullYear()} Ignite Labs. All rights reserved.
        </div>
      </div>
      
      {/* Right panel with reset form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}