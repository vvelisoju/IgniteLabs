import { useState, useEffect } from 'react';
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

// Form schema for payment
const paymentSchema = z.object({
  enrollmentId: z.string().min(1, 'Enrollment is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Amount must be a positive number' }
  ),
  paymentDate: z.string().min(1, 'Payment date is required'),
  nextPaymentDueDate: z.string().min(1, 'Next payment due date is required'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'check', 'other']),
  status: z.enum(['completed', 'pending', 'failed']),
  transactionDetails: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  paymentId?: number;
  preselectedEnrollmentId?: number;
};

export default function PaymentForm({ 
  isOpen, 
  onClose, 
  initialData, 
  paymentId,
  preselectedEnrollmentId
}: PaymentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!paymentId;
  
  // Generate a unique transaction ID (not used as default anymore)
  const generateTransactionId = () => {
    return `RCPT${Date.now().toString().slice(-6)}`;
  };

  // Fetch enrollments (which are actually students)
  const { data: enrollments, isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/students'],
    enabled: isOpen,
  });

  // Fetch students for display names (not needed since enrollments are students)
  const { data: students, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/students'],
    enabled: isOpen,
  });
  
  // Fetch payment data if in edit mode
  const { data: paymentData, isLoading: isPaymentLoading } = useQuery({
    queryKey: ['/api/payments', paymentId],
    queryFn: () => apiRequest('GET', `/api/payments/${paymentId}`).then(res => res.json()),
    enabled: isOpen && !!paymentId,
  });

  // Function to get student name by ID from enrollment (student)
  const getStudentName = (enrollmentId: number) => {
    if (!students) return 'Loading...';
    const student = students.find((s: any) => s.id === enrollmentId);
    return student ? student.name : 'Unknown';
  };

  // Set up form with default values
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData || {
      enrollmentId: preselectedEnrollmentId ? preselectedEnrollmentId.toString() : '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      nextPaymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 30 days from now
      paymentMethod: 'cash',
      status: 'completed',
      transactionDetails: '',
      notes: '',
    },
  });
  
  // Set preselectedEnrollmentId if we have one
  useEffect(() => {
    if (preselectedEnrollmentId) {
      form.setValue('enrollmentId', preselectedEnrollmentId.toString());
      console.log('Setting preselected enrollment ID:', preselectedEnrollmentId);
    }
  }, [preselectedEnrollmentId, form]);
  
  // Load payment data for editing
  useEffect(() => {
    if (paymentData && isEditMode) {
      console.log('Setting form values from payment data:', paymentData);
      
      // Handle mapping of field names from snake_case to camelCase
      // and format dates (payment_date -> paymentDate)
      const paymentDate = paymentData.payment_date 
        ? new Date(paymentData.payment_date).toISOString().split('T')[0]
        : '';
        
      const nextPaymentDueDate = paymentData.next_payment_due_date
        ? new Date(paymentData.next_payment_due_date).toISOString().split('T')[0]
        : '';
      
      form.reset({
        enrollmentId: paymentData.student_id?.toString() || '',
        amount: paymentData.amount?.toString() || '',
        paymentDate: paymentDate,
        nextPaymentDueDate: nextPaymentDueDate,
        paymentMethod: paymentData.payment_method || 'cash',
        status: paymentData.status || 'completed',
        transactionDetails: paymentData.transaction_id || paymentData.receipt_number || '',
        notes: paymentData.notes || '',
      });
    }
  }, [paymentData, isEditMode, form]);

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        console.log('Payment data received:', data);
        
        // Ensure enrollmentId is a valid number
        const enrollmentId = parseInt(data.enrollmentId, 10);
        if (isNaN(enrollmentId)) {
          console.error('enrollmentId is not a valid number:', data.enrollmentId);
          throw new Error('Invalid enrollment ID');
        }
        
        // Find the student to get current payment info (student is the enrollment)
        const student = enrollments?.find((s: any) => s.id === enrollmentId);
        if (!student) {
          console.error('Student not found for ID:', enrollmentId);
          console.log('Available students:', enrollments);
          throw new Error('Student not found');
        }
        console.log('Found student:', student);

        // Safely convert values with fallback to zero
        const safeParseFloat = (value: any): number => {
          if (value === undefined || value === null) return 0;
          const parsed = parseFloat(value.toString());
          return isNaN(parsed) ? 0 : parsed;
        };

        // Check if new payment exceeds the due amount
        const newAmount = safeParseFloat(data.amount);
        if (newAmount <= 0) {
          console.error('Invalid payment amount (must be positive):', data.amount);
          throw new Error('Payment amount must be greater than zero');
        }
        console.log('Valid payment amount:', newAmount);
        
        // Get total fee and paid amount using all possible field names
        const totalFee = student.total_fee !== undefined ? safeParseFloat(student.total_fee) :
                         student.totalFee !== undefined ? safeParseFloat(student.totalFee) :
                         student.totalFees !== undefined ? safeParseFloat(student.totalFees) : 0;
                      
        const feePaid = student.fee_paid !== undefined ? safeParseFloat(student.fee_paid) :
                        student.feePaid !== undefined ? safeParseFloat(student.feePaid) : 
                        student.amountPaid !== undefined ? safeParseFloat(student.amountPaid) : 0;
        
        // Get due amount - prefer explicitly stored value over calculation
        let dueFee = student.fee_due !== undefined ? safeParseFloat(student.fee_due) :
                     student.feeDue !== undefined ? safeParseFloat(student.feeDue) :
                     student.amountDue !== undefined ? safeParseFloat(student.amountDue) : 
                     Math.max(0, totalFee - feePaid);
        
        // Recalculate due fee if it's negative (data inconsistency)
        if (dueFee < 0 && totalFee > 0) {
          console.warn('Negative due fee detected, recalculating:', dueFee);
          dueFee = Math.max(0, totalFee - feePaid);
        }
        
        console.log('Fee details:', {
          totalFee,
          feePaid,
          dueFee,
          newPayment: newAmount
        });
        
        // Handle special cases:
        // 1. If total fee is 0, allow any payment (might be a special arrangement)
        // 2. If due amount is negative, use the recalculated positive value
        // 3. Add a small buffer (0.01) to handle floating point comparison issues
        
        const epsilon = 0.01; // Small buffer for floating point comparison
        
        if (totalFee > 0 && dueFee >= 0 && (newAmount > dueFee + epsilon)) {
          console.error('Payment exceeds due amount', {
            payment: newAmount, 
            due: dueFee,
            totalFee: totalFee,
            buffer: epsilon,
            comparison: newAmount > dueFee + epsilon
          });
          
          // Show a more precise error message
          throw new Error(`Payment amount (${newAmount.toFixed(2)}) exceeds the due amount (${dueFee.toFixed(2)})`);
        }
        
        if (totalFee === 0) {
          console.log('Total fee is 0, accepting payment without due amount validation');
        }

        // Send payment data to API
        const paymentData = {
          ...data,
          enrollmentId: enrollmentId,
          studentId: enrollmentId, // Student ID is the same as enrollment ID
          amount: String(newAmount), // Convert amount to string as expected by schema
          collectedBy: user?.id,
        };
        console.log('Sending payment data to API:', paymentData);

        const response = await apiRequest('POST', '/api/payments', paymentData);
        console.log('API response:', response);
        
        // Calculate updated amounts after payment
        const updatedAmountPaid = feePaid + newAmount;
        const updatedAmountDue = Math.max(0, totalFee - updatedAmountPaid);
        
        console.log('Updating student payment info:', {
          studentId: student.id,
          currentValues: {
            paid: feePaid,
            total: totalFee,
            due: dueFee
          },
          updatedValues: {
            paid: updatedAmountPaid,
            due: updatedAmountDue
          }
        });
        
        // Update via the students endpoint using snake_case field names for Prisma
        await apiRequest('PUT', `/api/students/${student.id}`, {
          fee_paid: String(updatedAmountPaid), // Convert to string for Prisma
          fee_due: String(updatedAmountDue)    // Convert to string for Prisma
        });
        
        return response;
      } catch (error) {
        console.error('Error in payment mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to record payment: ${error.message}`,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        console.log('Updating payment with data:', data);
        
        // Ensure enrollmentId is a valid number
        const enrollmentId = parseInt(data.enrollmentId, 10);
        if (isNaN(enrollmentId)) {
          console.error('enrollmentId is not a valid number:', data.enrollmentId);
          throw new Error('Invalid enrollment ID');
        }
        
        // Get original payment data to calculate difference
        if (!paymentData) {
          throw new Error('Original payment data not available');
        }
        
        // Find the student to get current payment info (student is the enrollment)
        const student = enrollments?.find((s: any) => s.id === enrollmentId);
        if (!student) {
          console.error('Student not found for ID:', enrollmentId);
          console.log('Available students:', enrollments);
          throw new Error('Student not found');
        }
        
        // Safely convert values with fallback to zero
        const safeParseFloat = (value: any): number => {
          if (value === undefined || value === null) return 0;
          const parsed = parseFloat(value.toString());
          return isNaN(parsed) ? 0 : parsed;
        };
        
        // Check if new payment amount is valid
        const newAmount = safeParseFloat(data.amount);
        if (newAmount <= 0) {
          console.error('Invalid payment amount (must be positive):', data.amount);
          throw new Error('Payment amount must be greater than zero');
        }
        
        // Get original amount for calculating the difference
        const originalAmount = safeParseFloat(paymentData.amount);
        const amountDifference = newAmount - originalAmount;
        
        console.log('Payment amount change:', { 
          original: originalAmount, 
          new: newAmount, 
          difference: amountDifference 
        });
        
        // Only need to update student fee records if the amount has changed
        if (amountDifference !== 0) {
          // Get current fee values
          const feePaid = student.fee_paid !== undefined ? safeParseFloat(student.fee_paid) :
                        student.feePaid !== undefined ? safeParseFloat(student.feePaid) : 
                        student.amountPaid !== undefined ? safeParseFloat(student.amountPaid) : 0;
          
          const totalFee = student.total_fee !== undefined ? safeParseFloat(student.total_fee) :
                         student.totalFee !== undefined ? safeParseFloat(student.totalFee) :
                         student.totalFees !== undefined ? safeParseFloat(student.totalFees) : 0;
                         
          // Calculate new paid and due amounts
          const updatedAmountPaid = feePaid + amountDifference;
          const updatedAmountDue = Math.max(0, totalFee - updatedAmountPaid);
          
          console.log('Updating student payment info after edit:', {
            studentId: student.id,
            originalAmount,
            newAmount,
            amountDifference,
            currentValues: {
              paid: feePaid,
              total: totalFee
            },
            updatedValues: {
              paid: updatedAmountPaid,
              due: updatedAmountDue
            }
          });
          
          // Update student records if amount changed
          await apiRequest('PUT', `/api/students/${student.id}`, {
            fee_paid: String(updatedAmountPaid), // Convert to string for Prisma
            fee_due: String(updatedAmountDue)    // Convert to string for Prisma
          });
        }
        
        // Convert data from camelCase to snake_case for Prisma
        const paymentData = {
          // Use student_id instead of enrollmentId (they're the same in this application)
          student_id: enrollmentId,
          amount: String(newAmount), // Convert amount to string as expected by schema
          payment_date: data.paymentDate,
          next_payment_due_date: data.nextPaymentDueDate,
          payment_method: data.paymentMethod,
          status: data.status,
          notes: data.notes,
          // Use transaction_id for transaction details
          transaction_id: data.transactionDetails || null,
        };
        
        console.log('Formatted payment data for API:', paymentData);
        
        return await apiRequest('PUT', `/api/payments/${paymentId}`, paymentData);
      } catch (error) {
        console.error('Error in update payment mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: 'Success',
        description: 'Payment updated successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update payment: ${error.message}`,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    console.log('Submitting payment data:', data);
    if (isEditMode) {
      console.log('Update mode - sending to updatePaymentMutation');
      updatePaymentMutation.mutate(data);
    } else {
      console.log('Create mode - sending to createPaymentMutation');
      createPaymentMutation.mutate(data);
    }
  };

  // Get remaining due amount for selected student
  const getStudentDueAmount = (studentId: string) => {
    if (!enrollments || !studentId) return 0;
    
    try {
      // Try to convert studentId to number, return 0 if invalid
      const studentIdNum = parseInt(studentId, 10);
      if (isNaN(studentIdNum)) {
        console.log('Invalid student ID for due amount calculation');
        return 0;
      }
      
      const student = enrollments.find((s: any) => s.id === studentIdNum);
      if (!student) {
        console.log('Student not found for due amount calculation, ID:', studentIdNum);
        return 0;
      }
      
      console.log('Student data for due amount calculation:', student);
      
      // Safely convert values with fallbacks
      const safeParseFloat = (value: any): number => {
        if (value === undefined || value === null) return 0;
        const parsed = parseFloat(value.toString());
        return isNaN(parsed) ? 0 : parsed;
      };
      
      // Check if there's an explicit due amount field - in order of preference
      let dueAmount = null;
      
      if (student.fee_due !== undefined) {
        dueAmount = safeParseFloat(student.fee_due);
      } else if (student.feeDue !== undefined) {
        dueAmount = safeParseFloat(student.feeDue);
      } else if (student.amountDue !== undefined) {
        dueAmount = safeParseFloat(student.amountDue);
      }
      
      // If we have an explicit due amount, use it (ensuring it's not negative)
      if (dueAmount !== null) {
        console.log('Using explicit due amount:', dueAmount);
        return Math.max(0, dueAmount);
      }
      
      // If no explicit due amount, calculate it from total and paid
      // Use the fields in order of preference (snake_case first as they match backend)
      const totalFee = student.total_fee !== undefined ? safeParseFloat(student.total_fee) :
                       student.totalFee !== undefined ? safeParseFloat(student.totalFee) :
                       student.totalFees !== undefined ? safeParseFloat(student.totalFees) : 0;
                      
      const feePaid = student.fee_paid !== undefined ? safeParseFloat(student.fee_paid) :
                      student.feePaid !== undefined ? safeParseFloat(student.feePaid) : 
                      student.amountPaid !== undefined ? safeParseFloat(student.amountPaid) : 0;
      
      // Calculate due amount and ensure it's not negative
      const calculatedDueAmount = Math.max(0, totalFee - feePaid);
      
      console.log('Calculated due amount:', {
        totalFee,
        feePaid,
        dueAmount: calculatedDueAmount
      });
      
      return calculatedDueAmount;
    } catch (error) {
      console.error('Error calculating due amount:', error);
      return 0; // Return 0 in case of any errors
    }
  };

  const selectedStudentId = form.watch('enrollmentId');
  const dueAmount = getStudentDueAmount(selectedStudentId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Payment' : 'Record Payment'}</DialogTitle>
        </DialogHeader>

        {(isEnrollmentsLoading || isStudentsLoading) ? (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Enrollment ID is hidden and automatically set */}
              <input type="hidden" {...form.register("enrollmentId")} />
              
              {selectedStudentId && (
                <div className="text-sm text-muted-foreground mb-2">
                  Due amount: ₹{dueAmount}
                </div>
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextPaymentDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Payment Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transactionDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Details</FormLabel>
                    <FormControl>
                      <Input placeholder="RCPT123456 or transaction reference" {...field} />
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
                      <Textarea placeholder="Add any additional notes here" {...field} />
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
                  {isEditMode ? 'Update Payment' : 'Record Payment'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}