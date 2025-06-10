import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Pencil, 
  Trash2, 
  MoreHorizontal, 
  Eye, 
  BookOpen,
  CheckCircle,
  XCircle,
  Search,
  UserCheck
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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

interface TrainerListProps {
  onEdit: (trainer: Trainer) => void;
  onDelete: (trainer: Trainer) => void;
  onViewBatches: (trainer: Trainer) => void;
}

export function TrainerList({ onEdit, onDelete, onViewBatches }: TrainerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const {
    data: trainers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/users/trainers'],
    queryFn: async () => {
      const response = await fetch('/api/users/trainers');
      if (!response.ok) {
        throw new Error('Failed to fetch trainers');
      }
      return await response.json() as Trainer[];
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to load trainers: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const filteredTrainers = trainers.filter((trainer) => {
    return (
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="border rounded-md">
          <div className="p-4 border-b">
            <Skeleton className="h-8 w-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b">
              <div className="grid grid-cols-5 gap-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-1/4 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Trainers</CardTitle>
          <CardDescription>
            There was a problem loading the trainers information. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            <UserCheck className="h-4 w-4 mr-1" />
            <span>Total: {trainers.length}</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            <span>Active: {trainers.filter(t => t.status === 'active').length}</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <XCircle className="h-4 w-4 mr-1 text-red-500" />
            <span>Inactive: {trainers.filter(t => t.status === 'inactive').length}</span>
          </Badge>
        </div>
      </div>

      {filteredTrainers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-2">
              {searchTerm ? 'No trainers match your search criteria' : 'No trainers found'}
            </p>
            {searchTerm && (
              <Button 
                variant="ghost" 
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrainers.map((trainer) => (
                <TableRow key={trainer.id}>
                  <TableCell className="font-medium">{trainer.name}</TableCell>
                  <TableCell>{trainer.email}</TableCell>
                  <TableCell>{trainer.phone}</TableCell>
                  <TableCell>{trainer.specialization}</TableCell>
                  <TableCell>
                    <Badge
                      variant={trainer.status === 'active' ? 'default' : 'destructive'}
                    >
                      {trainer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewBatches(trainer)}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>View Batches</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(trainer)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDelete(trainer)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}