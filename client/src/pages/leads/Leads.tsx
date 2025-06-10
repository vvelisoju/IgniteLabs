import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/simplified-auth';
import { useLocation } from 'wouter';
import { 
  CalendarClock,
  ChevronsUpDown, 
  Edit, 
  Eye,
  Loader2, 
  MoreHorizontal, 
  Phone, 
  Plus, 
  Search, 
  Trash2, 
  UserPlus,
  X,
  Filter as FilterIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LeadForm from '@/components/leads/LeadForm';
import LeadConversionForm from '@/components/leads/LeadConversionForm';
import LeadFollowUpForm from '@/components/leads/LeadFollowUpForm';

export default function Leads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [followUpDateFilter, setFollowUpDateFilter] = useState<string>('');
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isConversionFormOpen, setIsConversionFormOpen] = useState(false);
  const [isFollowUpFormOpen, setIsFollowUpFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  // Fetch all leads
  const { data: leads, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['/api/leads'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  // Fetch all batches (for conversion form)
  const { data: batches, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['/api/batches'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });
  
  // Fetch follow-ups for each lead
  const [followUpsData, setFollowUpsData] = useState<Record<number, any[]>>({});
  const [isLoadingFollowUps, setIsLoadingFollowUps] = useState(false);
  
  // Fetch follow-ups whenever leads data changes
  useEffect(() => {
    const fetchFollowUpsForLeads = async () => {
      if (!leads || !Array.isArray(leads) || leads.length === 0) return;
      
      setIsLoadingFollowUps(true);
      const followUpsByLeadId: Record<number, any[]> = {};
      
      try {
        // Create an array of promises for parallel fetching
        const promises = leads.map(async (lead: any) => {
          const response = await fetch(`/api/leads/${lead.id}/follow-ups`);
          const data = await response.json();
          return { leadId: lead.id, followUps: data };
        });
        
        // Wait for all promises to resolve
        const results = await Promise.all(promises);
        
        // Process the results
        results.forEach(result => {
          followUpsByLeadId[result.leadId] = result.followUps;
        });
        
        setFollowUpsData(followUpsByLeadId);
      } catch (error) {
        console.error('Error fetching follow-ups:', error);
      } finally {
        setIsLoadingFollowUps(false);
      }
    };
    
    fetchFollowUpsForLeads();
  }, [leads]);

  // Function to handle lead deletion
  const deleteMutation = useMutation({
    mutationFn: async (leadId: number) => {
      return apiRequest(`/api/leads/${leadId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete lead: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Function to open lead form for editing
  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setIsLeadFormOpen(true);
  };

  // Function to open conversion form
  const handleConvertLead = (lead: any) => {
    setSelectedLead(lead);
    setIsConversionFormOpen(true);
  };
  
  // Function to open follow-up form
  const handleAddFollowUp = (lead: any) => {
    setSelectedLead(lead);
    setIsFollowUpFormOpen(true);
  };
  
  // Function to navigate to lead detail page
  const handleViewLead = (lead: any) => {
    setLocation(`/leads/${lead.id}`);
  };

  // Function to filter leads based on search query, status, and follow-up date
  const filteredLeads = leads?.filter((lead: any) => {
    // Text search filter
    const searchLower = searchQuery.toLowerCase();
    const textMatch = 
      lead.name?.toLowerCase().includes(searchLower) ||
      lead.phone?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.course?.toLowerCase().includes(searchLower) ||
      lead.status?.toLowerCase().includes(searchLower);
    
    // Status filter - handle multiple statuses via checkboxes
    const statusMatch = 
      statusFilters.length === 0 || // If no filters selected, show all leads
      statusFilters.includes(lead.status); // Otherwise show leads with matching status
    
    // Follow-up date filter
    let followUpDateMatch = true;
    if (followUpDateFilter) {
      const selectedDate = new Date(followUpDateFilter);
      selectedDate.setHours(0, 0, 0, 0); // Start of the day
      
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1); // End of the day
      
      // Check if any follow-up is scheduled for this date
      const hasFollowUp = lead.followUps?.some((followUp: any) => {
        const followUpDate = new Date(followUp.followUpDate);
        return followUpDate >= selectedDate && followUpDate < nextDate;
      });
      
      followUpDateMatch = hasFollowUp;
    }
    
    return textMatch && statusMatch && followUpDateMatch;
  });

  // Function to get status badge color
  const getStatusBadgeVariant = (status: string) => {
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
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return '';
    }
  };
  
  // Function to get the next scheduled follow-up date
  const getNextFollowUp = (followUps: any[] | undefined): string | null => {
    if (!followUps || !Array.isArray(followUps) || followUps.length === 0) return null;
    
    try {
      // Filter incomplete follow-ups - check for both completed and isCompleted fields
      const incompleteFollowUps = followUps.filter(f => !f.isCompleted);
      
      if (incompleteFollowUps.length === 0) return null;
      
      // Sort by follow-up date (ascending)
      const sortedFollowUps = [...incompleteFollowUps].sort(
        (a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime()
      );
      
      // Return the earliest follow-up date
      return sortedFollowUps[0]?.followUpDate || null;
    } catch (error) {
      console.error("Error getting next follow-up:", error);
      return null;
    }
  };

  // Check if user has manager or admin role
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  if (!isManager) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-neutral-600 mb-6">You don't have permission to access this page.</p>
        <Button href="/">Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground">
            Manage and track potential students, convert qualified leads to enrollments
          </p>
        </div>

        <Button onClick={() => {
          setSelectedLead(null);
          setIsLeadFormOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Lead
        </Button>
      </div>

      {/* Lead Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLeadsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                leads?.length || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLeadsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                leads?.filter((lead: any) => lead.status === 'new')?.length || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLeadsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                leads?.filter((lead: any) => lead.status === 'qualified')?.length || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Converted Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLeadsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                leads?.filter((lead: any) => lead.status === 'converted')?.length || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search leads..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="relative w-auto">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                  className="inline-flex items-center gap-2"
                >
                  <FilterIcon className="h-4 w-4" />
                  Status Filter
                  {statusFilters.length > 0 && (
                    <Badge className="ml-1" variant="secondary">
                      {statusFilters.length}
                    </Badge>
                  )}
                </Button>
                
                {isStatusFilterOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 p-3 bg-white rounded-md shadow-md border z-10">
                    <div className="space-y-2">
                      <div className="text-sm font-medium mb-2">Filter by status</div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="status-new"
                          checked={statusFilters.includes('new')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilters([...statusFilters, 'new']);
                            } else {
                              setStatusFilters(statusFilters.filter(s => s !== 'new'));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="status-new" className="text-sm">New</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="status-contacted"
                          checked={statusFilters.includes('contacted')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilters([...statusFilters, 'contacted']);
                            } else {
                              setStatusFilters(statusFilters.filter(s => s !== 'contacted'));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="status-contacted" className="text-sm">Contacted</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="status-qualified"
                          checked={statusFilters.includes('qualified')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilters([...statusFilters, 'qualified']);
                            } else {
                              setStatusFilters(statusFilters.filter(s => s !== 'qualified'));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="status-qualified" className="text-sm">Qualified</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="status-converted"
                          checked={statusFilters.includes('converted')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilters([...statusFilters, 'converted']);
                            } else {
                              setStatusFilters(statusFilters.filter(s => s !== 'converted'));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="status-converted" className="text-sm">Converted</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="status-dropped"
                          checked={statusFilters.includes('dropped')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStatusFilters([...statusFilters, 'dropped']);
                            } else {
                              setStatusFilters(statusFilters.filter(s => s !== 'dropped'));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="status-dropped" className="text-sm">Dropped</label>
                      </div>
                      
                      {statusFilters.length > 0 && (
                        <div className="pt-2 mt-2 border-t">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => setStatusFilters([])}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="w-auto">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="w-auto"
                    value={followUpDateFilter}
                    onChange={(e) => setFollowUpDateFilter(e.target.value)}
                  />
                  {followUpDateFilter && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setFollowUpDateFilter('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLeadsLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLeads && filteredLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Course Interest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead: any) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-neutral-50"
                    onClick={() => handleViewLead(lead)}
                  >
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </span>
                        {lead.email && <span className="text-xs text-muted-foreground">{lead.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{lead.course}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeVariant(lead.status)}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(lead.createdAt)}</TableCell>
                    <TableCell>
                      {isLoadingFollowUps ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (() => {
                        const nextFollowUp = getNextFollowUp(followUpsData[lead.id]);
                        if (nextFollowUp) {
                          return formatDate(nextFollowUp);
                        } else {
                          return <span className="text-muted-foreground text-xs">None scheduled</span>;
                        }
                      })()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddFollowUp(lead)}>
                            <CalendarClock className="w-4 h-4 mr-2" />
                            Add Follow-Up
                          </DropdownMenuItem>
                          {lead.status === 'qualified' && (
                            <DropdownMenuItem onClick={() => handleConvertLead(lead)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Convert to Student
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this lead?')) {
                                deleteMutation.mutate(lead.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No leads found</p>
            <Button variant="outline" onClick={() => {
              setSelectedLead(null);
              setIsLeadFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Lead
            </Button>
          </div>
        )}
      </div>

      {/* Lead Form Modal */}
      {isLeadFormOpen && (
        <LeadForm
          isOpen={isLeadFormOpen}
          onClose={() => setIsLeadFormOpen(false)}
          initialData={selectedLead}
          leadId={selectedLead?.id}
        />
      )}

      {/* Lead Conversion Form Modal */}
      {isConversionFormOpen && (
        <LeadConversionForm
          isOpen={isConversionFormOpen}
          onClose={() => setIsConversionFormOpen(false)}
          lead={selectedLead}
          batches={batches || []}
        />
      )}

      {/* Lead Follow-Up Form Modal */}
      {isFollowUpFormOpen && (
        <LeadFollowUpForm
          isOpen={isFollowUpFormOpen}
          onClose={() => setIsFollowUpFormOpen(false)}
          preselectedLeadId={selectedLead?.id}
        />
      )}
    </div>
  );
}