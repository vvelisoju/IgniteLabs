import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertAssignmentSchema, InsertAssignment } from '@shared/schema';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AssignmentFormProps {
  assignmentId?: number;
  courseId?: number;
  batchId?: number;
  week?: number;
  onSuccess?: () => void;
}

export default function AssignmentForm({ 
  assignmentId, 
  courseId: initialCourseId,
  batchId: initialBatchId,
  week: initialWeek,
  onSuccess 
}: AssignmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch courses for dropdown
  const { data: courses } = useQuery({
    queryKey: ['/api/courses'],
  });

  // Fetch batches for dropdown
  const { data: batches } = useQuery({
    queryKey: ['/api/batches'],
  });

  // Fetch assignment data if editing
  const { data: assignmentData, isLoading: isAssignmentLoading } = useQuery({
    queryKey: ['/api/assignments', assignmentId],
    enabled: !!assignmentId,
  });

  // Form setup
  const form = useForm<InsertAssignment>({
    resolver: zodResolver(insertAssignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      courseId: initialCourseId || undefined,
      batchId: initialBatchId || undefined,
      week: initialWeek || 1,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  });

  // Update form values when assignment data is loaded
  useState(() => {
    if (assignmentData) {
      form.reset({
        ...assignmentData,
        dueDate: new Date(assignmentData.dueDate),
      });
    }
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: InsertAssignment) => {
      const res = await apiRequest('/api/assignments', 'POST', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      if (initialCourseId) {
        queryClient.invalidateQueries({ queryKey: ['/api/assignments/course', initialCourseId] });
      }
      if (initialBatchId) {
        queryClient.invalidateQueries({ queryKey: ['/api/assignments/batch', initialBatchId] });
      }
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create assignment',
        variant: 'destructive',
      });
    },
  });

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async (data: InsertAssignment) => {
      const res = await apiRequest(`/api/assignments/${assignmentId}`, 'PUT', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId] });
      if (assignmentData?.courseId) {
        queryClient.invalidateQueries({ queryKey: ['/api/assignments/course', assignmentData.courseId] });
      }
      if (assignmentData?.batchId) {
        queryClient.invalidateQueries({ queryKey: ['/api/assignments/batch', assignmentData.batchId] });
      }
      toast({
        title: 'Success',
        description: 'Assignment updated successfully',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update assignment',
        variant: 'destructive',
      });
    },
  });

  async function onSubmit(data: InsertAssignment) {
    setIsLoading(true);
    try {
      if (assignmentId) {
        await updateAssignmentMutation.mutateAsync(data);
      } else {
        await createAssignmentMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (assignmentId && isAssignmentLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., JavaScript Array Methods" {...field} />
              </FormControl>
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
                  placeholder="Provide detailed instructions for this assignment" 
                  {...field} 
                  rows={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                  disabled={!!initialCourseId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses?.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="batchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                  disabled={!!initialBatchId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch" />
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="week"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Week</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="Week number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    disabled={!!initialWeek}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setDate(new Date().getDate() - 1))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {assignmentId ? 'Updating Assignment...' : 'Creating Assignment...'}
            </>
          ) : (
            assignmentId ? 'Update Assignment' : 'Create Assignment'
          )}
        </Button>
      </form>
    </Form>
  );
}
