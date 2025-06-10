import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/simplified-auth';
import { 
  ArrowLeft, 
  Edit, 
  Loader2, 
  Phone, 
  Mail, 
  UserCog,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  School,
  GraduationCap,
  Receipt,
  Download,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import EnrollmentForm from '@/components/students/EnrollmentForm';
import PaymentForm from '@/components/students/PaymentForm';
import { InvoiceDownloadButton, ConsolidatedInvoiceButton } from '@/components/students/InvoiceDownloadButton';

export default function StudentDetail() {
  const [match, params] = useRoute('/students/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const studentId = params?.id ? parseInt(params.id) : undefined;
  
  const [isEnrollmentFormOpen, setIsEnrollmentFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  // Fetch student details
  const { data: student, isLoading: isStudentLoading } = useQuery({
    queryKey: ['/api/students', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!studentId,
  });

  // Fetch batch details for this student
  const { data: batch, isLoading: isBatchLoading } = useQuery({
    queryKey: ['/api/batches', student?.batch_id],
    queryFn: async () => {
      const response = await fetch(`/api/batches/${student?.batch_id}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!student?.batch_id,
  });

  // Fetch payments for this student
  const { data: payments, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['/api/students', studentId, 'payments'],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/payments`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!studentId,
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async () => {
      if (!studentId) return;
      return apiRequest('DELETE', `/api/students/${studentId}`);
    },
    onSuccess: async () => {
      // Invalidate queries to update all related data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/students'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] })
      ]);
      
      toast({
        title: 'Success',
        description: 'Student record deleted successfully',
      });
      setLocation('/students');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete student: ${error.message}`,
        variant: 'destructive',
      });
      setIsDeleteAlertOpen(false);
    },
  });

  // Check if user has manager or admin role
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  // Function to get enrollment status badge color
  const getStatusBadgeVariant = (isActive?: boolean) => {
    if (isActive === undefined) return 'bg-gray-100 text-gray-800';
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Function to get payment status badge color
  const getPaymentStatusVariant = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to format time with AM/PM
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format date and time together
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  // Format currency
  const formatCurrency = (amount: number | string) => {
    if (!amount) return '₹0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  if (isStudentLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Student Not Found</h1>
        <p className="text-neutral-600 mb-6">The student record you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation('/students')}>Back to Students</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/students')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              {student.name} 
              {student.phone && (
                <span className="ml-2 text-base font-normal text-muted-foreground flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {student.phone}
                </span>
              )}
            </h1>
            <div className="mt-1">
              <Badge className={getStatusBadgeVariant(student.is_active)}>
                {student.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {batch && (
                <span className="ml-2 text-sm text-muted-foreground">
                  Batch: {batch.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEnrollmentFormOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Student
          </Button>
          <Button variant="outline" onClick={() => setIsPaymentFormOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>

          <Button 
            variant="destructive"
            onClick={() => setIsDeleteAlertOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Student Details and Payments in tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Student Details</TabsTrigger>
          <TabsTrigger value="payments">
            Payments {payments?.length ? `(${payments.length})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* Student Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">Full Name</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{student.phone}</div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                  </div>
                </div>
                {student.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{student.email}</div>
                      <div className="text-sm text-muted-foreground">Email</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enrollment Status & Fee */}
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium flex items-center mt-1">
                      <Badge className={getStatusBadgeVariant(student.is_active)}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Enrollment Date</div>
                    <div className="font-medium">{formatDate(student.enrollment_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Fee</div>
                    <div className="font-medium">{formatCurrency(student.total_fee)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Fee Paid</div>
                    <div className="font-medium">{formatCurrency(student.fee_paid)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Fee Due</div>
                    <div className="font-medium">{formatCurrency(student.fee_due)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created At</div>
                    <div className="font-medium">{student.createdAt ? formatDate(student.createdAt) : 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Batch Information */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isBatchLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : batch ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Batch Name</div>
                      <div className="font-medium">{batch.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Trainer</div>
                      <div className="font-medium">{batch.trainer ? batch.trainer : 'Not assigned'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Start Date</div>
                      <div className="font-medium">{formatDate(batch.startDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">End Date</div>
                      <div className="font-medium">{formatDate(batch.endDate)}</div>
                    </div>
                    {batch.description && (
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Description</div>
                        <div className="font-medium text-sm">{batch.description}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">
                    No batch information available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Payment Summary</CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-primary hover:text-primary/90"
                  onClick={() => setIsPaymentFormOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Record Payment
                </Button>
              </CardHeader>
              <CardContent>
                {isPaymentsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : payments && payments.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Payments</div>
                        <div className="font-medium">{payments.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Last Payment</div>
                        <div className="font-medium">
                          {formatDate(payments[0].paymentDate)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Fee Status</div>
                        <div className="mt-1">
                          {parseFloat(student.fee_due) <= 0 ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Fully Paid
                            </Badge>
                          ) : parseFloat(student.fee_paid) > 0 ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Partially Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Payment Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground pt-2">Recent Payments</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.slice(0, 3).map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.payment_date)}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{payment.payment_method}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  setSelectedPaymentId(payment.id);
                                  setIsPaymentFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CreditCard className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No payments recorded</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      This student doesn't have any payment records yet.
                    </p>
                    <Button onClick={() => setIsPaymentFormOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Record First Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {student.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{student.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  View and manage all payments for this student
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {payments && payments.length > 0 && (
                  <ConsolidatedInvoiceButton
                    studentId={student.id}
                    label="Combined Receipt"
                    size="sm"
                    variant="outline"
                  />
                )}
                <Button size="sm" onClick={() => setIsPaymentFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isPaymentsLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Download</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-medium">{formatDate(payment.payment_date)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className="capitalize">
                            {payment.payment_method.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.reference || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[250px] truncate">{payment.notes || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <InvoiceDownloadButton 
                            paymentId={payment.id} 
                            label="Receipt" 
                            size="sm" 
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setSelectedPaymentId(payment.id);
                              setIsPaymentFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No payments yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    This student doesn't have any payment records. Record a payment to track fees.
                  </p>
                  <Button onClick={() => setIsPaymentFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record First Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Edit Form Modal */}
      {isEnrollmentFormOpen && (
        <EnrollmentForm
          isOpen={isEnrollmentFormOpen}
          onClose={() => setIsEnrollmentFormOpen(false)}
          initialData={{
            studentName: student.name,
            phone: student.phone,
            email: student.email,
            batchId: student.batch_id.toString(),
            enrollmentStatus: student.is_active ? 'enrolled' : 'dropped_out',
            totalFees: student.total_fee.toString(),
            amountPaid: student.fee_paid.toString(),
            enrollmentDate: student.enrollment_date,
            notes: student.notes,
          }}
          enrollmentId={student.id}
        />
      )}

      {/* Payment Form Modal */}
      {isPaymentFormOpen && (
        <PaymentForm
          isOpen={isPaymentFormOpen}
          onClose={() => {
            setIsPaymentFormOpen(false);
            setSelectedPaymentId(null); // Reset selected payment when closing
          }}
          preselectedEnrollmentId={student?.id}
          paymentId={selectedPaymentId}
        />
      )}



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student record
              and all associated payment data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStudentMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}