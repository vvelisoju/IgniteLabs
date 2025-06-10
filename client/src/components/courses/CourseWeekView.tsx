import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, BookOpen, Calendar, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/simplified-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DailyContentView } from '@/components/courses/DailyContentView';
import { LessonPlanView } from '@/components/courses/LessonPlanView';
import { Link } from 'wouter';

interface CourseWeekViewProps {
  courseId: number;
  week: number;
}

export function CourseWeekView({ courseId, week }: CourseWeekViewProps) {
  const [activeDay, setActiveDay] = useState('1');
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'lessonPlan'
  const { user } = useAuth();
  const isTrainerOrAdmin = user?.role === 'trainer' || user?.role === 'admin';

  // Fetch course content for the specific week
  const { data: weekContent = [], isLoading, error } = useQuery({
    queryKey: [`/api/contents/course/${courseId}/week/${week}`],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          Failed to load week content. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Convert to array if needed
  const contentArray = Array.isArray(weekContent) ? weekContent : [];

  // Only show "No content" message if we're on the content tab and there's no content
  if (contentArray.length === 0 && activeTab === 'content') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Week {week}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground py-4">
              No content has been added for this week yet.
            </p>
            {isTrainerOrAdmin && (
              <Link href={`/courses/${courseId}/content/new?week=${week}`}>
                <Button className="mx-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate tabs for each day of the week
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Week {week} Content</CardTitle>
        {isTrainerOrAdmin && (
          <>
            {activeTab === 'content' && (
              <Link href={`/courses/${courseId}/content/new?week=${week}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </Link>
            )}
            {activeTab === 'lessonPlan' && (
              <Button 
                onClick={() => {
                  // We'll use the LessonPlanView's add button functionality
                  const addButton = document.querySelector('[data-testid="add-lesson-plan-button"]') as HTMLButtonElement;
                  if (addButton) {
                    addButton.click();
                  }
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson Plan
              </Button>
            )}
          </>
        )}
      </CardHeader>
      <CardContent>
        {/* Content Type Selection */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Course Content
            </TabsTrigger>
            <TabsTrigger value="lessonPlan" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Lesson Plans
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Daily Tabs */}
        <Tabs defaultValue="1" value={activeDay} onValueChange={setActiveDay}>
          <TabsList className="grid grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => (
              <TabsTrigger key={i} value={(i + 1).toString()}>
                Day {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Array.from({ length: 7 }, (_, i) => (
            <TabsContent key={i} value={(i + 1).toString()}>
              {activeTab === 'content' ? (
                <DailyContentView
                  courseId={courseId}
                  week={week}
                  day={i + 1}
                />
              ) : (
                <LessonPlanView
                  courseId={courseId}
                  week={week}
                  day={i + 1}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}