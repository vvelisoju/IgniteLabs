import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterData } from '@shared/schema';
import { useAuth } from '@/lib/simplified-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Flame, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RegisterForm() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch batches for the dropdown
  const { data: batches } = useQuery({
    queryKey: ['/api/batches'],
  });

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
    }
  });

  async function onSubmit(data: RegisterData) {
    setIsLoading(true);
    try {
      await register(data);
      toast({
        title: 'Registration successful!',
        description: 'Your account has been created',
        variant: 'default',
      });
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <div className="bg-primary-600 text-white p-2 rounded-lg">
          <Flame className="h-8 w-8" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-center text-neutral-800 mb-2">
        Create your account
      </h1>
      <p className="text-center text-neutral-500 mb-8">
        Register to join Ignite Labs learning platform
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Choose a username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Create a password" {...field} />
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {form.watch('role') === 'student' && (
            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your batch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {batches?.map((batch: any) => (
                        <SelectItem key={batch.id} value={batch.id.toString()}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the batch you want to enroll in
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : 'Register'}
          </Button>
        </form>
      </Form>
      
      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Button
          variant="link"
          className="p-0 font-semibold text-primary-600 hover:text-primary-500"
          onClick={() => navigate('/login')}
        >
          Log in
        </Button>
      </p>
    </div>
  );
}
