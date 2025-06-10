import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, PlusCircle, Trash2, Edit2, IndianRupee, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/simplified-auth';
import PaymentForm from '@/components/students/PaymentForm';

export default function FeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [tab, setTab] = useState('all');

  // Fetch enrollments with payment data
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['/api/enrollments', 'confirmed'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/enrollments?status=confirmed');
      return await response.json();
    },
  });

  // Fetch all payments
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payments');
      return await response.json();
    },
  });

  // Fetch students data for display
  const { data: students = {}, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/students');
      return await response.json();
    },
  });

  // Fetch batches data for display
  const { data: batches = {}, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['/api/batches'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/batches');
      return await response.json();
    },
  });

  const isLoading = isLoadingEnrollments || isLoadingPayments || isLoadingStudents || isLoadingBatches;

  // Filter enrollments based on search query
  const filteredEnrollments = enrollments.filter((enrollment: any) => {
    const student = students[enrollment.studentId];
    if (!student) return false;
    
    const studentName = student.name.toLowerCase();
    const search = searchQuery.toLowerCase();
    
    return studentName.includes(search);
  });

  // Calculate total fees received, pending, and waived
  const feesStats = enrollments.reduce(
    (acc: any, enrollment: any) => {
      const enrollmentPayments = payments.filter((payment: any) => payment.enrollmentId === enrollment.id);
      const totalPaid = enrollmentPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
      
      acc.total += enrollment.totalFees;
      acc.paid += totalPaid;
      acc.waived += enrollment.feesWaived || 0;
      acc.pending += enrollment.totalFees - totalPaid - (enrollment.feesWaived || 0);
      
      return acc;
    },
    { total: 0, paid: 0, pending: 0, waived: 0 }
  );

  // Filter payments based on tab selection
  const filteredPayments = payments.filter((payment: any) => {
    if (tab === 'all') return true;
    return payment.status === tab;
  });

  const handleOpenPaymentForm = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setPaymentFormOpen(true);
  };

  const handleClosePaymentForm = () => {
    setPaymentFormOpen(false);
    setSelectedEnrollment(null);
    setSelectedPayment(null);
  };

  const handleEditPayment = (payment: any) => {
    // Find the enrollment/student for this payment
    const enrollment = enrollments.find((e: any) => e.id === payment.enrollmentId);
    
    if (enrollment) {
      setSelectedEnrollment(enrollment);
      setSelectedPayment(payment);
      setPaymentFormOpen(true);
    } else {
      // If we can't find the enrollment (unlikely), try using the student ID directly
      setSelectedEnrollment({ id: payment.studentId });
      setSelectedPayment(payment);
      setPaymentFormOpen(true);
    }
  };

  const handleGenerateReceipt = (payment: any) => {
    // Placeholder for receipt generation functionality
    toast({
      title: "Receipt Generated",
      description: `Receipt #${payment.receiptNumber || 'TMP-' + payment.id} was generated.`,
    });
  };

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-neutral-700">Access Denied</h2>
          <p className="text-neutral-500 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage student fees, payments, and generate receipts
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{feesStats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{feesStats.paid.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₹{feesStats.pending.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Waived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{feesStats.waived.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Enrollment Table */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Student Fees</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>
              View and manage fee details for enrolled students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No students match your search' : 'No confirmed enrollments found'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEnrollments.map((enrollment: any) => {
                  const student = students[enrollment.studentId];
                  const batch = batches[enrollment.batchId] || { name: 'No Batch' };
                  const enrollmentPayments = payments.filter((payment: any) => payment.enrollmentId === enrollment.id);
                  const totalPaid = enrollmentPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
                  const remainingFees = enrollment.totalFees - totalPaid - (enrollment.feesWaived || 0);
                  
                  return (
                    <Card key={enrollment.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{student?.name || 'Unknown Student'}</h3>
                            <div className="text-sm text-muted-foreground">
                              Batch: {batch.name}
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="text-sm flex items-center">
                                <span className="w-28">Total Fees:</span>
                                <span className="font-medium">₹{enrollment.totalFees.toLocaleString()}</span>
                              </div>
                              <div className="text-sm flex items-center">
                                <span className="w-28">Paid:</span>
                                <span className="font-medium text-green-600">₹{totalPaid.toLocaleString()}</span>
                              </div>
                              {enrollment.feesWaived > 0 && (
                                <div className="text-sm flex items-center">
                                  <span className="w-28">Waived:</span>
                                  <span className="font-medium text-blue-600">₹{enrollment.feesWaived.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="text-sm flex items-center">
                                <span className="w-28">Remaining:</span>
                                <span className={`font-medium ${remainingFees > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                  ₹{remainingFees.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-dashed"
                              onClick={() => handleOpenPaymentForm(enrollment)}
                            >
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Add Payment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              View and manage all student payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="mb-4">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="partial">Partial</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payments found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment: any) => {
                  const enrollment = enrollments.find((e: any) => e.id === payment.enrollmentId);
                  if (!enrollment) return null;
                  
                  const student = students[enrollment.studentId];
                  const paymentDate = new Date(payment.paymentDate);
                  
                  return (
                    <Card key={payment.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-base">
                              {student?.name || 'Unknown Student'}
                            </h3>
                            <div className="text-sm text-muted-foreground">
                              {paymentDate.toLocaleDateString()} · 
                              <Badge 
                                variant="outline" 
                                className={`ml-2 ${
                                  payment.status === 'completed' ? 'border-green-200 text-green-600' : 
                                  payment.status === 'pending' ? 'border-amber-200 text-amber-600' : 
                                  payment.status === 'partial' ? 'border-blue-200 text-blue-600' : ''
                                }`}
                              >
                                {payment.status}
                              </Badge>
                            </div>
                            <div className="mt-2">
                              <div className="text-sm flex items-center">
                                <span className="w-28">Amount:</span>
                                <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                              </div>
                              <div className="text-sm flex items-center">
                                <span className="w-28">Method:</span>
                                <span>{payment.paymentMethod}</span>
                              </div>
                              {payment.receiptNumber && (
                                <div className="text-sm flex items-center">
                                  <span className="w-28">Receipt #:</span>
                                  <span>{payment.receiptNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleGenerateReceipt(payment)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  <span>Generate Receipt</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditPayment(payment)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  <span>Edit Payment</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Form Dialog */}
      {selectedEnrollment && (
        <PaymentForm
          isOpen={paymentFormOpen}
          onClose={handleClosePaymentForm}
          preselectedEnrollmentId={selectedEnrollment.id}
          paymentId={selectedPayment?.id}
        />
      )}
    </div>
  );
}