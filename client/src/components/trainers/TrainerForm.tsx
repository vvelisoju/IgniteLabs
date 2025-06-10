import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface Trainer {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  specialization: string;
  bio: string;
  status: 'active' | 'inactive';
}

type TrainerFormProps = {
  trainer?: Trainer;
  isOpen: boolean;
  onClose: () => void;
};

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(50, { message: 'Username must not exceed 50 characters' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(100, { message: 'Password must not exceed 100 characters' })
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .max(100, { message: 'Email must not exceed 100 characters' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 characters long' })
    .max(15, { message: 'Phone number must not exceed 15 characters' }),
  specialization: z
    .string()
    .min(2, { message: 'Specialization must be at least 2 characters long' })
    .max(100, { message: 'Specialization must not exceed 100 characters' }),
  bio: z
    .string()
    .min(10, { message: 'Bio must be at least 10 characters long' })
    .max(500, { message: 'Bio must not exceed 500 characters' }),
  status: z.enum(['active', 'inactive']),
});

type FormValues = z.infer<typeof formSchema>;

export function TrainerForm({ trainer, isOpen, onClose }: TrainerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const defaultValues: FormValues = {
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    specialization: '',
    bio: '',
    status: 'active',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Reset form when trainer prop changes or dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (trainer) {
        // Set values from trainer data
        form.reset({
          ...trainer,
          password: '', // Always reset password field
        });
      } else {
        // Reset to empty values for a new trainer
        form.reset(defaultValues);
      }
    }
  }, [trainer, isOpen, form]);

  const createTrainerMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      try {
        const response = await fetch('/api/trainers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          credentials: 'include',
        });
        
        if (!response.ok) {
          let errorMessage = 'Failed to create trainer';
          const errorData = await response.json();
          
          // Check specifically for the username uniqueness constraint error
          if (errorData && typeof errorData === 'object') {
            const errorText = errorData.error || errorData.message || '';
            if (errorText.includes('duplicate key value') && errorText.includes('users_username_unique')) {
              errorMessage = 'Username already exists. Please choose a different username.';
            }
          }
          
          // Return an object with error information instead of throwing
          return { error: errorMessage, isError: true };
        }
        
        return await response.json();
      } catch (error) {
        // Return error info object instead of throwing
        return { 
          error: error instanceof Error ? error.message : 'Failed to create trainer', 
          isError: true 
        };
      }
    },
    // Removing onSuccess and onError callbacks to handle everything in onSubmit function
  });

  const updateTrainerMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      try {
        // Remove empty password from update data if no new password was provided
        const updateData = { ...data };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        const response = await fetch(`/api/trainers/${trainer?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
          credentials: 'include',
        });
        
        if (!response.ok) {
          let errorMessage = 'Failed to update trainer';
          const errorData = await response.json();
          
          // Check specifically for the username uniqueness constraint error
          if (errorData && typeof errorData === 'object') {
            const errorText = errorData.error || errorData.message || '';
            if (errorText.includes('duplicate key value') && errorText.includes('users_username_unique')) {
              errorMessage = 'Username already exists. Please choose a different username.';
            }
          }
          
          // Return an object with error information instead of throwing
          return { error: errorMessage, isError: true };
        }
        
        return await response.json();
      } catch (error) {
        // Return error info object instead of throwing
        return { 
          error: error instanceof Error ? error.message : 'Failed to update trainer', 
          isError: true 
        };
      }
    },
    // Removing callbacks to handle everything in onSubmit function
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (trainer) {
        const result = await updateTrainerMutation.mutateAsync(data);
        
        // Check if result contains an error
        if (result && typeof result === 'object' && 'isError' in result && result.isError) {
          // Handle error from the result
          toast({
            title: 'Error',
            description: result.error as string,
            variant: 'destructive',
          });
          
          // Set form error if it's a username issue
          if (typeof result.error === 'string' && result.error.includes('Username already exists')) {
            form.setError('username', { 
              type: 'manual', 
              message: 'Username already exists. Please choose a different username.'
            });
          } else {
            // Only close the form for other types of errors
            onClose();
          }
          return; // Prevent further processing
        }
        
        // Success case for update
        toast({
          title: 'Success',
          description: 'Trainer has been updated successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/users/trainers'] });
        onClose();
      } else {
        const result = await createTrainerMutation.mutateAsync(data);
        
        // Check if result contains an error
        if (result && typeof result === 'object' && 'isError' in result && result.isError) {
          // Handle error from the result
          toast({
            title: 'Error',
            description: result.error as string,
            variant: 'destructive',
          });
          
          // Set form error if it's a username issue
          if (typeof result.error === 'string' && result.error.includes('Username already exists')) {
            form.setError('username', { 
              type: 'manual', 
              message: 'Username already exists. Please choose a different username.'
            });
          } else {
            // Only close the form for other types of errors
            onClose();
          }
          return; // Prevent further processing
        }
        
        // Success case for create
        toast({
          title: 'Success',
          description: 'Trainer has been created successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/users/trainers'] });
        onClose();
        form.reset();
      }
    } catch (error) {
      // Handle any other errors
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle dialog close attempts - we'll check if it's a valid time to close
  const handleDialogClose = (open: boolean) => {
    // Only close the dialog if it's transitioning from open to closed
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {trainer ? 'Edit Trainer' : 'Add New Trainer'}
          </DialogTitle>
          <DialogDescription>
            {trainer
              ? 'Update the trainer information below'
              : 'Enter the trainer details below to add a new trainer'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johnsmith" {...field} />
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
                    <FormLabel>{trainer ? 'New Password (leave empty to keep current)' : 'Password'}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 555 5555" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialization</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Web Development, Data Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trainer Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of trainer's experience and expertise..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {trainer ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{trainer ? 'Update Trainer' : 'Create Trainer'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}