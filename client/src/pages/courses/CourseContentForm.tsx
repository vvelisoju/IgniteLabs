import { useState, useEffect } from 'react';
import { useLocation, useRoute, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/simplified-auth';
import { ContentEditor } from '@/components/courses/ContentEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define course interface
interface Course {
  id: number;
  title: string;
  description: string;
  durationWeeks: number;
  isComposite: boolean;
}

export default function CourseContentForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Extract courseId from the route
  const params = useParams();
  const courseId = Number(params.id);
  
  // Extract query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const week = Number(searchParams.get('week')) || 1;
  const day = Number(searchParams.get('day')) || 1;
  
  // Check authorization
  const isTrainerOrAdmin = user?.role === 'trainer' || user?.role === 'admin';

  // If not authorized, redirect back to course detail
  useEffect(() => {
    if (!isTrainerOrAdmin) {
      navigate(`/courses/${courseId}`);
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to create course content.',
        variant: 'destructive',
      });
    }
  }, [isTrainerOrAdmin, navigate, courseId, toast]);

  // Fetch course to verify existence
  const { data: course, isLoading, error } = useQuery<Course | Course[]>({
    queryKey: [`/api/courses/${courseId}`],
  });

  // Create Week Content Mutation
  const createContentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/contents', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Course content has been created.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/contents/course/${courseId}/week/${week}`] });
      navigate(`/courses/${courseId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course content.',
        variant: 'destructive',
      });
    },
  });

  // Handle save content
  const handleSaveContent = (content: string) => {
    createContentMutation.mutate({
      courseId,
      week,
      title: 'Weekly Content',
      description: `Content for Week ${week}`,
      content: content,
      contentType: 'studentMaterial', // Default to student material
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Failed to load course information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const courseData = Array.isArray(course) ? course[0] : course;
  const courseTitle = courseData?.title || `Course ${courseId}`;

  return (
    <div className="container mx-auto py-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Content for {courseTitle} - Week {week}</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentEditor
            initialContent=""
            contentType="studentMaterial"
            onSave={handleSaveContent}
            onCancel={() => navigate(`/courses/${courseId}`)}
            isNew={true}
            title="Add Weekly Content"
          />
        </CardContent>
      </Card>
    </div>
  );
}