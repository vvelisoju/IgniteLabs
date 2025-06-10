import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/simplified-auth';
import { 
  ArrowLeft, 
  ArrowRight,
  CalendarClock, 
  Edit, 
  Loader2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  UserPlus,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeadForm from '@/components/leads/LeadForm';
import LeadConversionForm from '@/components/leads/LeadConversionForm';
import LeadFollowUpForm from '@/components/leads/LeadFollowUpForm';

export default function LeadDetail() {
  const [match, params] = useRoute('/leads/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const leadId = params?.id ? parseInt(params.id) : undefined;
  
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isConversionFormOpen, setIsConversionFormOpen] = useState(false);
  const [isFollowUpFormOpen, setIsFollowUpFormOpen] = useState(false);

  // Fetch lead details
  const { data: lead, isLoading: isLeadLoading } = useQuery({
    queryKey: ['/api/leads', leadId],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${leadId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!leadId, // Removed role check to allow all users to see lead details
  });

  // Fetch follow-ups for this lead
  const { data: followUps, isLoading: isFollowUpsLoading } = useQuery({
    queryKey: ['/api/leads', leadId, 'follow-ups'],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${leadId}/follow-ups`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!leadId, // Removed role check to allow all users to see follow-ups
  });
  
  // Fetch batches (for conversion)
  const { data: batches, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['/api/batches'],
    queryFn: async () => {
      const response = await fetch('/api/batches', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  // Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!leadId) return;
      return apiRequest(`/api/leads/${leadId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
      });
      setLocation('/leads');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete lead: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Complete follow-up mutation
  const completeFollowUpMutation = useMutation({
    mutationFn: async (followUpId: number) => {
      return apiRequest(`/api/follow-ups/${followUpId}/complete`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', leadId, 'follow-ups'] });
      toast({
        title: 'Success',
        description: 'Follow-up marked as completed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to complete follow-up: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete follow-up mutation
  const deleteFollowUpMutation = useMutation({
    mutationFn: async (followUpId: number) => {
      return apiRequest(`/api/follow-ups/${followUpId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', leadId, 'follow-ups'] });
      toast({
        title: 'Success',
        description: 'Follow-up deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete follow-up: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Check if user has manager or admin role
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  // Function to get status badge color
  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
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

  // Removed access restriction to make sure all users can see lead details

  if (isLeadLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Lead Not Found</h1>
        <p className="text-neutral-600 mb-6">The lead you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation('/leads')}>Back to Leads</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              {lead.name} 
              {lead.phone && (
                <span className="ml-2 text-base font-normal text-muted-foreground flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {lead.phone}
                </span>
              )}
            </h1>
            <div className="mt-1">
              {lead.status && (
                <Badge className={getStatusBadgeVariant(lead.status)}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
              )}
              {lead.source && (
                <span className="ml-2 text-sm text-muted-foreground">
                  Source: {lead.source.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {(lead.status === 'qualified' || lead.status === 'contacted') && (
            <Button onClick={() => setIsConversionFormOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convert to Student
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={(e) => {
              // Stop event propagation
              e.preventDefault();
              e.stopPropagation();
              console.log("Edit button clicked, opening form");
              // Force a small delay before setting state
              setTimeout(() => {
                console.log("Setting isLeadFormOpen to true");
                setIsLeadFormOpen(true);
              }, 10);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Lead
          </Button>
          <Button variant="outline" onClick={() => setIsFollowUpFormOpen(true)}>
            <CalendarClock className="h-4 w-4 mr-2" />
            Add Follow-Up
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Lead Details and Follow-ups in tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Lead Details</TabsTrigger>
          <TabsTrigger value="followups">
            Follow-ups {followUps?.length ? `(${followUps.length})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* Lead Details Tab */}
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
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-sm text-muted-foreground">Full Name</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{lead.phone}</div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                  </div>
                </div>
                {lead.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{lead.email}</div>
                      <div className="text-sm text-muted-foreground">Email</div>
                    </div>
                  </div>
                )}
                {lead.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{lead.address}</div>
                      <div className="text-sm text-muted-foreground">Address</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lead Status & Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Status</div>
                    <div className="font-medium flex items-center mt-1">
                      <Badge className={getStatusBadgeVariant(lead.status)}>
                        {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1) || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created Date</div>
                    <div className="font-medium">{formatDate(lead.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Assigned To</div>
                    <div className="font-medium">{lead.assignedTo || 'Unassigned'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Updated</div>
                    <div className="font-medium">{lead.updatedAt ? formatDate(lead.updatedAt) : 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Lead Information */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Course Interest</div>
                    <div className="font-medium">{lead.course || 'Not specified'}</div>
                  </div>
                  {lead.budget && (
                    <div>
                      <div className="text-sm text-muted-foreground">Budget</div>
                      <div className="font-medium">₹{lead.budget.toLocaleString()}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Source</div>
                    <div className="font-medium">{lead.source || 'Not specified'}</div>
                  </div>
                  {lead.referredBy && (
                    <div>
                      <div className="text-sm text-muted-foreground">Referred By</div>
                      <div className="font-medium">{lead.referredBy}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lead Communication History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Communication</CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-primary hover:text-primary/90"
                  onClick={() => setIsFollowUpFormOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Follow-Up
                </Button>
              </CardHeader>
              <CardContent>
                {followUps && followUps.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Last Communication</div>
                    <div className="font-medium">
                      {formatDateTime(followUps[0].followUpDate)}
                    </div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="font-medium">
                      {followUps[0].type}
                    </div>
                    {followUps[0].notes && (
                      <>
                        <div className="text-sm text-muted-foreground">Notes</div>
                        <div className="font-medium text-sm line-clamp-2">
                          {followUps[0].notes}
                        </div>
                      </>
                    )}
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        variant="link" 
                        onClick={() => {
                          const tabsEl = document.querySelector('[role="tablist"]');
                          const tabBtn = tabsEl?.querySelector('[value="followups"]');
                          if (tabBtn instanceof HTMLElement) {
                            tabBtn.click();
                          }
                        }}
                      >
                        View all follow-ups
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No communication history yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Follow-ups Tab */}
        <TabsContent value="followups">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Follow-up History</CardTitle>
                <CardDescription>
                  View and manage all follow-ups for this lead
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsFollowUpFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Follow-Up
              </Button>
            </CardHeader>
            <CardContent>
              {isFollowUpsLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : followUps && followUps.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Next Follow-up</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followUps.map((followUp: any) => {
                      // Handle both snake_case from API and camelCase formats
                      const followUpDate = followUp.follow_up_date || followUp.followUpDate;
                      const nextFollowUpDate = followUp.next_follow_up_date || followUp.nextFollowUpDate;
                      
                      return (
                        <TableRow key={followUp.id}>
                          <TableCell>
                            <div className="font-medium">{formatDate(followUpDate)}</div>
                            <div className="text-sm text-muted-foreground">{formatTime(followUpDate)}</div>
                          </TableCell>
                          <TableCell>{followUp.type}</TableCell>
                          <TableCell>
                            {followUp.status === 'completed' || followUp.is_completed ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : new Date(followUpDate) < new Date() ? (
                              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                <Clock className="h-3 w-3 mr-1" />
                                {followUp.status ? followUp.status.charAt(0).toUpperCase() + followUp.status.slice(1) : 'Scheduled'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[250px] truncate">{followUp.comments}</div>
                          </TableCell>
                          <TableCell>
                            {nextFollowUpDate && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                                {formatDate(nextFollowUpDate)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this follow-up?')) {
                                    deleteFollowUpMutation.mutate(followUp.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarClock className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No follow-ups yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    This lead doesn't have any follow-up history. Schedule your first follow-up to keep track of your communication.
                  </p>
                  <Button onClick={() => setIsFollowUpFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Follow-Up
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lead Form Modal */}
      {isLeadFormOpen && (
        <LeadForm
          isOpen={isLeadFormOpen}
          onClose={() => setIsLeadFormOpen(false)}
          initialData={{
            name: lead.name,
            phone: lead.phone || '',
            email: lead.email || '',
            source: lead.source || '',
            course: lead.course || '',
            status: lead.status || 'new',
            notes: lead.notes || '',
            assigned_to: lead.assigned_to || null
          }}
          leadId={lead.id}
        />
      )}

      {/* Lead Conversion Form Modal */}
      {isConversionFormOpen && (
        <LeadConversionForm
          isOpen={isConversionFormOpen}
          onClose={() => setIsConversionFormOpen(false)}
          lead={lead}
          batches={batches || []}
        />
      )}

      {/* Lead Follow-Up Form Modal */}
      {isFollowUpFormOpen && (
        <LeadFollowUpForm
          isOpen={isFollowUpFormOpen}
          onClose={() => setIsFollowUpFormOpen(false)}
          preselectedLeadId={lead.id}
        />
      )}
    </div>
  );
}