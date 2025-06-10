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

// Form schema for lead follow-up
const leadFollowUpSchema = z.object({
  leadId: z.number({ required_error: 'Lead is required' }),
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  comments: z.string().optional().or(z.literal('')), // Allow empty comments
  status: z.string().min(1, 'Status is required'),
  type: z.string().min(1, 'Type is required').default('Call'),
  nextFollowUpDate: z.string().optional().or(z.literal('')),
});

type LeadFollowUpFormProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  followUpId?: number;
  preselectedLeadId?: number;
};

export default function LeadFollowUpForm({ 
  isOpen, 
  onClose, 
  initialData, 
  followUpId,
  preselectedLeadId
}: LeadFollowUpFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!followUpId;

  // Fetch all leads if we're not preselecting a lead
  const { data: leads, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['/api/leads'],
    enabled: isOpen && !preselectedLeadId,
  });

  // Set up form with default values
  const form = useForm({
    resolver: zodResolver(leadFollowUpSchema),
    defaultValues: initialData || {
      leadId: typeof preselectedLeadId === 'string' ? parseInt(preselectedLeadId, 10) : preselectedLeadId || '',
      followUpDate: new Date().toISOString().split('T')[0],
      comments: '',
      status: 'pending', // Default status
      type: 'Call', // Default type
      nextFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to tomorrow
    },
  });
  
  // Log the form values for debugging
  console.log('Form default values:', form.getValues());

  // Create follow-up mutation
  const createFollowUpMutation = useMutation({
    mutationFn: async (data: any) => {
      // Format the dates - server expects follow_up_date and next_follow_up_date
      // Ensure leadId is a number before sending to API
      const formattedData = {
        lead_id: typeof data.leadId === 'string' ? parseInt(data.leadId, 10) : data.leadId,
        follow_up_date: data.followUpDate,
        // Map comments to notes for compatibility with server schema
        notes: data.comments,
        status: data.status,
        type: data.type,
        // Only include next_follow_up_date if status is not completed
        ...(data.status !== 'completed' ? { next_follow_up_date: data.nextFollowUpDate } : {}),
        assigned_to: user?.id,
        created_by: user?.id,
        is_completed: data.status === 'completed'
      };
      
      console.log('Submitting follow-up data:', formattedData);
      
      return apiRequest('/api/follow-ups', 'POST', formattedData);
    },
    onSuccess: () => {
      // Invalidate follow-ups query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      if (preselectedLeadId) {
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${preselectedLeadId}/follow-ups`] });
      }
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
      // Format data for update similar to create
      const formattedData = {
        lead_id: typeof data.leadId === 'string' ? parseInt(data.leadId, 10) : data.leadId,
        follow_up_date: data.followUpDate,
        notes: data.comments,
        status: data.status,
        type: data.type,
        ...(data.status !== 'completed' ? { next_follow_up_date: data.nextFollowUpDate } : {}),
        assigned_to: user?.id,
        is_completed: data.status === 'completed'
      };
      
      console.log('Updating follow-up data:', formattedData);
      
      return apiRequest(`/api/follow-ups/${followUpId}`, 'PUT', formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/follow-ups'] });
      if (preselectedLeadId) {
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${preselectedLeadId}/follow-ups`] });
      }
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

        {isLeadsLoading && !preselectedLeadId ? (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!preselectedLeadId && (
                <FormField
                  control={form.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value ? field.value.toString() : undefined}
                        disabled={isEditMode || !!preselectedLeadId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads?.map((lead: any) => (
                            <SelectItem key={lead.id} value={lead.id.toString()}>
                              {lead.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add comments about this follow-up" {...field} />
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Call">Call</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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