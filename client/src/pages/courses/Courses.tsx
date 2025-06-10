import { useState } from 'react';
import { useAuth } from '@/lib/simplified-auth';
import CourseList from '@/components/courses/CourseList';
import CourseForm from '@/components/courses/CourseForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen } from 'lucide-react';

export default function Courses() {
  const { user } = useAuth();
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Courses</h1>
          <p className="text-neutral-500">Manage and view all courses</p>
        </div>
        {isTrainer && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Courses</TabsTrigger>
          {isTrainer && (
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="all">
          <CourseList />
        </TabsContent>
        {isTrainer && (
          <TabsContent value="my-courses">
            <CourseList trainerId={user?.id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Create Course Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new course
            </DialogDescription>
          </DialogHeader>
          <CourseForm onSuccess={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
