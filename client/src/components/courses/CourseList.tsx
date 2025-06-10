import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Course } from '@shared/schema';
import { Loader2, BookOpen, Users, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/simplified-auth';

interface CourseListProps {
  trainerId?: number;
}

export default function CourseList({ trainerId }: CourseListProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTrainer = user?.role === 'trainer';

  // Determine the query key based on whether we're filtering by trainer
  const queryKey = trainerId 
    ? ['/api/courses/trainer', trainerId]
    : ['/api/courses'];

  const { data: courses, isLoading, error } = useQuery({
    queryKey,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load courses</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-500">No courses found</p>
        {(isAdmin || isTrainer) && (
          <Link href="/courses/new">
            <Button className="mt-4">Create Course</Button>
          </Link>
        )}
      </div>
    );
  }

  // Function to get color based on course ID (for variety)
  const getCourseColor = (id: number) => {
    const colors = [
      'bg-primary-100 text-primary-800',
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[id % colors.length];
  };

  // For trainers, only show their courses if not filtered already
  // Filter out non-public courses (used as components of composite courses)
  const displayCourses = courses
    ? courses.filter((course: any) => {
        // Filter based on isPublic field if it exists
        if (course.isPublic === false) return false;
        
        // If we're filtering by trainer ID and the user is not an admin, only show their courses
        if (!trainerId && isTrainer && !isAdmin && course.trainerId !== user.id) return false;
        
        return true;
      })
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayCourses.map((course: Course) => {
        // Generate initials for the course
        const initials = course.title
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
        
        return (
          <Card key={course.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start">
                <div className={`flex-shrink-0 h-10 w-10 rounded ${getCourseColor(course.id).split(' ')[0]} flex items-center justify-center ${getCourseColor(course.id).split(' ')[1]} font-bold`}>
                  {initials}
                </div>
              </div>
              <CardTitle className="mt-2">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-0">
              <div className="space-y-3">
                <p className="text-neutral-600 line-clamp-3">
                  {course.description || 'No description provided'}
                </p>
                
                <div className="flex space-x-4 text-sm text-neutral-600">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>{course.durationWeeks || 8} Weeks</span>
                  </div>
                  {course.isComposite && (
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 mr-1" />
                      <span>Composite</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-4">
              <Link href={`/courses/${course.id}`} className="w-full">
                <Button variant="outline" className="w-full">View Course</Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
