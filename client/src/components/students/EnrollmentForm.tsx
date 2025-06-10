import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/simplified-auth';

// Form schema for enrollment
const enrollmentSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  parentMobile: z.string().optional(),
  email: z.string().email('Invalid email format'),
  batchId: z.string().min(1, 'Batch is required'),
  enrollmentStatus: z.enum(['payment_pending', 'enrolled', 'deferred', 'dropped_out', 'completed']),
  totalFees: z.string()
    .min(1, 'Total fees are required')
    .refine((val) => {
      // First check if it's a valid number
      if (val === '' || val === null || val === undefined) return false;
      const parsedVal = parseFloat(val);
      // Then check if it's non-negative
      return !isNaN(parsedVal) && parsedVal >= 0;
    }, { message: 'Fees must be a valid non-negative number' })
    .transform(val => {
      // Handle zero values appropriately
      if (val === '0' || val === '' || parseFloat(val) === 0) return '0';
      // Otherwise ensure it's a proper string number
      return parseFloat(val).toString();
    }),
  amountPaid: z.string()
    .refine((val) => {
      // If empty, treat as zero (which is valid)
      if (val === '' || val === null || val === undefined) return true;
      const parsedVal = parseFloat(val);
      // Then check if it's a non-negative number
      return !isNaN(parsedVal) && parsedVal >= 0;
    }, { message: 'Amount paid must be a valid non-negative number' })
    .transform(val => {
      // Handle empty and zero values appropriately
      if (val === '' || val === null || val === undefined || val === '0' || parseFloat(val) === 0) return '0';
      // Otherwise ensure it's a proper string number
      return parseFloat(val).toString();
    }),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  notes: z.string().optional(),
});

type EnrollmentFormProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  enrollmentId?: number;
};

