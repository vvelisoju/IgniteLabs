import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CalendarRange,
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Tag,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Trainer {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  bio: string;
  status: 'active' | 'inactive';
}

interface Batch {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  trainerId: number;
  capacity: number;
  studentCount?: number;
}

type TrainerBatchesViewProps = {
  trainerId: number;
};

export function TrainerBatchesView({ trainerId }: TrainerBatchesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: trainer, isLoading: isTrainerLoading } = useQuery({
    queryKey: ['/api/trainers', trainerId],
    queryFn: async () => {
      const response = await fetch(`/api/trainers/${trainerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trainer details');
      }
      return await response.json() as Trainer;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to load trainer: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const {
    data: batches = [],
    isLoading: isBatchesLoading,
    error,
  } = useQuery({
    queryKey: ['/api/trainers', trainerId, 'batches'],
    queryFn: async () => {
      const response = await fetch(`/api/trainers/${trainerId}/batches`);
      if (!response.ok) {
        throw new Error('Failed to fetch trainer batches');
      }
      return await response.json() as Batch[];
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to load batches: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const filteredBatches = batches.filter((batch) => {
    return (
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isTrainerLoading || isBatchesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          <CardDescription>
            There was a problem loading the trainer or batch information. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate('/trainers')} 
            variant="outline"
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Trainers
          </Button>
          <Button 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/trainers')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">
              Batches for {trainer.name}
            </h1>
            <Badge
              variant={trainer.status === 'active' ? 'default' : 'destructive'}
              className="ml-2"
            >
              {trainer.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            <Tag className="h-4 w-4 inline mr-1" />
            {trainer.specialization}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => navigate('/batches/new')} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Batch
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trainer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Contact Information:</h3>
            <p className="text-sm mt-1">Email: {trainer.email}</p>
            <p className="text-sm">Phone: {trainer.phone}</p>
          </div>
          <div>
            <h3 className="font-semibold">Bio:</h3>
            <p className="text-sm mt-1">{trainer.bio}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.length > 0 ? (
          filteredBatches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))
        ) : (
          <Card className="col-span-full py-6">
            <CardContent className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-lg font-medium mb-2">No Batches Found</p>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'No batches match your search criteria'
                  : 'No batches have been assigned to this trainer yet'}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                  className="mx-auto"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function BatchCard({ batch }: { batch: Batch }) {
  const [, navigate] = useLocation();
  
  // Format the dates
  const startDate = new Date(batch.startDate);
  const endDate = new Date(batch.endDate);
  const formattedStartDate = format(startDate, 'MMM d, yyyy');
  const formattedEndDate = format(endDate, 'MMM d, yyyy');
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{batch.name}</CardTitle>
          <BatchStatusBadge status={batch.status} />
        </div>
        <CardDescription>
          <div className="flex items-center mt-1">
            <CalendarRange className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>
              {formattedStartDate} - {formattedEndDate}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm mb-4">{batch.description}</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-sm">
              {batch.studentCount ?? 0}/{batch.capacity} Students
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/batches/${batch.id}`)}
        >
          <BookOpen className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

function BatchStatusBadge({ status }: { status: string }) {
  let variant: 
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline' = 'default';
  
  let icon = <Clock className="h-3 w-3 mr-1" />;
  
  switch (status) {
    case 'upcoming':
      variant = 'outline';
      break;
    case 'ongoing':
      variant = 'default';
      break;
    case 'completed':
      variant = 'secondary';
      break;
    case 'cancelled':
      variant = 'destructive';
      icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      break;
  }
  
  return (
    <Badge variant={variant} className="capitalize">
      {icon}
      {status}
    </Badge>
  );
}