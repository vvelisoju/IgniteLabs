import { useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/simplified-auth';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import BatchForm from '@/components/batches/BatchForm';
import AssignmentList from '@/components/assignments/AssignmentList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Users, Edit, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function BatchDetail() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';
  const [match, params] = useRoute('/batches/:id');
  const batchId = params?.id ? parseInt(params.id) : null;
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: batch, isLoading, error } = useQuery({
    queryKey: [`/api/batches/${batchId}`],
    enabled: !!batchId,
  });

  // Fetch students for this batch
  const { data: students, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/users/batch', batchId],
    enabled: !!batchId,
  });
  
  // Delete batch mutation
  const deleteBatchMutation = useMutation({
    mutationFn: async () => {
      if (!batchId) return null;
      return apiRequest(`/api/batches/${batchId}`, 'DELETE');
    },
    onSuccess: () => {
      // Invalidate batches queries to update lists
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches/active'] });
      
      toast({
        title: "Batch deleted",
        description: "The batch has been successfully deleted.",
      });
      
      // Navigate back to batches list
      navigate('/batches');
    },
    onError: (error) => {
      console.error("Failed to delete batch:", error);
      toast({
        title: "Error",
        description: "Failed to delete the batch. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Calculate progress percentage
  const getProgress = () => {
    if (!batch) return 0;
    
    // Parse dates safely - handle case where dates might be strings or Date objects
    const startDate = batch.startDate instanceof Date ? batch.startDate : new Date(batch.startDate);
    const endDate = batch.endDate instanceof Date ? batch.endDate : new Date(batch.endDate);
    const today = new Date();
    
    // Validate dates to prevent "Invalid time value" error
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 0;
    }
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    return Math.min(Math.max(Math.floor((daysPassed / totalDays) * 100), 0), 100);
  };

  // Calculate which week the batch is in
  const getCurrentWeek = () => {
    if (!batch) return { current: 1, total: 8 };
    
    // Parse dates safely - handle case where dates might be strings or Date objects
    const startDate = batch.startDate instanceof Date ? batch.startDate : new Date(batch.startDate);
    const endDate = batch.endDate instanceof Date ? batch.endDate : new Date(batch.endDate);
    const today = new Date();
    
    // Validate dates to prevent "Invalid time value" error
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { current: 1, total: 8 };
    }
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    
    const currentWeek = Math.ceil(daysPassed / 7);
    const totalWeeks = Math.ceil(totalDays / 7);
    
    return { current: Math.max(1, currentWeek), total: Math.max(1, totalWeeks) };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Failed to load batch details</p>
        <Link href="/batches">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Batches
          </Button>
        </Link>
      </div>
    );
  }

  const { current: currentWeek, total: totalWeeks } = getCurrentWeek();
  const progress = getProgress();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/batches">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-800">{batch.name}</h1>
              <Badge variant={batch.isActive ? "default" : "secondary"}>
                {batch.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-neutral-500">{batch.description || 'No description provided'}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditFormOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Batch
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the batch
                    "{batch.name}" and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteBatchMutation.mutate()}
                    disabled={deleteBatchMutation.isPending}
                  >
                    {deleteBatchMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : "Delete Batch"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="w-full bg-neutral-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Week {currentWeek} of {totalWeeks}</span>
                <span>{progress}% Complete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-neutral-500" />
              <span>
                {(() => {
                  try {
                    const startDate = new Date(batch.startDate);
                    const endDate = new Date(batch.endDate);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                      return 'Date not available';
                    }
                    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
                  } catch (e) {
                    return 'Date not available';
                  }
                })()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-neutral-500" />
              <span>
                {isStudentsLoading 
                  ? 'Loading...' 
                  : students 
                    ? `${students.length} Students enrolled` 
                    : 'No students enrolled'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assignments">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">Batch Assignments</h2>
            {isTrainer && (
              <Button onClick={() => setIsCreateAssignmentOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            )}
          </div>
          <AssignmentList batchId={batchId || undefined} />
        </TabsContent>
        
        <TabsContent value="students">
          <div className="mb-4">
            <h2 className="text-lg font-medium">Enrolled Students</h2>
          </div>
          {isStudentsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : students && students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student: any) => (
                <Card key={student.id}>
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                        {student.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'S'}
                      </div>
                      <div>
                        <CardTitle className="text-base">{student.name}</CardTitle>
                        <CardDescription>{student.email}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-500 p-8">No students enrolled in this batch</p>
          )}
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="mb-4">
            <h2 className="text-lg font-medium">Batch Analytics</h2>
          </div>
          <p className="text-center text-neutral-500 p-8">
            Detailed analytics dashboard for this batch will be available here.
          </p>
        </TabsContent>
      </Tabs>

      {/* Edit Batch Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Update the details for {batch.name}
            </DialogDescription>
          </DialogHeader>
          <BatchForm batchId={batchId || undefined} onSuccess={() => setIsEditFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Assignment</DialogTitle>
            <DialogDescription>
              Create a new assignment for {batch.name}
            </DialogDescription>
          </DialogHeader>
          {/* We would typically render the AssignmentForm component here */}
          <div className="text-center p-4">
            <p>This would render the AssignmentForm component</p>
            <p className="text-sm text-neutral-500 mt-2">Prefilled with batchId: {batchId}</p>
            <Button onClick={() => setIsCreateAssignmentOpen(false)} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
