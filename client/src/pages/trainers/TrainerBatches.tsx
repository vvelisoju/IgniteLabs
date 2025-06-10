import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TrainerBatchesView } from '@/components/trainers/TrainerBatchesView';

export default function TrainerBatchesPage() {
  const { trainerId } = useParams<{ trainerId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!trainerId || isNaN(parseInt(trainerId))) {
      toast({
        title: 'Invalid Trainer ID',
        description: 'The trainer ID provided is invalid. Redirecting to trainers list.',
        variant: 'destructive',
      });
      navigate('/trainers');
    }
  }, [trainerId, navigate, toast]);
  
  if (!trainerId || isNaN(parseInt(trainerId))) {
    return null; // Will redirect via useEffect
  }
  
  const trainerIdNumber = parseInt(trainerId);
  
  return (
    <>
      <Helmet>
        <title>Trainer Batches - Ignite Labs</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        {!trainerIdNumber ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading...</span>
          </div>
        ) : (
          <TrainerBatchesView trainerId={trainerIdNumber} />
        )}
      </div>
    </>
  );
}