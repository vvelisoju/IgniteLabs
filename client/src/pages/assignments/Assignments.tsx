import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/simplified-auth';
import AssignmentList from '@/components/assignments/AssignmentList';
import AssignmentForm from '@/components/assignments/AssignmentForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText } from 'lucide-react';

export default function Assignments() {
  const { user } = useAuth();
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [location] = useLocation();
  
  // Parse search params from location
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  
  // Get initial courseId and batchId from URL if available
  const initialCourseId = searchParams.get('courseId');
  const initialBatchId = searchParams.get('batchId');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Assignments</h1>
          <p className="text-neutral-500">Manage and view all assignments</p>
        </div>
        {isTrainer && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          {user?.role === 'student' && (
            <TabsTrigger value="my-submissions">My Submissions</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="all">
          <AssignmentList />
        </TabsContent>
        <TabsContent value="upcoming">
          <p className="text-center text-neutral-500 p-8">
            Upcoming assignments will be displayed here.
          </p>
        </TabsContent>
        <TabsContent value="past">
          <p className="text-center text-neutral-500 p-8">
            Past assignments will be displayed here.
          </p>
        </TabsContent>
        {user?.role === 'student' && (
          <TabsContent value="my-submissions">
            <p className="text-center text-neutral-500 p-8">
              Your submitted assignments will be displayed here.
            </p>
          </TabsContent>
        )}
      </Tabs>

      {/* Create Assignment Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new assignment
            </DialogDescription>
          </DialogHeader>
          <AssignmentForm 
            courseId={initialCourseId ? parseInt(initialCourseId) : undefined}
            batchId={initialBatchId ? parseInt(initialBatchId) : undefined}
            onSuccess={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
