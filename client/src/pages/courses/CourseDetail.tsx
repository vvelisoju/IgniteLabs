import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/simplified-auth';
import { CourseWeekView } from '@/components/courses/CourseWeekView';
import CourseForm from '@/components/courses/CourseForm';
import AssignmentList from '@/components/assignments/AssignmentList';
import AssignmentForm from '@/components/assignments/AssignmentForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Edit, ChevronLeft, Plus, FileText, Info, Clock, Users, Layers, LinkIcon, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { queryClient, apiRequest } from '@/lib/queryClient';

export default function CourseDetail() {
  const { user } = useAuth();
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const [match, params] = useRoute('/courses/:id');
  const courseId = params?.id ? parseInt(params.id) : null;
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('curriculum');
  const [isAddChildCourseOpen, setIsAddChildCourseOpen] = useState(false);
  const [selectedChildCourseId, setSelectedChildCourseId] = useState<number | null>(null);

  // Fetch the course details
  const { 
    data: courseData, 
    isLoading, 
    error 
  } = useQuery<any>({
    queryKey: ['/api/courses', courseId],
    enabled: !!courseId,
    gcTime: 0, // Disable cache to ensure fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
  
  // If we have an array, find the specific course by ID
  const course = courseData && Array.isArray(courseData) 
    ? courseData.find((c: any) => c.id === courseId) 
    : courseData;

  // Debug course data
  useEffect(() => {
    if (course) {
      console.log('Course data:', course);
      console.log('Is composite:', course.isComposite);
      console.log('Type of isComposite:', typeof course.isComposite);
    }
  }, [course]);
  
  // Fetch child courses if this is a composite course
  const { 
    data: childCoursesData = [],
    isLoading: isLoadingChildCourses,
    refetch: refetchChildCourses
  } = useQuery<any[]>({
    queryKey: ['/api/courses', courseId, 'combinations'],
    enabled: !!courseId && !!course?.isComposite,
    gcTime: 0
  });
  
  // Filter out child courses from all courses if the API returns all courses
  const childCoursesIds = course?.isComposite ? 
    Array.isArray(courseData) ? 
      courseData
        .filter((c: any) => c.id !== courseId)
        .map((c: any) => c.id)
      : []
    : [];
  
  // Create an array for child courses
  const childCourses = childCoursesData && 
    !Array.isArray(childCoursesData) ? 
      [childCoursesData] : childCoursesData;

  // Debug child courses
  useEffect(() => {
    if (childCourses && childCourses.length > 0) {
      console.log('Child courses:', childCourses);
    }
  }, [childCourses]);
  
  // Fetch all available courses for adding as child courses
  const { data: allCourses = [] } = useQuery<any[]>({
    queryKey: ['/api/courses'],
    enabled: isAddChildCourseOpen,
  });
  
  // Filter out courses that are already child courses and the current course itself
  const availableCourses = Array.isArray(allCourses) ? allCourses.filter((availableCourse: any) => {
    // Don't include the current course
    if (availableCourse.id === courseId) return false;
    
    // Don't include courses that are already children
    return !childCourses.some((childCourse: any) => childCourse.id === availableCourse.id);
  }) : [];
  
  // Function to add a child course
  const addChildCourse = async () => {
    if (!selectedChildCourseId || !courseId) return;
    
    try {
      await apiRequest(
        `/api/courses/${courseId}/combinations`, 
        'POST',
        {
          childCourseId: selectedChildCourseId,
          order: childCourses.length + 1 // Set the order to be the next in sequence
        }
      );
      
      // Refresh child courses list
      if (refetchChildCourses) refetchChildCourses();
      setSelectedChildCourseId(null);
      setIsAddChildCourseOpen(false);
    } catch (error) {
      console.error('Failed to add child course:', error);
    }
  };
  
  // Function to remove a child course
  const removeChildCourse = async (combinationId: number) => {
    try {
      await apiRequest(
        `/api/courses/combinations/${combinationId}`,
        'DELETE'
      );
      
      // Refresh child courses list
      if (refetchChildCourses) refetchChildCourses();
    } catch (error) {
      console.error('Failed to remove child course:', error);
    }
  };
  
  // Calculate total weeks from the course data
  const calculateTotalWeeks = () => {
    if (!course) return 8; // Default fallback
    return course.durationWeeks || 8;
  };
  
  const totalWeeks = calculateTotalWeeks();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Failed to load course details</p>
        <Link href="/courses">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with course title and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/courses">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">{course.title}</h1>
            <p className="text-neutral-500">{course.description || 'No description provided'}</p>
          </div>
        </div>
        {isTrainer && (
          <Button onClick={() => setIsEditFormOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
        )}
      </div>

      {/* Course summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Course Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-neutral-100">
              <div className="py-2 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-neutral-500">Course Type</dt>
                <dd className="text-sm text-neutral-900 col-span-2">
                  <Badge variant="outline" className={!!course.isComposite ? "bg-purple-50 text-purple-800 border-purple-200" : "bg-blue-50 text-blue-800 border-blue-200"}>
                    {!!course.isComposite ? "Composite Course" : "Standard Course"}
                  </Badge>
                </dd>
              </div>
              <div className="py-2 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-neutral-500">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Duration
                  </span>
                </dt>
                <dd className="text-sm text-neutral-900 col-span-2">
                  {totalWeeks} weeks ({totalWeeks * 7} days)
                </dd>
              </div>
              <div className="py-2 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-neutral-500">Created</dt>
                <dd className="text-sm text-neutral-900 col-span-2">
                  {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Unknown'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="curriculum">
            <FileText className="h-4 w-4 mr-2" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <FileText className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          {!!course && course.isComposite === true && (
            <TabsTrigger value="childCourses">
              <Layers className="h-4 w-4 mr-2" />
              Component Courses
            </TabsTrigger>
          )}
        </TabsList>

        {/* Curriculum Tab */}
        <TabsContent value="curriculum" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Week Selection</h2>
          </div>
          
          <div className="grid grid-cols-8 gap-2 md:gap-4">
            {Array.from({ length: totalWeeks }, (_, i) => (
              <Button
                key={i}
                variant={activeWeek === i + 1 ? "default" : "outline"}
                onClick={() => setActiveWeek(i + 1)}
                className="w-full"
              >
                {i + 1}
              </Button>
            ))}
          </div>
          
          {/* Week Content View */}
          {courseId && <CourseWeekView courseId={courseId} week={activeWeek} />}
        </TabsContent>
        
        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Assignments</h2>
            {isTrainer && (
              <Button onClick={() => setIsCreateAssignmentOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            )}
          </div>
          
          {courseId && <AssignmentList courseId={courseId} />}
        </TabsContent>
        
        {/* Child Courses Tab */}
        {!!course && course.isComposite === true && (
          <TabsContent value="childCourses" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Component Courses</h2>
              {isAdmin && (
                <Button onClick={() => setIsAddChildCourseOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component Course
                </Button>
              )}
            </div>

            {isLoadingChildCourses ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : childCourses.length === 0 ? (
              <div className="text-center py-10 border rounded-lg bg-gray-50">
                <p className="text-neutral-500">No component courses have been added yet.</p>
                {isAdmin && (
                  <Button onClick={() => setIsAddChildCourseOpen(true)} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first component course
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childCourses.map((childCourse: any) => (
                  <Card key={childCourse.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base truncate">{childCourse.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-neutral-500 line-clamp-2 h-10">{childCourse.description}</p>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <Link href={`/courses/${childCourse.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            View Course
                          </Button>
                        </Link>
                        
                        {isAdmin && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              // Find the combination ID for this child course
                              const combination = (childCourse as any)._combination;
                              if (combination && combination.id) {
                                removeChildCourse(combination.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
      
      {/* Add Child Course Dialog */}
      <Dialog open={isAddChildCourseOpen} onOpenChange={setIsAddChildCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Component Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-neutral-500">
              Select a course to add as a component of this composite course.
            </p>
            
            {availableCourses.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-neutral-500">No available courses to add.</p>
                <p className="text-neutral-400 text-sm mt-2">
                  All courses are already included or no other courses exist in the system.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2">
                  {availableCourses.map((course: any) => (
                    <div 
                      key={course.id} 
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-colors
                        ${selectedChildCourseId === course.id ? 'border-primary bg-primary/5' : 'hover:border-neutral-400'}
                      `}
                      onClick={() => setSelectedChildCourseId(course.id)}
                    >
                      <div className="font-medium">{course.title}</div>
                      <p className="text-sm text-neutral-500 line-clamp-1">{course.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddChildCourseOpen(false);
                    setSelectedChildCourseId(null);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={addChildCourse} 
                    disabled={!selectedChildCourseId}
                  >
                    Add Course
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit course dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          {courseId && 
            <CourseForm
              courseId={courseId}
              existingCourse={course}
              onSuccess={() => setIsEditFormOpen(false)}
            />
          }
        </DialogContent>
      </Dialog>

      {/* Create assignment dialog */}
      <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create Assignment</DialogTitle>
          </DialogHeader>
          {courseId && 
            <AssignmentForm
              courseId={courseId}
              onSuccess={() => setIsCreateAssignmentOpen(false)}
            />
          }
        </DialogContent>
      </Dialog>
    </div>
  );
}