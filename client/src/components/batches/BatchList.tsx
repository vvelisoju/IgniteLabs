import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Batch } from '@shared/schema';
import { format } from 'date-fns';
import { Loader2, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/simplified-auth';

interface BatchListProps {
  activeOnly?: boolean;
}

export default function BatchList({ activeOnly = false }: BatchListProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTrainer = user?.role === 'trainer';

  const { data: batches, isLoading, error } = useQuery({
    queryKey: ['/api/batches'],
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
        <p className="text-red-500">Failed to load batches</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-500">No batches found</p>
        {isAdmin && (
          <Link href="/batches/new">
            <Button className="mt-4">Create Batch</Button>
          </Link>
        )}
      </div>
    );
  }

  // Function to get color based on batch ID (for variety)
  const getBatchColor = (id: number) => {
    const colors = [
      'bg-primary-100 text-primary-800',
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[id % colors.length];
  };

  // Filter batches if needed
  const filteredBatches = activeOnly 
    ? batches.filter((batch: Batch) => batch.is_active !== undefined ? batch.is_active : batch.isActive)
    : batches;

  // For trainers, only show their assigned batches
  const displayBatches = isTrainer && !isAdmin
    ? filteredBatches.filter((batch: Batch) => {
        const trainerId = batch.trainer_id !== undefined ? batch.trainer_id : batch.trainerId;
        return trainerId === user.id;
      })
    : filteredBatches;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayBatches.map((batch: any) => {
        // Access the properties using the correct snake_case as they come from the API
        // or use optional chaining to handle both formats
        const startDate = new Date(batch.start_date || batch.startDate);
        const endDate = new Date(batch.end_date || batch.endDate);
        const isActive = batch.is_active !== undefined ? batch.is_active : batch.isActive;
        const today = new Date();
        
        // Safe calculation with date validation
        let totalDays = 90; // Default fallback
        let daysPassed = 0;
        let progress = 0;
        let weekNumber = 1;
        let totalWeeks = 12;
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          totalDays = Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)), 1);
          daysPassed = Math.max(Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24)), 0);
          progress = Math.min(Math.max(Math.floor((daysPassed / totalDays) * 100), 0), 100);
          weekNumber = Math.max(Math.ceil(daysPassed / 7), 1);
          totalWeeks = Math.max(Math.ceil(totalDays / 7), 1);
        }
        
        // Generate initials for the batch
        const initials = batch.name
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
        
        return (
          <Card key={batch.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className={`flex-shrink-0 h-10 w-10 rounded ${getBatchColor(batch.id).split(' ')[0]} flex items-center justify-center ${getBatchColor(batch.id).split(' ')[1]} font-bold`}>
                  {initials}
                </div>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardTitle className="mt-2">{batch.name}</CardTitle>
              <CardDescription className="line-clamp-2">{batch.description || 'No description provided'}</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-neutral-500 mb-1">Progress</div>
                  <div className="w-full bg-neutral-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary-600 h-2.5 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs mt-1 text-neutral-500 flex justify-between">
                    <span>Week {weekNumber} of {totalWeeks}</span>
                    <span>{progress}% Complete</span>
                  </div>
                </div>
                
                <div className="flex space-x-4 text-sm text-neutral-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {(() => {
                        try {
                          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            return 'Date information unavailable';
                          }
                          return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
                        } catch (e) {
                          console.error('Date formatting error:', e);
                          return 'Date information unavailable';
                        }
                      })()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-neutral-600">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{batch.capacity || 28} Students</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-4">
              <Link href={`/batches/${batch.id}`} className="w-full">
                <Button variant="outline" className="w-full">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
