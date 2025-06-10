import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { insertLessonPlanSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Extend the lesson plan schema with validation and additional field
const lessonPlanFormSchema = insertLessonPlanSchema.extend({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  contentType: z.enum(['rich_text', 'video', 'pdf']).default('rich_text')
});

type LessonPlanFormValues = z.infer<typeof lessonPlanFormSchema>;

interface LessonPlanEditorProps {
  courseId: number;
  week: number;
  day: number;
  isOpen: boolean;
  onClose: () => void;
  existingPlan?: any;
}

export function LessonPlanEditor({ 
  courseId, 
  week, 
  day, 
  isOpen, 
  onClose, 
  existingPlan 
}: LessonPlanEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with default values or existing plan data
  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(lessonPlanFormSchema),
    defaultValues: {
      courseId,
      title: existingPlan?.title || '',
      description: existingPlan?.description || '',
      week,
      day,
      order: existingPlan?.order || 1,
      content: existingPlan?.content || '',
      objectives: existingPlan?.objectives || '',
      assignments: existingPlan?.assignments || '',
      resources: existingPlan?.resources || '',
      trainerNotes: existingPlan?.trainerNotes || '',
      contentType: (existingPlan?.contentType as 'rich_text' | 'video' | 'pdf') || 'rich_text'
    }
  });

  // Reset form when existingPlan changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        courseId,
        title: existingPlan?.title || '',
        description: existingPlan?.description || '',
        week,
        day,
        order: existingPlan?.order || 1,
        content: existingPlan?.content || '',
        objectives: existingPlan?.objectives || '',
        assignments: existingPlan?.assignments || '',
        resources: existingPlan?.resources || '',
        trainerNotes: existingPlan?.trainerNotes || '',
        contentType: (existingPlan?.contentType as 'rich_text' | 'video' | 'pdf') || 'rich_text'
      });
    }
  }, [existingPlan, isOpen, courseId, week, day, form]);

  // Create lesson plan mutation
  const createMutation = useMutation({
    mutationFn: (data: LessonPlanFormValues) => {
      return apiRequest('POST', '/api/lesson-plans', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lesson plan created successfully',
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/lesson-plans/course/${courseId}/week/${week}/day/${day}`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/lesson-plans/course/${courseId}`] 
      });
      setIsSubmitting(false);
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create lesson plan',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  });

  // Update lesson plan mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: LessonPlanFormValues }) => {
      return apiRequest('PUT', `/api/lesson-plans/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lesson plan updated successfully',
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/lesson-plans/course/${courseId}/week/${week}/day/${day}`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/lesson-plans/course/${courseId}`] 
      });
      setIsSubmitting(false);
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update lesson plan',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const onSubmit = (values: LessonPlanFormValues) => {
    setIsSubmitting(true);
    if (existingPlan) {
      updateMutation.mutate({ id: existingPlan.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingPlan ? 'Edit Lesson Plan' : 'Create New Lesson Plan'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Lesson title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rich_text">Rich Text</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this lesson"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Main lesson content (Markdown supported)"
                      {...field}
                      rows={8}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Objectives</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Learning objectives for this lesson"
                      {...field}
                      rows={3}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Homework or in-class assignments"
                      {...field}
                      rows={3}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resources"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resources</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional resources and links"
                      {...field}
                      rows={3}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trainerNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trainer Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes for the trainer (not visible to students)"
                      {...field}
                      rows={3}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {existingPlan ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  existingPlan ? 'Update Lesson Plan' : 'Create Lesson Plan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}