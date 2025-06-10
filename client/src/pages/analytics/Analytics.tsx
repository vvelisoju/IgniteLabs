import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/simplified-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Loader2, BarChart2, PieChart as PieChartIcon, TrendingUp, Users, FileText, CheckCircle, Clock } from 'lucide-react';

// Mock data for demo purposes
const batchCompletionData = [
  { name: 'Week 1', completion: 95 },
  { name: 'Week 2', completion: 88 },
  { name: 'Week 3', completion: 76 },
  { name: 'Week 4', completion: 82 },
  { name: 'Week 5', completion: 65 },
  { name: 'Week 6', completion: 50 },
  { name: 'Week 7', completion: 30 },
  { name: 'Week 8', completion: 10 },
];

const assignmentStatusData = [
  { name: 'Completed', value: 63, color: '#4caf50' },
  { name: 'In Progress', value: 27, color: '#ff9800' },
  { name: 'Not Started', value: 10, color: '#f44336' },
];

const studentProgressData = [
  { name: 'Week 1', avgGrade: 92 },
  { name: 'Week 2', avgGrade: 88 },
  { name: 'Week 3', avgGrade: 84 },
  { name: 'Week 4', avgGrade: 89 },
  { name: 'Week 5', avgGrade: 76 },
  { name: 'Week 6', avgGrade: 0 },
  { name: 'Week 7', avgGrade: 0 },
  { name: 'Week 8', avgGrade: 0 },
];

const topPerformersData = [
  { id: 1, name: 'Alex Kim', score: 95 },
  { id: 2, name: 'Maya Johnson', score: 92 },
  { id: 3, name: 'Tyler Patel', score: 89 },
  { id: 4, name: 'Sarah Lee', score: 87 },
  { id: 5, name: 'Jason Miller', score: 84 },
];

export default function Analytics() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const [selectedBatch, setSelectedBatch] = useState<string>("1");
  
  // Fetch batches
  const { data: batches, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['/api/batches'],
  });
  
  // Fetch batch analytics (would use the actual batch ID in a real app)
  const { data: batchAnalytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['/api/analytics/batch', parseInt(selectedBatch)],
    enabled: !!selectedBatch,
  });
  
  // For students, fetch their personal analytics
  const { data: studentAnalytics, isLoading: isStudentAnalyticsLoading } = useQuery({
    queryKey: ['/api/analytics/student', user?.id],
    enabled: isStudent && !!user?.id,
  });

  function handleBatchChange(value: string) {
    setSelectedBatch(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Analytics Dashboard</h1>
          <p className="text-neutral-500">
            {isAdmin 
              ? 'Overview of all batches and student performance' 
              : isTrainer 
                ? 'Analytics for your training batches' 
                : 'Your learning progress and performance'}
          </p>
        </div>
        
        {/* Batch Selector for Trainers/Admins */}
        {(isTrainer || isAdmin) && (
          <div className="w-64">
            <Select
              value={selectedBatch}
              onValueChange={handleBatchChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {isBatchesLoading ? (
                  <div className="flex justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : Array.isArray(batches) ? batches.map((batch: any) => (
                  <SelectItem key={batch.id} value={batch.id.toString()}>
                    {batch.name}
                  </SelectItem>
                )) : (
                  <SelectItem value="1">Default Batch</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Different views based on role */}
      {(isTrainer || isAdmin) ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isAnalyticsLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : '28'}
                  </div>
                  <p className="text-xs text-muted-foreground">+2 from last week</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">8 pending review</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">↑ 4% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">84/100</div>
                  <p className="text-xs text-muted-foreground">↑ 2 points from Week 4</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Course Completion Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Course Completion By Week</CardTitle>
                <CardDescription>
                  Weekly completion rate for the current batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={batchCompletionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completion" fill="#3f51b5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Average Grades Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Status</CardTitle>
                  <CardDescription>
                    Current status of all assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assignmentStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {assignmentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Average Grades By Week</CardTitle>
                  <CardDescription>
                    Student performance over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={studentProgressData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="avgGrade" stroke="#3f51b5" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Analytics</CardTitle>
                <CardDescription>
                  Detailed metrics on assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-neutral-500">
                  This section will contain detailed analytics about assignments, including completion rates, average scores, and problem areas.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Top Performing Students</CardTitle>
                <CardDescription>
                  Students with the highest overall scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformersData.map((student) => (
                    <div key={student.id} className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-neutral-900">{student.name}</p>
                          <p className="text-sm text-neutral-500">{student.score}%</p>
                        </div>
                        <div className="mt-1 w-full bg-neutral-200 rounded-full h-1.5">
                          <div 
                            className="bg-primary-600 h-1.5 rounded-full" 
                            style={{ width: `${student.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Student Engagement</CardTitle>
                <CardDescription>
                  Participation and interaction metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-neutral-500">
                  Student engagement metrics will be displayed here, including login frequency, time spent on platform, and participation in discussions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Student view
        <div className="space-y-6">
          {/* Student Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">3 pending submission</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">82%</div>
                <p className="text-xs text-muted-foreground">↑ 5% from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87/100</div>
                <p className="text-xs text-muted-foreground">Above batch average</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42 hrs</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Student Progress Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Course Progress</CardTitle>
              <CardDescription>
                Weekly progress through the curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batchCompletionData.map((week) => (
                  <div key={week.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{week.name}</span>
                      <span>{week.completion}%</span>
                    </div>
                    <Progress value={week.completion} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Performance over time */}
          <Card>
            <CardHeader>
              <CardTitle>Your Performance Over Time</CardTitle>
              <CardDescription>
                Assignment scores by week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={studentProgressData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgGrade" stroke="#3f51b5" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
