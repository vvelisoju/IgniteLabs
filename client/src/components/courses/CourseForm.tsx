import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { insertCourseSchema } from '@shared/schema';
import { z } from 'zod';

// Extend the insert schema with validation rules
const formSchema = insertCourseSchema.extend({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  durationWeeks: z.number().min(1, 'Duration must be at least 1 week').max(52, 'Duration cannot exceed 52 weeks'),
  isComposite: z.boolean().default(false),
  isPublic: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CourseFormProps {
  courseId?: number | null;
  existingCourse?: any;
  onSuccess: () => void;
}

export default function CourseForm({ courseId, existingCourse, onSuccess }: CourseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing course data if available
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: existingCourse?.title || '',
      description: existingCourse?.description || '',
      durationWeeks: existingCourse?.durationWeeks ? Number(existingCourse.durationWeeks) : 8,
      isComposite: existingCourse?.isComposite || false,
      isPublic: existingCourse?.isPublic !== false, // default to true if not explicitly set to false
    },
  });

  // Mutation for creating/updating a course
  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (courseId) {
        return apiRequest(`/api/courses/${courseId}`, 'PUT', data);
      } else {
        return apiRequest('/api/courses', 'POST', data);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: courseId ? 'Course updated successfully' : 'Course created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
      }
      onSuccess();
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Error creating/updating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  });

  // Form submission handler
  function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., JavaScript Fundamentals" {...field} />
              </FormControl>
              <FormDescription>
                The name of your course as it will appear to students.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide a detailed description of the course..." 
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Describe what students will learn and the skills they'll gain.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="durationWeeks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (Weeks)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1}
                  max={52}
                  value={field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                    field.onChange(isNaN(value) ? 1 : value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Number of weeks the course will run (1-52).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isComposite"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Composite Course</FormLabel>
                <FormDescription>
                  Enable this if this is a composite course made up of other courses.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Course</FormLabel>
                <FormDescription>
                  Show this course in the course listings. Disable for component courses used only within composite courses.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />


        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            courseId ? 'Update Course' : 'Create Course'
          )}
        </Button>
      </form>
    </Form>
  );
}