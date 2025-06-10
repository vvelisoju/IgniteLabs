import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, BookOpen, FileText, Video, Star, Award, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/simplified-auth';
import { apiRequest } from '@/lib/queryClient';
import { LessonPlanEditor } from '@/components/courses/LessonPlanEditor';

interface LessonPlanViewProps {
  courseId: number;
  week: number;
  day: number;
}

export function LessonPlanView({ courseId, week, day }: LessonPlanViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isTrainerOrAdmin = user?.role === 'trainer' || user?.role === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Fetch lesson plans for this specific day
  const { data: lessonPlans = [], isLoading, error } = useQuery({
    queryKey: [`/api/lesson-plans/course/${courseId}/week/${week}/day/${day}`],
    enabled: !!courseId,
  });

  // Delete lesson plan mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/lesson-plans/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lesson plan deleted successfully',
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/lesson-plans/course/${courseId}/week/${week}/day/${day}`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/lesson-plans/course/${courseId}`] 
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete lesson plan',
        variant: 'destructive',
      });
    }
  });

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setIsEditing(true);
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setIsEditing(true);
  };

  const handleDeletePlan = (id: number) => {
    if (window.confirm('Are you sure you want to delete this lesson plan?')) {
      deleteMutation.mutate(id);
    }
  };

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
          Failed to load lesson plans. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Helper function to render the icon based on content type
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'rich_text':
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const planArray = Array.isArray(lessonPlans) ? lessonPlans : [];

  return (
    <div className="space-y-4">
      {isTrainerOrAdmin && (
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleCreatePlan} 
            data-testid="add-lesson-plan-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson Plan
          </Button>
        </div>
      )}
      
      {planArray.length > 0 ? (
        <div className="space-y-6">
          {planArray.map((plan: any) => (
            <Card key={plan.id} className="relative">
              {isTrainerOrAdmin && (
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEditPlan(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeletePlan(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getContentIcon(plan.contentType)}
                  <CardTitle>{plan.title}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Main Content */}
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: plan.content }} />
                
                {/* Learning Objectives */}
                {plan.objectives && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Learning Objectives
                    </h3>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: plan.objectives }} />
                  </div>
                )}
                
                {/* Assignments */}
                {plan.assignments && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-blue-500" />
                      Assignments
                    </h3>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: plan.assignments }} />
                  </div>
                )}
                
                {/* Resources */}
                {plan.resources && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                      <ExternalLink className="h-5 w-5 text-green-500" />
                      Resources
                    </h3>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: plan.resources }} />
                  </div>
                )}
                
                {/* Trainer Notes - Only visible to trainers and admins */}
                {isTrainerOrAdmin && plan.trainerNotes && (
                  <div className="mt-4 p-4 bg-muted rounded-md border border-muted-foreground/20">
                    <h3 className="text-lg font-semibold mb-2">Trainer Notes</h3>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: plan.trainerNotes }} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center">
              No lesson plans are available for Day {day} of Week {week}.
              {isTrainerOrAdmin && ' Click the "Add Lesson Plan" button to create one.'}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Lesson Plan Editor Modal */}
      {isEditing && (
        <LessonPlanEditor
          courseId={courseId}
          week={week}
          day={day}
          isOpen={isEditing}
          onClose={() => {
            setIsEditing(false);
            setEditingPlan(null);
          }}
          existingPlan={editingPlan}
        />
      )}
    </div>
  );
}