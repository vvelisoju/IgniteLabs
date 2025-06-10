import { useAuth } from '@/lib/simplified-auth';
import StatCard from '@/components/dashboard/StatCard';
import BatchTable from '@/components/dashboard/BatchTable';
import AssignmentTable from '@/components/dashboard/AssignmentTable';
import ScheduleList from '@/components/dashboard/ScheduleList';
import TopStudents from '@/components/dashboard/TopStudents';
import { Users, BookOpen, FileText, BarChart2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const { user } = useAuth();

  // For demo purposes, we'll use mock stats
  // In a real app, this would be fetched from the API
  const stats = [
    {
      title: 'Active Batches',
      value: '3',
      description: '+1 this week',
      icon: <Users className="h-5 w-5" />,
      iconBgColor: 'bg-primary-100',
      iconTextColor: 'text-primary-600',
    },
    {
      title: 'Students',
      value: '78',
      description: '+12 this month',
      icon: <BookOpen className="h-5 w-5" />,
      iconBgColor: 'bg-secondary-100',
      iconTextColor: 'text-secondary-600',
    },
    {
      title: 'Assignments',
      value: '24',
      description: '8 pending review',
      icon: <FileText className="h-5 w-5" />,
      iconBgColor: 'bg-accent-100',
      iconTextColor: 'text-accent-500',
    },
    {
      title: 'Completion Rate',
      value: '87%',
      description: '↑ 4% vs last month',
      icon: <BarChart2 className="h-5 w-5" />,
      iconBgColor: 'bg-primary-100',
      iconTextColor: 'text-primary-600',
    },
  ];

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-800">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-neutral-500">Here's what's happening with your current batches.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            iconBgColor={stat.iconBgColor}
            iconTextColor={stat.iconTextColor}
          />
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Batches & Assignments Sections */}
        <div className="lg:col-span-2 space-y-6">
          <BatchTable />
          <AssignmentTable />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <ScheduleList />
          <TopStudents />
        </div>
      </div>
    </div>
  );
}
