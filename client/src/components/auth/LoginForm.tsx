import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginData } from '@shared/schema';
import { useAuth } from '@/lib/simplified-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Flame, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginForm() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  async function onSubmit(data: LoginData) {
    setIsLoading(true);
    try {
      await login(data);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in',
        variant: 'default',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid username or password',
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
          Welcome Back
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Enter your credentials to access your account
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Username or Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your username or email" 
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-gray-700">Password</FormLabel>
                    <Button
                      variant="link"
                      type="button" 
                      className="p-0 h-auto text-xs font-medium text-primary hover:text-primary/80"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/auth/forgot-password');
                      }}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter your password" 
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
                  Logging in...
                </>
              ) : 'Log in'}
            </Button>
          </form>
        </Form>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Need assistance? Contact <a href="mailto:support@ignitelabs.co.in" className="text-primary hover:underline">support@ignitelabs.co.in</a>
        </p>
      </div>
    </div>
  );
}
