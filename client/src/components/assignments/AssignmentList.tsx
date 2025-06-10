import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Assignment } from '@shared/schema';
import { format } from 'date-fns';
import { Loader2, FileText, CalendarClock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/simplified-auth';

interface AssignmentListProps {
  courseId?: number;
  batchId?: number;
  week?: number;
}

export default function AssignmentList({ courseId, batchId, week }: AssignmentListProps) {
  const { user } = useAuth();
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  // Determine the query key based on filters
  let queryKey = ['/api/assignments'];
  if (courseId && batchId && week) {
    queryKey = ['/api/assignments/course', courseId, 'batch', batchId, 'week', week];
  } else if (courseId) {
    queryKey = ['/api/assignments/course', courseId];
  } else if (batchId) {
    queryKey = ['/api/assignments/batch', batchId];
  }

  const { data: assignments, isLoading, error } = useQuery({
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
        <p className="text-red-500">Failed to load assignments</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-500">
          {week 
            ? `No assignments found for Week ${week}` 
            : courseId 
              ? 'No assignments found for this course' 
              : batchId 
                ? 'No assignments found for this batch'
                : 'No assignments found'}
        </p>
        {isTrainer && (
          <Link href={`/assignments/new${courseId ? `?courseId=${courseId}` : ''}${batchId ? `&batchId=${batchId}` : ''}${week ? `&week=${week}` : ''}`}>
            <Button className="mt-4">Create Assignment</Button>
          </Link>
        )}
      </div>
    );
  }

  // Get due date status
  const getStatusInfo = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (daysLeft < 0) {
      return { label: 'Overdue', variant: 'destructive' as const };
    } else if (daysLeft === 0) {
      return { label: 'Due Today', variant: 'warning' as const };
    } else if (daysLeft <= 2) {
      return { label: `Due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`, variant: 'warning' as const };
    } else {
      return { label: `Due in ${daysLeft} days`, variant: 'default' as const };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assignments.map((assignment: Assignment) => {
        const status = getStatusInfo(assignment.dueDate.toString());
        
        return (
          <Card key={assignment.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="rounded-full bg-primary-100 p-2 text-primary-800">
                  <FileText className="h-5 w-5" />
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <CardTitle className="mt-2 line-clamp-1">{assignment.title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-0">
              <div className="space-y-3">
                <p className="text-neutral-600 line-clamp-3">
                  {assignment.description || 'No description provided'}
                </p>
                
                <div className="flex space-x-4 text-sm text-neutral-600">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>Week {assignment.week}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarClock className="h-4 w-4 mr-1" />
                    <span>{format(new Date(assignment.dueDate), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-4">
              <Link href={`/assignments/${assignment.id}`} className="w-full">
                <Button variant="outline" className="w-full">View Assignment</Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
