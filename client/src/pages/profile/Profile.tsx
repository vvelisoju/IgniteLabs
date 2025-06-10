import { useState } from 'react';
import { useAuth } from '@/lib/simplified-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Lock, Mail, Calendar, BookOpen, CheckCircle2 } from 'lucide-react';

// Profile update schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Mock achievements for demo
  const achievements = [
    { id: 1, title: "First Assignment", description: "Completed your first assignment", date: "May 15, 2023", icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
    { id: 2, title: "Perfect Score", description: "Received 100% on an assignment", date: "May 22, 2023", icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
    { id: 3, title: "Consistent Learner", description: "Logged in for 7 consecutive days", date: "May 29, 2023", icon: <Calendar className="h-5 w-5 text-blue-500" /> },
    { id: 4, title: "Code Master", description: "Solved a complex coding challenge", date: "June 5, 2023", icon: <BookOpen className="h-5 w-5 text-purple-500" /> },
  ];

  // Initialize profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Initialize password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle profile update
  async function onUpdateProfile(data: ProfileFormValues) {
    setIsUpdating(true);
    try {
      // Simulating an API call for the demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle password change
  async function onChangePassword(data: PasswordFormValues) {
    setIsChangingPassword(true);
    try {
      // Simulating an API call for the demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">Profile</h1>
        <p className="text-neutral-500">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback className="bg-primary-100 text-primary-700 text-2xl">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-sm">Username: {user.username}</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="text-sm">
                  {user.role === 'student' 
                    ? `Batch ID: ${user.batchId || 'Not assigned'}` 
                    : user.role === 'trainer' 
                      ? 'Teaching 3 batches'
                      : 'Managing all batches'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <div className="space-y-6">
                {/* Profile Information Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="submit"
                          disabled={isUpdating}
                        >
                          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                {/* Change Password Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to secure your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="submit"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Change Password
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle>Your Achievements</CardTitle>
                  <CardDescription>
                    Track your progress and accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {achievements.map(achievement => (
                      <div key={achievement.id} className="flex items-start">
                        <div className="mr-3 mt-0.5">
                          {achievement.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">{achievement.title}</h3>
                          <p className="text-sm text-neutral-500">{achievement.description}</p>
                          <p className="text-xs text-neutral-400 mt-1">Achieved on {achievement.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <Button variant="outline" className="w-full">View All Achievements</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Email Notifications</h3>
                        <p className="text-sm text-neutral-500">Receive notifications via email</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        defaultChecked
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Assignment Reminders</h3>
                        <p className="text-sm text-neutral-500">Get reminders about upcoming assignments</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        defaultChecked
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Feedback Alerts</h3>
                        <p className="text-sm text-neutral-500">Be notified when trainers provide feedback</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        defaultChecked
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Course Updates</h3>
                        <p className="text-sm text-neutral-500">Get alerts when new course content is available</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        defaultChecked
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <Button className="w-full">Save Preferences</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
