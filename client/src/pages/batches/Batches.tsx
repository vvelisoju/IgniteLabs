import { useState } from 'react';
import { useAuth } from '@/lib/simplified-auth';
import BatchList from '@/components/batches/BatchList';
import BatchForm from '@/components/batches/BatchForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users } from 'lucide-react';

export default function Batches() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Batches</h1>
          <p className="text-neutral-500">Manage and view all training batches</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Batch
          </Button>
        )}
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Batches</TabsTrigger>
          <TabsTrigger value="all">All Batches</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <BatchList activeOnly={true} />
        </TabsContent>
        <TabsContent value="all">
          <BatchList activeOnly={false} />
        </TabsContent>
      </Tabs>

      {/* Create Batch Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new training batch
            </DialogDescription>
          </DialogHeader>
          <BatchForm onSuccess={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
