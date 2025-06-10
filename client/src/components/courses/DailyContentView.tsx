import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, BookOpen, Video, FileText, Pencil, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/simplified-auth';
import { insertDailyCourseContentSchema } from '@shared/schema';
import { ContentEditor } from '@/components/courses/ContentEditor';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';

interface DailyContentViewProps {
  courseId: number;
  week: number;
  day: number;
}

export function DailyContentView({ courseId, week, day }: DailyContentViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isTrainerOrAdmin = user?.role === 'trainer' || user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('student');
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [contentType, setContentType] = useState<'trainerMaterial' | 'studentMaterial' | 'studentAssignments' | 'studentResearch'>('studentMaterial');

  // Fetch the course content for this specific week (parent content)
  const { data: weekContent, isLoading: isLoadingWeekContent } = useQuery({
    queryKey: [`/api/contents/course/${courseId}/week/${week}`],
  });

  // Fetch daily content for this specific day
  const { data: dailyContent, isLoading, error } = useQuery({
    queryKey: [`/api/daily-contents/course/${courseId}/week/${week}/day/${day}`],
    enabled: !!courseId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest('/api/daily-contents', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content created successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-contents/course/${courseId}/week/${week}/day/${day}`] });
      setIsEditing(false);
      setEditingContent(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create content',
        variant: 'destructive',
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => {
      return apiRequest(`/api/daily-contents/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-contents/course/${courseId}/week/${week}/day/${day}`] });
      setIsEditing(false);
      setEditingContent(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update content',
        variant: 'destructive',
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/daily-contents/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/daily-contents/course/${courseId}/week/${week}/day/${day}`] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive',
      });
    }
  });

  // Function to find the parent content ID
  const findParentContentId = () => {
    if (!weekContent || weekContent.length === 0) return null;
    return weekContent[0].id; // Simplified for now, might need better logic based on your data structure
  };

  const handleCreateContent = (contentData: string) => {
    const contentId = findParentContentId();
    if (!contentId) {
      toast({
        title: 'Error',
        description: 'No parent content found for this week. Create week content first.',
        variant: 'destructive',
      });
      return;
    }

    const data: any = {
      contentId,
      day,
      contentType: 'rich_text',
    };
    
    // Set the specific content type that's being edited
    data[contentType] = contentData;
    
    createMutation.mutate(data);
  };

  const handleUpdateContent = (contentData: string) => {
    if (!editingContent) return;
    
    const data: any = { ...editingContent };
    // Update only the specific content field
    data[contentType] = contentData;
    
    updateMutation.mutate({ id: editingContent.id, data });
  };

  const handleEditContent = (content: any, type: 'trainerMaterial' | 'studentMaterial' | 'studentAssignments' | 'studentResearch') => {
    setEditingContent(content);
    setContentType(type);
    setIsEditing(true);
  };

  const handleDeleteContent = (contentId: number) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteMutation.mutate(contentId);
    }
  };

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

  if (isLoading || isLoadingWeekContent) {
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
          Failed to load day content. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const hasParentContent = weekContent && weekContent.length > 0;
  const contentItems = dailyContent || [];

  if (isEditing) {
    return (
      <ContentEditor
        initialContent={editingContent ? editingContent[contentType] || '' : ''}
        contentType={editingContent?.contentType || 'rich_text'}
        onSave={(content) => editingContent ? handleUpdateContent(content) : handleCreateContent(content)}
        onCancel={() => {
          setIsEditing(false);
          setEditingContent(null);
        }}
        isNew={!editingContent}
        title={`${contentType === 'trainerMaterial' ? 'Trainer Material' : 
                contentType === 'studentMaterial' ? 'Lesson' : 
                contentType === 'studentAssignments' ? 'Assignment' : 'Research'} Editor`}
      />
    );
  }

  return (
    <div className="space-y-4">
      {!hasParentContent && (
        <Alert className="mb-4">
          <AlertDescription>
            No weekly content has been created for Week {week}. Create weekly content first before adding daily content.
          </AlertDescription>
        </Alert>
      )}
      
      {hasParentContent && (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student View</TabsTrigger>
              <TabsTrigger value="trainer">Trainer View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student" className="space-y-4 pt-4">
              {/* Student Material */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Lesson Material</CardTitle>
                    {isTrainerOrAdmin && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setContentType('studentMaterial');
                          const existingContent = contentItems.find(item => item.studentMaterial);
                          setEditingContent(existingContent || null);
                          setIsEditing(true);
                        }}
                      >
                        {contentItems.some(item => item.studentMaterial) ? (
                          <><Edit className="h-4 w-4 mr-2" /> Edit</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-2" /> Add</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {contentItems.some(item => item.studentMaterial) ? (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ 
                      __html: contentItems.find(item => item.studentMaterial)?.studentMaterial || '' 
                    }} />
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No lesson material available for this day.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Student Assignments */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Assignments</CardTitle>
                    {isTrainerOrAdmin && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setContentType('studentAssignments');
                          const existingContent = contentItems.find(item => item.studentAssignments);
                          setEditingContent(existingContent || null);
                          setIsEditing(true);
                        }}
                      >
                        {contentItems.some(item => item.studentAssignments) ? (
                          <><Edit className="h-4 w-4 mr-2" /> Edit</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-2" /> Add</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {contentItems.some(item => item.studentAssignments) ? (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ 
                      __html: contentItems.find(item => item.studentAssignments)?.studentAssignments || '' 
                    }} />
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No assignments available for this day.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Student Research */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Research & Resources</CardTitle>
                    {isTrainerOrAdmin && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setContentType('studentResearch');
                          const existingContent = contentItems.find(item => item.studentResearch);
                          setEditingContent(existingContent || null);
                          setIsEditing(true);
                        }}
                      >
                        {contentItems.some(item => item.studentResearch) ? (
                          <><Edit className="h-4 w-4 mr-2" /> Edit</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-2" /> Add</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {contentItems.some(item => item.studentResearch) ? (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ 
                      __html: contentItems.find(item => item.studentResearch)?.studentResearch || '' 
                    }} />
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No research materials available for this day.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trainer" className="space-y-4 pt-4">
              {/* Trainer Material */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Trainer Notes</CardTitle>
                    {isTrainerOrAdmin && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setContentType('trainerMaterial');
                          const existingContent = contentItems.find(item => item.trainerMaterial);
                          setEditingContent(existingContent || null);
                          setIsEditing(true);
                        }}
                      >
                        {contentItems.some(item => item.trainerMaterial) ? (
                          <><Edit className="h-4 w-4 mr-2" /> Edit</>
                        ) : (
                          <><Plus className="h-4 w-4 mr-2" /> Add</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {contentItems.some(item => item.trainerMaterial) ? (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ 
                      __html: contentItems.find(item => item.trainerMaterial)?.trainerMaterial || '' 
                    }} />
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No trainer materials available for this day.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Content Management Section (Trainer Only) */}
              {isTrainerOrAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contentItems.length > 0 ? (
                        <Accordion type="single" collapsible>
                          {contentItems.map((item) => (
                            <AccordionItem key={item.id} value={`item-${item.id}`}>
                              <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                  {getContentIcon(item.contentType)}
                                  <span>Daily Content #{item.id}</span>
                                  <Badge variant="outline" className="ml-2">Day {item.day}</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-3 p-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      variant="outline" 
                                      size="sm"
                                      className="w-full flex items-center justify-center"
                                      onClick={() => handleEditContent(item, 'trainerMaterial')}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Trainer Notes
                                    </Button>
                                    <Button
                                      variant="outline" 
                                      size="sm"
                                      className="w-full flex items-center justify-center"
                                      onClick={() => handleEditContent(item, 'studentMaterial')}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Lesson
                                    </Button>
                                    <Button
                                      variant="outline" 
                                      size="sm"
                                      className="w-full flex items-center justify-center"
                                      onClick={() => handleEditContent(item, 'studentAssignments')}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Assignments
                                    </Button>
                                    <Button
                                      variant="outline" 
                                      size="sm"
                                      className="w-full flex items-center justify-center"
                                      onClick={() => handleEditContent(item, 'studentResearch')}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Research
                                    </Button>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full flex items-center justify-center"
                                    onClick={() => handleDeleteContent(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Content
                                  </Button>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No content items to manage.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}