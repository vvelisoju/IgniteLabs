import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Validation schema for the form
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  });

  async function onSubmit(data: ForgotPasswordData) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to process password reset request');
      }

      // Show success message
      setIsSubmitted(true);
      toast({
        title: 'Password reset email sent',
        description: 'If an account exists with this email, you will receive instructions to reset your password.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: 'Request failed',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Only show logo on mobile since we already have it in the sidebar on desktop */}
      <div className="flex md:hidden justify-center mb-6">
        <img 
          src="/assets/Ignite Labs Logo Horizental.png" 
          alt="Ignite Labs" 
          className="h-10 mb-4"
        />
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 md:shadow-md relative overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-14 -right-14 w-28 h-28 bg-primary/5 rounded-full opacity-50"></div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-3 rounded-full shadow-sm">
            <img 
              src="/assets/ignite-labs-icon.png?v=1" 
              alt="Ignite Labs Icon" 
              className="h-8 w-8"
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          {isSubmitted ? 'Check Your Email' : 'Forgot Password'}
        </h1>
        <p className="text-center text-gray-500 mb-8">
          {isSubmitted 
            ? 'We have sent password reset instructions to your email'
            : 'Enter your email address to receive password reset instructions'}
        </p>
        
        {isSubmitted ? (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Please check your email inbox and follow the instructions in the email to reset your password.
              If you don't see the email, check your spam folder.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/auth/login')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Login
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email address" 
                        className="border-gray-200 focus:border-primary/50 transition-colors duration-200"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full shadow-md hover:shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/80 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending email...
                  </>
                ) : 'Reset Password'}
              </Button>
            </form>
          </Form>
        )}
        
        <p className="mt-6 text-center text-sm text-gray-500">
          <Button
            variant="link"
            className="p-0 h-auto text-xs font-medium text-primary hover:text-primary/80"
            onClick={() => navigate('/auth/login')}
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Login
          </Button>
        </p>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Need assistance? Contact <a href="mailto:support@ignitelabs.co.in" className="text-primary hover:underline">support@ignitelabs.co.in</a>
          </p>
        </div>
      </div>
    </div>
  );
}