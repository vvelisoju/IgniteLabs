import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CreditCard, UserPlus, Users, Eye, Search, Filter } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/simplified-auth';
import EnrollmentForm from '@/components/students/EnrollmentForm';
import PaymentForm from '@/components/students/PaymentForm';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Students() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isEnrollmentFormOpen, setIsEnrollmentFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentDueFilter, setPaymentDueFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  
  // Fetch students as enrollments
  const { data: enrollments, isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/students'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  // Fetch payments
  const { data: payments, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  // We're removing Today's Follow-ups as per requirements

  // Fetch all users (for student lookup)
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  // Fetch all batches (for enrollment form)
  const { data: batches, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['/api/batches'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  // Function to get batch name by ID
  const getBatchName = (batchId: number) => {
    if (!batches) return 'Loading...';
    const batch = batches.find((b: any) => b.id === batchId);
    return batch ? batch.name : 'Unknown';
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to get enrollment status badge color
  const getEnrollmentStatusColor = (status: string) => {
    switch(status) {
      case 'enrolled': return 'bg-green-100 text-green-800';
      case 'dropped': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter function for enrollments
  const filteredEnrollments = enrollments ? enrollments.filter((enrollment: any) => {
    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      if (enrollment.is_active !== isActive) return false;
    }

    // Payment due filter
    if (paymentDueFilter !== 'all' && enrollment.next_payment_due_date) {
      const dueDate = new Date(enrollment.next_payment_due_date);
      const today = new Date();
      const diff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (paymentDueFilter === 'this-week' && (diff < 0 || diff > 7)) return false;
      if (paymentDueFilter === 'this-month' && (diff < 0 || diff > 30)) return false;
      if (paymentDueFilter === 'overdue' && diff >= 0) return false;
    }

    // Batch filter
    if (batchFilter !== 'all' && enrollment.batch_id !== Number(batchFilter)) {
      return false;
    }

    // Search query filter (name, phone, email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = enrollment.name?.toLowerCase().includes(query);
      const phoneMatch = enrollment.phone?.toLowerCase().includes(query);
      const emailMatch = enrollment.email?.toLowerCase().includes(query);
      
      if (!nameMatch && !phoneMatch && !emailMatch) return false;
    }

    return true;
  }) : [];

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  if (!isManager) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-neutral-600 mb-6">You don't have permission to access this page.</p>
        <Link href="/">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">
            Manage student enrollments and payments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isEnrollmentsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                enrollments?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Active student registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isPaymentsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                formatCurrency(
                  payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total collected fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isEnrollmentsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                formatCurrency(
                  enrollments?.reduce((sum: number, enrollment: any) => sum + Number(enrollment.fee_due), 0) || 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pending fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Enrollments section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Student Enrollments</h2>
          <Button onClick={() => setIsEnrollmentFormOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Enrollment
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[250px]"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={paymentDueFilter} onValueChange={setPaymentDueFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by payment due" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Due Dates</SelectItem>
                <SelectItem value="this-week">Due This Week</SelectItem>
                <SelectItem value="this-month">Due This Month</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches && batches.map((batch: any) => (
                  <SelectItem key={batch.id} value={batch.id.toString()}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isEnrollmentsLoading || isUsersLoading || isBatchesLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEnrollments && filteredEnrollments.length > 0 ? (
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 font-medium">
                    <th className="h-12 px-4 text-left align-middle">Student</th>
                    <th className="h-12 px-4 text-left align-middle">Batch</th>
                    <th className="h-12 px-4 text-left align-middle">Status</th>
                    <th className="h-12 px-4 text-left align-middle">Total Fees</th>
                    <th className="h-12 px-4 text-left align-middle">Paid</th>
                    <th className="h-12 px-4 text-left align-middle">Due</th>
                    <th className="h-12 px-4 text-left align-middle">Date</th>
                    <th className="h-12 px-4 text-left align-middle">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enrollment: any) => (
                    <tr 
                      key={enrollment.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => setLocation(`/students/${enrollment.id}`)}
                    >
                      <td className="p-4 align-middle">
                        <div>
                          <div className="font-medium">{enrollment.name}</div>
                          {enrollment.phone && <div className="text-sm text-muted-foreground">{enrollment.phone}</div>}
                        </div>
                      </td>
                      <td className="p-4 align-middle">{getBatchName(enrollment.batch_id)}</td>
                      <td className="p-4 align-middle">
                        <Badge className={getEnrollmentStatusColor(enrollment.is_active ? 'enrolled' : 'inactive')}>
                          {enrollment.is_active ? 'Enrolled' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">{formatCurrency(Number(enrollment.total_fee))}</td>
                      <td className="p-4 align-middle">{formatCurrency(Number(enrollment.fee_paid))}</td>
                      <td className="p-4 align-middle">{formatCurrency(Number(enrollment.fee_due))}</td>
                      <td className="p-4 align-middle">{formatDate(enrollment.enrollment_date)}</td>
                      <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedStudentId(enrollment.id);
                          setIsPaymentFormOpen(true);
                        }}>
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground p-12">No enrollments found. Add a new enrollment to get started.</p>
        )}
      </div>

      {/* Forms */}
      {isEnrollmentFormOpen && (
        <EnrollmentForm
          isOpen={isEnrollmentFormOpen}
          onClose={() => setIsEnrollmentFormOpen(false)}
        />
      )}

      {isPaymentFormOpen && (
        <PaymentForm
          isOpen={isPaymentFormOpen}
          onClose={() => setIsPaymentFormOpen(false)}
          preselectedEnrollmentId={selectedStudentId}
        />
      )}
    </div>
  );
}