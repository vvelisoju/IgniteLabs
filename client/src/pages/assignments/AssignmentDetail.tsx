import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/simplified-auth';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Assignment, AssignmentSubmission } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ChevronLeft, AlertCircle, FileText, CalendarClock, Calendar, Users, Send, Check, ExternalLink, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Schema for assignment submission
const submitAssignmentSchema = z.object({
  codeSubmission: z.string().min(10, "Code must be at least 10 characters"),
  githubUrl: z.string().url("Please enter a valid GitHub URL").optional().or(z.literal('')),
});

// Schema for feedback submission
const feedbackSchema = z.object({
  feedback: z.string().min(10, "Feedback must be at least 10 characters"),
  grade: z.number().min(0).max(100),
  status: z.string(),
});

type SubmissionFormValues = z.infer<typeof submitAssignmentSchema>;
type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function AssignmentDetail() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [match, params] = useRoute('/assignments/:id');
  const assignmentId = params?.id ? parseInt(params.id) : null;
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  // Fetch assignment details
  const { data: assignment, isLoading, error } = useQuery({
    queryKey: ['/api/assignments', assignmentId],
    enabled: !!assignmentId,
  });

  // Fetch submissions for trainers or admin
  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ['/api/submissions/assignment', assignmentId],
    enabled: !!assignmentId && isTrainer,
  });

  // Fetch the student's own submission
  const { data: mySubmission, isLoading: isMySubmissionLoading } = useQuery({
    queryKey: ['/api/submissions/student', user?.id],
    enabled: !!assignmentId && !!user?.id && isStudent,
  });

  // Get due date status
  const getStatusInfo = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (daysLeft < 0) {
      return { label: 'Overdue', variant: 'destructive' as const, color: 'text-red-500' };
    } else if (daysLeft === 0) {
      return { label: 'Due Today', variant: 'warning' as const, color: 'text-amber-500' };
    } else if (daysLeft <= 2) {
      return { label: `Due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`, variant: 'warning' as const, color: 'text-amber-500' };
    } else {
      return { label: `Due in ${daysLeft} days`, variant: 'default' as const, color: 'text-green-500' };
    }
  };

  // Form for submitting assignments
  const submitForm = useForm<SubmissionFormValues>({
    resolver: zodResolver(submitAssignmentSchema),
    defaultValues: {
      codeSubmission: '',
      githubUrl: '',
    },
  });

  // Form for providing feedback
  const feedbackForm = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback: '',
      grade: 0,
      status: 'completed',
    },
  });

  // Submit assignment mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async (data: SubmissionFormValues) => {
      const submissionData = {
        assignmentId: assignmentId,
        studentId: user?.id,
        submittedAt: new Date(),
        codeSubmission: data.codeSubmission,
        githubUrl: data.githubUrl || undefined,
        status: 'pending',
      };
      const res = await apiRequest('/api/submissions', 'POST', submissionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/submissions/student', user?.id] });
      toast({
        title: 'Success',
        description: 'Assignment submitted successfully',
      });
      setIsSubmitDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit assignment',
        variant: 'destructive',
      });
    },
  });

  // Update submission with feedback mutation
  const updateSubmissionMutation = useMutation({
    mutationFn: async (data: FeedbackFormValues) => {
      const res = await apiRequest(`/api/submissions/${selectedSubmissionId}`, 'PUT', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/submissions/assignment', assignmentId] });
      toast({
        title: 'Success',
        description: 'Feedback submitted successfully',
      });
      setIsFeedbackDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit feedback',
        variant: 'destructive',
      });
    },
  });

  function handleSubmitAssignment(data: SubmissionFormValues) {
    submitAssignmentMutation.mutateAsync(data);
  }

  function handleSubmitFeedback(data: FeedbackFormValues) {
    updateSubmissionMutation.mutateAsync(data);
  }

  function openFeedbackDialog(submissionId: number, submission: AssignmentSubmission) {
    setSelectedSubmissionId(submissionId);
    feedbackForm.reset({
      feedback: submission.feedback || '',
      grade: submission.grade || 0,
      status: submission.status,
    });
    setIsFeedbackDialogOpen(true);
  }

  // Filter my submissions for this assignment
  const myAssignmentSubmission = mySubmission?.find((sub: AssignmentSubmission) => 
    sub.assignmentId === assignmentId
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Failed to load assignment details</p>
        <Link href="/assignments">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
        </Link>
      </div>
    );
  }

  const status = getStatusInfo(assignment.dueDate.toString());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assignments">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-800">{assignment.title}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-neutral-500">Week {assignment.week} Assignment</p>
          </div>
        </div>
        {isStudent && !myAssignmentSubmission && (
          <Button onClick={() => setIsSubmitDialogOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Submit Assignment
          </Button>
        )}
        {isStudent && myAssignmentSubmission && (
          <div className="flex items-center gap-2">
            <Badge variant={myAssignmentSubmission.status === 'completed' ? 'success' : myAssignmentSubmission.status === 'pending' ? 'secondary' : 'default'}>
              {myAssignmentSubmission.status.charAt(0).toUpperCase() + myAssignmentSubmission.status.slice(1)}
            </Badge>
            <Button onClick={() => setIsSubmitDialogOpen(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Update Submission
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assignment Description */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>{assignment.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Metadata */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-neutral-100">
                <div className="py-2 flex items-center gap-3">
                  <dt className="text-neutral-500">
                    <Calendar className="h-4 w-4" />
                  </dt>
                  <dd className="text-sm">
                    <span className="font-medium">Due Date:</span>{' '}
                    <span className={status.color}>{format(new Date(assignment.dueDate), 'MMMM d, yyyy')}</span>
                  </dd>
                </div>
                <div className="py-2 flex items-center gap-3">
                  <dt className="text-neutral-500">
                    <FileText className="h-4 w-4" />
                  </dt>
                  <dd className="text-sm">
                    <span className="font-medium">Week:</span> {assignment.week}
                  </dd>
                </div>
                <div className="py-2 flex items-center gap-3">
                  <dt className="text-neutral-500">
                    <Users className="h-4 w-4" />
                  </dt>
                  <dd className="text-sm">
                    <span className="font-medium">Batch:</span> {assignment.batchId}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submission Details or Submissions List for Trainers */}
      {isStudent && (
        <Card>
          <CardHeader>
            <CardTitle>My Submission</CardTitle>
            {myAssignmentSubmission && (
              <CardDescription>
                Submitted on {format(new Date(myAssignmentSubmission.submittedAt), 'MMMM d, yyyy')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isMySubmissionLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : myAssignmentSubmission ? (
              <div className="space-y-4">
                {myAssignmentSubmission.codeSubmission && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Code Submission</h3>
                    <div className="bg-neutral-900 text-neutral-100 p-4 rounded-md font-mono text-sm overflow-auto max-h-60">
                      <pre>{myAssignmentSubmission.codeSubmission}</pre>
                    </div>
                  </div>
                )}
                
                {myAssignmentSubmission.githubUrl && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">GitHub URL</h3>
                    <a 
                      href={myAssignmentSubmission.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 flex items-center hover:underline"
                    >
                      {myAssignmentSubmission.githubUrl}
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                )}

                {myAssignmentSubmission.feedback && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Trainer Feedback</h3>
                    <p className="text-sm">{myAssignmentSubmission.feedback}</p>
                    
                    {myAssignmentSubmission.grade && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Grade</span>
                          <span className="text-sm font-medium">{myAssignmentSubmission.grade}/100</span>
                        </div>
                        <Progress value={myAssignmentSubmission.grade} className="h-2" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 bg-neutral-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-500">You haven't submitted this assignment yet.</p>
                <Button 
                  onClick={() => setIsSubmitDialogOpen(true)} 
                  className="mt-4"
                >
                  Submit Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isTrainer && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Submissions</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmissionsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : submissions && submissions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left font-medium text-sm">Student</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Submitted</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Status</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Grade</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {submissions.map((submission: AssignmentSubmission) => (
                          <tr key={submission.id}>
                            <td className="py-3 px-4">Student #{submission.studentId}</td>
                            <td className="py-3 px-4">{format(new Date(submission.submittedAt), 'MMM d, yyyy')}</td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                submission.status === 'completed' ? 'success' : 
                                submission.status === 'pending' ? 'secondary' : 
                                'default'
                              }>
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">{submission.grade || '-'}</td>
                            <td className="py-3 px-4">
                              <Button 
                                size="sm" 
                                onClick={() => openFeedbackDialog(submission.id, submission)}
                              >
                                {submission.feedback ? 'Update Feedback' : 'Give Feedback'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-neutral-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-500">No submissions yet for this assignment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmissionsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : submissions?.filter((s: AssignmentSubmission) => s.status === 'pending').length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left font-medium text-sm">Student</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Submitted</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {submissions
                          .filter((s: AssignmentSubmission) => s.status === 'pending')
                          .map((submission: AssignmentSubmission) => (
                            <tr key={submission.id}>
                              <td className="py-3 px-4">Student #{submission.studentId}</td>
                              <td className="py-3 px-4">{format(new Date(submission.submittedAt), 'MMM d, yyyy')}</td>
                              <td className="py-3 px-4">
                                <Button 
                                  size="sm" 
                                  onClick={() => openFeedbackDialog(submission.id, submission)}
                                >
                                  Review
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-neutral-50 rounded-lg">
                    <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-neutral-500">No pending submissions to review.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmissionsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : submissions?.filter((s: AssignmentSubmission) => s.status === 'completed').length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 text-left font-medium text-sm">Student</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Submitted</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Grade</th>
                          <th className="py-3 px-4 text-left font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {submissions
                          .filter((s: AssignmentSubmission) => s.status === 'completed')
                          .map((submission: AssignmentSubmission) => (
                            <tr key={submission.id}>
                              <td className="py-3 px-4">Student #{submission.studentId}</td>
                              <td className="py-3 px-4">{format(new Date(submission.submittedAt), 'MMM d, yyyy')}</td>
                              <td className="py-3 px-4">{submission.grade || '-'}/100</td>
                              <td className="py-3 px-4">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => openFeedbackDialog(submission.id, submission)}
                                >
                                  Update
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-neutral-50 rounded-lg">
                    <p className="text-neutral-500">No completed submissions yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Submit Assignment Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{myAssignmentSubmission ? 'Update Submission' : 'Submit Assignment'}</DialogTitle>
            <DialogDescription>
              {myAssignmentSubmission 
                ? 'Update your submission for this assignment' 
                : 'Submit your work for this assignment'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...submitForm}>
            <form onSubmit={submitForm.handleSubmit(handleSubmitAssignment)} className="space-y-4">
              <FormField
                control={submitForm.control}
                name="codeSubmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code Solution</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste your code solution here..." 
                        className="font-mono"
                        rows={10}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={submitForm.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://github.com/yourusername/your-repo" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubmitDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitAssignmentMutation.isPending}
                >
                  {submitAssignmentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {myAssignmentSubmission ? 'Update Submission' : 'Submit Assignment'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Review the submission and provide feedback to the student
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmissionId && (
            <Form {...feedbackForm}>
              <form onSubmit={feedbackForm.handleSubmit(handleSubmitFeedback)} className="space-y-4">
                <FormField
                  control={feedbackForm.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide detailed feedback to the student..." 
                          rows={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={feedbackForm.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade (0-100)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          max="100"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={feedbackForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          {...field}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFeedbackDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateSubmissionMutation.isPending}
                  >
                    {updateSubmissionMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Feedback
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
