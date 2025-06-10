import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import {
  UserPlus,
  Settings,
  Trash2,
  Eye,
  Search,
  Mail,
  Phone,
  MoreHorizontal,
  Loader2,
  Tag,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TrainerForm } from '@/components/trainers/TrainerForm';

interface Trainer {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  bio: string;
  status: 'active' | 'inactive';
}

export default function TrainersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState<Trainer | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: trainers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/users/trainers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users/trainers');
      if (!response.ok) {
        throw new Error('Failed to fetch trainers');
      }
      return await response.json() as Trainer[];
    },
    refetchOnMount: true, // Ensure we refresh data when component mounts
    refetchOnWindowFocus: true, // Refresh data when window gets focus
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to load trainers: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteTrainerMutation = useMutation({
    mutationFn: async (trainerId: number) => {
      const response = await apiRequest('DELETE', `/api/trainers/${trainerId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete trainer');
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Trainer has been deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/trainers'] });
      setIsDeleteDialogOpen(false);
      setTrainerToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredTrainers = trainers.filter(trainer => {
    return (
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEdit = async (trainer: Trainer) => {
    try {
      // Fetch the full trainer details to ensure we have the most up-to-date data
      const response = await apiRequest('GET', `/api/trainers/${trainer.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trainer details');
      }
      const trainerData = await response.json();
      setSelectedTrainer(trainerData);
      setIsFormOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load trainer details',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (trainer: Trainer) => {
    setTrainerToDelete(trainer);
    setIsDeleteDialogOpen(true);
  };

  const handleViewBatches = (trainer: Trainer) => {
    navigate(`/trainers/${trainer.id}/batches`);
  };

  const confirmDelete = async () => {
    if (trainerToDelete) {
      deleteTrainerMutation.mutate(trainerToDelete.id);
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Trainers - Ignite Labs</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
            <p className="text-muted-foreground">
              Manage trainers and their assigned batches
            </p>
          </div>
          <Button onClick={() => {
            setSelectedTrainer(undefined);
            setIsFormOpen(true);
          }}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Trainer
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trainers by name, email, specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading trainers...</span>
          </div>
        ) : error ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Error Loading Trainers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was a problem loading the trainers. Please try again later.</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/users/trainers'] })}
                className="mt-4"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredTrainers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="rounded-full bg-muted p-3 mb-3">
                <UserPlus className="w-6 h-6 text-muted-foreground" />
              </div>
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-medium mb-2">No trainers found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    No trainers match your search for "{searchTerm}"
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">No trainers yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Get started by adding your first trainer
                  </p>
                  <Button onClick={() => {
                    setSelectedTrainer(undefined);
                    setIsFormOpen(true);
                  }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Trainer
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrainers.map((trainer) => (
                    <TableRow key={trainer.id}>
                      <TableCell className="font-medium">{trainer.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            {trainer.email}
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            {trainer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          {trainer.specialization}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={trainer.status === 'active' ? 'default' : 'destructive'}
                          className="capitalize"
                        >
                          {trainer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewBatches(trainer)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Batches
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(trainer)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(trainer)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <TrainerForm
          trainer={selectedTrainer}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete this trainer and cannot be undone.
                This may affect batches assigned to this trainer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground"
                disabled={deleteTrainerMutation.isPending}
              >
                {deleteTrainerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Trainer'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </HelmetProvider>
  );
}