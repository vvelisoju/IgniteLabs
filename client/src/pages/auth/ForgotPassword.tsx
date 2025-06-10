import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { Code } from 'lucide-react';

export default function ForgotPassword() {
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
          <h1 className="text-4xl font-bold mb-4">Password<br />Recovery</h1>
          <p className="text-lg text-gray-600 mb-6">We'll help you get back access to your account so you can continue your learning journey.</p>
          
          <div className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-primary/10">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Account Security</h3>
              <p className="text-sm text-gray-600">Your information is protected with us</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-sm text-gray-500 relative z-10">
          &copy; {new Date().getFullYear()} Ignite Labs. All rights reserved.
        </div>
      </div>
      
      {/* Right panel with login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}