import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/simplified-auth';
import { CourseContent as CourseContentType, contentTypeEnum, insertCourseContentSchema } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Video, BookOpen, Edit, Trash, Eye, EyeOff, Loader2, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CourseContentProps {
  courseId: number;
  currentWeek: number;
}

// Define a form schema that extends the insert schema
const contentFormSchema = insertCourseContentSchema.extend({
  contentType: z.enum(contentTypeEnum.enumValues),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

export default function CourseContent({ courseId, currentWeek }: CourseContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';
  const [addingContent, setAddingContent] = useState(false);
  const [editingContent, setEditingContent] = useState<number | null>(null);

  // Fetch course content for the given course and week
  const { data: contentList, isLoading, error } = useQuery({
    queryKey: ['/api/contents/course', courseId, 'week', currentWeek],
  });

  // Initialize form
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      courseId,
      title: '',
      contentType: 'rich_text',
      content: '',
      week: currentWeek,
      order: 1,
    },
  });

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: async (data: ContentFormValues) => {
      const res = await apiRequest('POST', '/api/contents', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contents/course', courseId, 'week', currentWeek] });
      toast({
        title: 'Success',
        description: 'Course content created successfully',
      });
      setAddingContent(false);
      form.reset({
        courseId,
        title: '',
        contentType: 'rich_text',
        content: '',
        week: currentWeek,
        order: contentList?.length + 1 || 1,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create content',
        variant: 'destructive',
      });
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ContentFormValues }) => {
      const res = await apiRequest('PUT', `/api/contents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contents/course', courseId, 'week', currentWeek] });
      toast({
        title: 'Success',
        description: 'Course content updated successfully',
      });
      setEditingContent(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update content',
        variant: 'destructive',
      });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/contents/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contents/course', courseId, 'week', currentWeek] });
      toast({
        title: 'Success',
        description: 'Course content deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete content',
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: ContentFormValues) {
    if (editingContent) {
      updateContentMutation.mutateAsync({ id: editingContent, data: values });
    } else {
      createContentMutation.mutateAsync(values);
    }
  }

  function handleDelete(id: number) {
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteContentMutation.mutateAsync(id);
    }
  }

  function getContentIcon(type: string) {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'rich_text':
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  }

  function handleEdit(content: CourseContentType) {
    form.reset({
      courseId: content.courseId,
      title: content.title,
      contentType: content.contentType as any,
      content: content.content,
      week: content.week,
      order: content.order,
    });
    setEditingContent(content.id);
    setAddingContent(true);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load course content. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {(!contentList || contentList.length === 0) && (
        <div className="p-8 text-center bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-neutral-500">No content available for Week {currentWeek}</p>
          {isTrainer && (
            <Button 
              className="mt-4"
              onClick={() => {
                form.reset({
                  courseId,
                  title: '',
                  contentType: 'rich_text',
                  content: '',
                  week: currentWeek,
                  order: 1,
                });
                setEditingContent(null);
                setAddingContent(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          )}
        </div>
      )}

      {contentList && contentList.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Week {currentWeek} Content</h3>
            {isTrainer && (
              <Button 
                size="sm"
                onClick={() => {
                  form.reset({
                    courseId,
                    title: '',
                    contentType: 'rich_text',
                    content: '',
                    week: currentWeek,
                    order: contentList.length + 1,
                  });
                  setEditingContent(null);
                  setAddingContent(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            )}
          </div>

          <Accordion type="single" collapsible className="w-full">
            {contentList.map((content: CourseContentType) => (
              <AccordionItem key={content.id} value={`item-${content.id}`}>
                <AccordionTrigger className="hover:no-underline group">
                  <div className="flex items-center gap-3 text-left">
                    <div className={`
                      rounded-full p-2 
                      ${content.contentType === 'video' ? 'bg-blue-100 text-blue-600' : 
                        content.contentType === 'pdf' ? 'bg-red-100 text-red-600' : 
                        'bg-green-100 text-green-600'}
                    `}>
                      {getContentIcon(content.contentType)}
                    </div>
                    <div>
                      <h4 className="font-medium">{content.title}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {content.contentType}
                      </p>
                    </div>
                  </div>
                  {isTrainer && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(content);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(content.id);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  {content.contentType === 'rich_text' ? (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />
                  ) : content.contentType === 'video' ? (
                    <div className="aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={content.content}
                        title={content.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="p-4 bg-neutral-50 rounded-md">
                      <a 
                        href={content.content} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center p-4 border-2 border-dashed border-neutral-300 rounded-md hover:bg-neutral-100 transition-colors"
                      >
                        <FileText className="h-6 w-6 mr-2 text-neutral-500" />
                        <span className="text-primary-600 font-medium">View PDF Document</span>
                      </a>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}

      <Dialog open={addingContent} onOpenChange={setAddingContent}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingContent ? 'Edit Course Content' : 'Add New Course Content'}</DialogTitle>
            <DialogDescription>
              {editingContent ? 'Update the content details below.' : 'Enter the details for the new course content.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to JavaScript" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rich_text">Rich Text</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="Order (1, 2, 3...)" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch('contentType') === 'rich_text' 
                        ? 'Content' 
                        : form.watch('contentType') === 'video' 
                          ? 'Video URL' 
                          : 'PDF URL'}
                    </FormLabel>
                    <FormControl>
                      {form.watch('contentType') === 'rich_text' ? (
                        <Textarea 
                          placeholder="Enter the content in HTML format" 
                          {...field} 
                          rows={8}
                        />
                      ) : (
                        <Input 
                          placeholder={form.watch('contentType') === 'video' 
                            ? 'e.g., https://www.youtube.com/embed/dQw4w9WgXcQ' 
                            : 'e.g., https://example.com/document.pdf'} 
                          {...field} 
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddingContent(false);
                    setEditingContent(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createContentMutation.isPending || updateContentMutation.isPending}
                >
                  {(createContentMutation.isPending || updateContentMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingContent ? 'Update Content' : 'Add Content'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
