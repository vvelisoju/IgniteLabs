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
const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], 
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    }
  });

  async function onSubmit(data: ResetPasswordData) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reset password');
      }

      // Show success message
      setIsSuccessful(true);
      toast({
        title: 'Password updated successfully',
        description: 'Your password has been reset. You can now log in with your new password.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Password reset failed',
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
              src="/assets/ignite-labs-icon.png" 
              alt="Ignite Labs Icon" 
              className="h-8 w-8"
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          {isSuccessful ? 'Password Updated' : 'Reset Your Password'}
        </h1>
        <p className="text-center text-gray-500 mb-8">
          {isSuccessful 
            ? 'Your password has been successfully reset'
            : 'Enter your new password to complete the reset process'}
        </p>
        
        {isSuccessful ? (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Your password has been successfully updated. You can now use your new password to log in to your account.
            </p>
            <Button
              className="w-full shadow-md hover:shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/80 transition-all duration-300"
              onClick={() => navigate('/auth/login')}
            >
              Go to Login
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your new password" 
                        className="border-gray-200 focus:border-primary/50 transition-colors duration-200"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your new password" 
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
                    Updating password...
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