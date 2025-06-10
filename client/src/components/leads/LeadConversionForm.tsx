import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Schema for the form
const conversionFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  batchId: z.number().min(1, 'Batch is required'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  totalFee: z.string().min(1, 'Total fee is required'),
  initialPayment: z.string().min(1, 'Initial payment is required'),
  paymentMethod: z.enum(['cash', 'check', 'bank_transfer', 'online', 'other']),
  reference: z.string().optional(),
  paymentNotes: z.string().optional(),
});

type LeadConversionFormProps = {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  batches: any[];
};

export default function LeadConversionForm({ isOpen, onClose, lead, batches }: LeadConversionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with lead data
  const form = useForm({
    resolver: zodResolver(conversionFormSchema),
    defaultValues: {
      name: lead?.name || '',
      phone: lead?.phone || '',
      email: lead?.email || '',
      batchId: undefined,
      enrollmentDate: new Date().toISOString().split('T')[0],
      totalFee: '',
      initialPayment: '',
      paymentMethod: 'cash',
      reference: '',
      paymentNotes: '',
    },
  });

  // Convert lead mutation
  const convertLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/leads/${lead.id}/convert`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert lead');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: 'Success',
        description: 'Lead converted to student successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to convert lead: ${error.message}`,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  // Form submission handler
  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    
    // Convert string values to numbers where needed and rename fields to match server expectations
    const formattedData = {
      ...data,
      batch: Number(data.batchId), // Rename batchId to batch to match server expectation
      enrollmentDate: data.enrollmentDate, // Ensure enrollmentDate is included
      totalFee: parseFloat(data.totalFee),
      initialPayment: parseFloat(data.initialPayment),
      reference: data.reference || '', // Ensure reference field is always sent
    };
    
    // Remove batchId as we're sending it as batch
    delete formattedData.batchId;
    
    console.log('Submitting data:', formattedData);
    convertLeadMutation.mutate(formattedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead to Student</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
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
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Batch</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {batches?.map((batch) => (
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

              <FormField
                control={form.control}
                name="enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Fee</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="initialPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Payment</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="online">Online Payment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Payment reference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add details about the payment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Convert to Student
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}