export default function EnrollmentForm({ isOpen, onClose, initialData, enrollmentId }: EnrollmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!enrollmentId;

  // Fetch students (only those with student role)
  const { data: students, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: isOpen,
  });
  
  // Filter only student users
  const studentUsers = students?.filter((user: any) => user.role === 'student') || [];

  // Fetch batches
  const { data: batches, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['/api/batches'],
    enabled: isOpen,
  });

  // Set up form with default values
  const form = useForm({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: initialData || {
      studentName: '',
      phone: '',
      parentMobile: '',
      email: '',
      batchId: '',
      enrollmentStatus: 'enrolled',
      totalFees: '0',
      amountPaid: '0',
      enrollmentDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Create enrollment mutation
  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('EnrollmentForm - Creating student with data:', data);
      
      // Ensure batchId is correctly parsed as a number
      console.log('Raw batchId value:', data.batchId, 'type:', typeof data.batchId);
      
      // Add radix parameter and better error messaging
      const batchId = parseInt(data.batchId, 10);
      if (isNaN(batchId)) {
        throw new Error('Invalid batch ID. Please select a valid batch.');
      }
      
      console.log('Parsed batchId:', batchId, 'type:', typeof batchId);

      // Format the data to match the student schema
      // Ensure proper number conversion for all fee calculations
      const totalFee = parseFloat(data.totalFees || '0');
      const amountPaid = parseFloat(data.amountPaid || '0');
      const feeDue = Math.max(0, totalFee - amountPaid);
      
      console.log('Creating student with properly calculated fees:', {
        totalFee,
        amountPaid,
        feeDue
      });
      
      return apiRequest('POST', '/api/students', {
        name: data.studentName || 'New Student',
        batch_id: batchId, // Using snake_case and ensuring it's a number
        enrollment_date: data.enrollmentDate,
        total_fee: totalFee.toString(),
        // These fields are calculated here
        initialPayment: amountPaid.toString(),
        paymentMethod: 'cash',  // Default payment method
        // Treat Completed and Dropped as inactive, others as active
        is_active: !['completed', 'dropped_out'].includes(data.enrollmentStatus),
        phone: data.phone || '',
        email: data.email || '',
        parent_mobile: data.parentMobile || '', // Using snake_case to match backend
        notes: data.notes || '',
        fee_due: feeDue.toString(), // Explicitly set fee_due
        fee_paid: amountPaid.toString(), // Explicitly set fee_paid to match the initialPayment
        status: data.enrollmentStatus || 'enrolled' // Add status from the form
      });
    },
    onSuccess: (data) => {
      // Invalidate students query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Show success message with login credentials info
      toast({
        title: 'Student Enrolled Successfully',
        description: form.getValues('email') 
          ? 'Login credentials have been sent to the student\'s email address.'
          : 'Student has been enrolled successfully.',
        duration: 5000,
      });
      
      onClose();
    },
    onError: (error: any) => {
      // Check if this appears to be a duplicate student error
      const isDuplicateError = error.message && (
        error.message.includes('duplicate') || 
        error.message.includes('unique constraint') ||
        error.message.includes('already exists')
      );
      
      toast({
        title: isDuplicateError ? 'Student Already Exists' : 'Enrollment Failed',
        description: isDuplicateError 
          ? 'A student with this email or phone number already exists in the system.'
          : `Unable to create student record: ${error.message}`,
        variant: 'destructive',
        duration: 7000,
      });
      setIsSubmitting(false);
    },
  });

  // Update enrollment mutation
  const updateEnrollmentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('EnrollmentForm - Updating student with data:', data);
      
      // Ensure batchId is correctly parsed as a number
      console.log('Update - Raw batchId value:', data.batchId, 'type:', typeof data.batchId);
      
      // Add radix parameter and better error messaging
      const batchId = parseInt(data.batchId, 10);
      if (isNaN(batchId)) {
        throw new Error('Invalid batch ID. Please select a valid batch.');
      }
      
      console.log('Update - Parsed batchId:', batchId, 'type:', typeof batchId);
      
      // Format data according to what the server expects for a student update
      // Ensure proper number conversion for all fee calculations
      const totalFee = parseFloat(data.totalFees || '0');
      const amountPaid = parseFloat(data.amountPaid || '0');
      const feeDue = Math.max(0, totalFee - amountPaid);
      
      console.log('Updating student with properly calculated fees:', {
        totalFee,
        amountPaid,
        feeDue
      });
      
      return apiRequest('PUT', `/api/enrollments/${enrollmentId}`, {
        name: data.studentName,
        batch_id: batchId, // Using snake_case and ensuring it's a number
        enrollment_date: data.enrollmentDate,
        total_fee: totalFee.toString(),
        fee_paid: amountPaid.toString(), // Add fee_paid to match the initialPayment
        // Treat Completed and Dropped as inactive, others as active
        is_active: !['completed', 'dropped_out'].includes(data.enrollmentStatus),
        status: data.enrollmentStatus || 'enrolled', // Add status from the form
        phone: data.phone || '',
        email: data.email || '',
        parent_mobile: data.parentMobile || '',
        notes: data.notes || '',
        // Calculate fee due
        fee_due: feeDue.toString() 
      });
    },
    onSuccess: async () => {
      // Invalidate both enrollments and students queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/students'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/students', enrollmentId] })
      ]);
      
      // Force refetch the specific student to ensure the UI updates
      await queryClient.refetchQueries({ queryKey: ['/api/students', enrollmentId] });
      
      toast({
        title: 'Student Record Updated',
        description: 'The student enrollment has been updated successfully.',
        duration: 5000,
      });
      onClose();
    },
    onError: (error: any) => {
      const isDuplicateError = error.message && (
        error.message.includes('duplicate') || 
        error.message.includes('unique constraint') ||
        error.message.includes('already exists')
      );
      
      toast({
        title: isDuplicateError ? 'Update Conflict' : 'Update Failed',
        description: isDuplicateError 
          ? 'This email or phone number is already used by another student.' 
          : `Unable to update student record: ${error.message}`,
        variant: 'destructive',
        duration: 7000,
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    
    // If amountPaid is more than totalFees, show an error
    if (parseFloat(data.amountPaid) > parseFloat(data.totalFees)) {
      toast({
        title: 'Error',
        description: 'Amount paid cannot be greater than total fees',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (isEditMode) {
      updateEnrollmentMutation.mutate(data);
    } else {
      // If amountPaid > 0, also create a payment record
      const paymentData = {
        enrollmentId: 0, // Will be set after enrollment is created
        amount: parseFloat(data.amountPaid),
        paymentDate: data.enrollmentDate,
        paymentMethod: 'Cash', // Default
        status: 'completed',
        receiptNumber: `RCPT${Date.now().toString().slice(-6)}`,
        notes: 'Initial payment at enrollment',
        collectedBy: user?.id,
      };

      createEnrollmentMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Enrollment' : 'New Student Enrollment'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update student enrollment details.'
              : 'Fill out the student details to create a new enrollment. If an email is provided, login credentials will be sent to the student automatically.'}
          </DialogDescription>
        </DialogHeader>

        {(isStudentsLoading || isBatchesLoading) ? (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="10-digit phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="parentMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent's Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Parent's mobile number" {...field} />
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
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs italic">
                      Login credentials will be sent to this email address
                    </FormDescription>
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
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
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

              <FormField
                control={form.control}
                name="enrollmentStatus"
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
                        <SelectItem value="payment_pending">Payment Pending</SelectItem>
                        <SelectItem value="enrolled">Enrolled</SelectItem>
                        <SelectItem value="deferred">Deferred</SelectItem>
                        <SelectItem value="dropped_out">Dropped Out</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Fees (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="25000" 
                        value={field.value || "0"} 
                        onChange={(e) => field.onChange(e.target.value === "" ? "0" : e.target.value)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10000" 
                        value={field.value || "0"} 
                        onChange={(e) => field.onChange(e.target.value === "" ? "0" : e.target.value)} 
                      />
                    </FormControl>
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
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Any additional information" {...field} />
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
                  {isEditMode ? 'Update Enrollment' : 'Create Enrollment'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}