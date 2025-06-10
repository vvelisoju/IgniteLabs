import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertBatchSchema, InsertBatch } from '@shared/schema';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BatchFormProps {
  batchId?: number;
  onSuccess?: () => void;
}

export default function BatchForm({ batchId, onSuccess }: BatchFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch trainers for dropdown
  const { data: trainers } = useQuery({
    queryKey: ['/api/users/trainers'],
  });

  // Fetch batch data if editing
  const { data: batchData, isLoading: isBatchLoading } = useQuery({
    queryKey: [`/api/batches/${batchId}`],
    enabled: !!batchId,
  });

  // Use the schema directly as it now properly handles both Date objects and string dates

  // Form setup
  const form = useForm<InsertBatch>({
    resolver: zodResolver(insertBatchSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      capacity: 20, // Default capacity
      fee: "10000", // Default fee amount as string
      trainer_id: undefined, // Using the correct field name from schema
      is_active: true,
    },
  });

  // Update form values when batch data is loaded
  useEffect(() => {
    if (batchData) {
      form.reset({
        ...batchData,
        start_date: batchData.start_date ? new Date(batchData.start_date) : new Date(),
        end_date: batchData.end_date ? new Date(batchData.end_date) : new Date(new Date().setMonth(new Date().getMonth() + 2)),
      });
    }
  }, [batchData, form]);

  // Create batch mutation with robust error handling
  const createBatchMutation = useMutation({
    mutationFn: async (data: InsertBatch) => {
      try {
        const res = await apiRequest('POST', '/api/batches', data);
        return await res.json();
      } catch (error) {
        // Return error info object instead of throwing
        return { 
          error: error instanceof Error ? error.message : 'Failed to create batch', 
          isError: true 
        };
      }
    }
  });

  // Update batch mutation with robust error handling
  const updateBatchMutation = useMutation({
    mutationFn: async (data: InsertBatch) => {
      try {
        const res = await apiRequest('PUT', `/api/batches/${batchId}`, data);
        return await res.json();
      } catch (error) {
        // Return error info object instead of throwing
        return { 
          error: error instanceof Error ? error.message : 'Failed to update batch', 
          isError: true 
        };
      }
    }
  });

  async function onSubmit(data: InsertBatch) {
    setIsLoading(true);
    try {
      // Ensure data has the fields required by the schema with correct naming
      const formattedData = {
        ...data,
        // No need to modify these fields as we've updated the form field names to match the schema
      };
      
      let result;
      if (batchId) {
        result = await updateBatchMutation.mutateAsync(formattedData);
      } else {
        result = await createBatchMutation.mutateAsync(formattedData);
      }
      
      // Check if response has an error
      if (result && 'isError' in result && result.isError) {
        toast({
          title: 'Error',
          description: result.error || 'An error occurred',
          variant: 'destructive',
        });
        return; // Don't proceed further on error
      }
      
      // Success case
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/batches/active'] });
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: [`/api/batches/${batchId}`] });
      }
      
      toast({
        title: 'Success',
        description: batchId ? 'Batch updated successfully' : 'Batch created successfully',
      });
      
      if (onSuccess) onSuccess();
      if (!batchId) form.reset(); // Only reset form for create operation
    } finally {
      setIsLoading(false);
    }
  }

  if (batchId && isBatchLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., JavaScript Fundamentals Batch 2023" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide a brief description of this batch" 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setDate(new Date().getDate() - 1))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setDate(new Date().getDate()))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Capacity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Number of students (e.g. 20)" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Fee</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="Fee amount (e.g. 10000)" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="trainer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned Trainer</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trainer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {trainers?.map((trainer: any) => (
                    <SelectItem key={trainer.id} value={trainer.id.toString()}>
                      {trainer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4 mt-1"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active Batch</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Only active batches will be visible to students and trainers
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {batchId ? 'Updating Batch...' : 'Creating Batch...'}
            </>
          ) : (
            batchId ? 'Update Batch' : 'Create Batch'
          )}
        </Button>
      </form>
    </Form>
  );
}
