import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/simplified-auth';

// Form schema for follow-up
const followUpSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  status: z.enum(['pending', 'scheduled', 'completed', 'missed']),
  notes: z.string().min(1, 'Notes are required'),
  outcome: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
});

type FollowUpFormProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  followUpId?: number;
  preselectedStudentId?: number;
};

export default function FollowUpForm({ 
  isOpen, 
  onClose, 
  initialData, 
  followUpId,
  preselectedStudentId
}: FollowUpFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!followUpId;

  // Fetch all students
  const { data: students, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: isOpen,
  });
  
  // Filter only student users
  const studentUsers = students?.filter((user: any) => user.role === 'student') || [];

  // Set up form with default values
  const form = useForm({
    resolver: zodResolver(followUpSchema),
    defaultValues: initialData || {
      studentId: preselectedStudentId?.toString() || '',
      followUpDate: new Date().toISOString().split('T')[0],
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      notes: '',
      outcome: '',
      nextFollowUpDate: '',
    },
  });

  // Form values watcher
  const followUpStatus = form.watch('status');

  // Create follow-up mutation
  const createFollowUpMutation = useMutation({
    mutationFn: async (data: any) => {
      // If status is not 'completed', clear outcome and nextFollowUpDate
      if (data.status !== 'completed') {
        data.outcome = null;
        data.nextFollowUpDate = null;
      }

      return apiRequest('/api/follow-ups', 'POST', {
        ...data,
        studentId: parseInt(data.studentId),
        managerId: user?.id,
      });
    },
    onSuccess: () => {
      // Invalidate follow-ups query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/follow-ups/schedule/today'] });
      toast({
        title: 'Success',
        description: 'Follow-up created successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create follow-up: ${error.message}`,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  // Update follow-up mutation
  const updateFollowUpMutation = useMutation({
    mutationFn: async (data: any) => {
      // If status is not 'completed', clear outcome and nextFollowUpDate
      if (data.status !== 'completed') {
        data.outcome = null;
        data.nextFollowUpDate = null;
      }

      return apiRequest(`/api/follow-ups/${followUpId}`, 'PUT', {
        ...data,
        studentId: parseInt(data.studentId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/follow-ups/schedule/today'] });
      toast({
        title: 'Success',
        description: 'Follow-up updated successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update follow-up: ${error.message}`,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    if (isEditMode) {
      updateFollowUpMutation.mutate(data);
    } else {
      createFollowUpMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Follow-up' : 'New Follow-up'}</DialogTitle>
        </DialogHeader>

        {isStudentsLoading ? (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isEditMode || !!preselectedStudentId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {studentUsers.map((student: any) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name}
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
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="missed">Missed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add details about the follow-up" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {followUpStatus === 'completed' && (
                <>
                  <FormField
                    control={form.control}
                    name="outcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outcome</FormLabel>
                        <FormControl>
                          <Textarea placeholder="What was the result of this follow-up?" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nextFollowUpDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Follow-up Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Update Follow-up' : 'Create Follow-up'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}