import React, { useEffect, useState } from "react";
import { Calendar, Users, Clock, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { LeadCaptureDialog } from "../leads/LeadCaptureDialog";

// Define the batch type
interface Batch {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  capacity: number;
  fee: string;
  isActive: boolean;
  trainerName?: string;
  trainerSpecialization?: string;
}

export default function UpcomingBatchesSection() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBatches() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/batches/upcoming");
        
        if (!response.ok) {
          throw new Error("Failed to fetch upcoming batches");
        }
        
        const data = await response.json();
        setBatches(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching batches:", err);
        setError("Unable to load upcoming batches. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBatches();
  }, []);
  
  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency (assuming fee is stored as a string representing a decimal number)
  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white" id="upcoming-batches">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Batches</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select and register for one of our upcoming batches to start your journey to becoming a professional developer.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg overflow-hidden shadow-sm">
                <div className="p-6">
                  <Skeleton className="h-7 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white" id="upcoming-batches">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Batches</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // If no batches are available
  if (batches.length === 0) {
    return (
      <section className="py-16 bg-white" id="upcoming-batches">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Batches</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Registration for our next batch will open soon. Please check back later or leave your contact details to be notified when new batches are available.
            </p>
            <div className="mt-8">
              <LeadCaptureDialog 
                buttonText="Get Notified About New Batches" 
                formType="register"
                buttonVariant="default"
                buttonIcon={<ChevronRight className="ml-1 h-4 w-4" />}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white" id="upcoming-batches">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Batches</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select and register for one of our upcoming batches to start your journey to becoming a professional developer.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div key={batch.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{batch.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {batch.description || "Full Stack Development training with hands-on projects and personalized mentorship."}
                </p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      <span className="font-medium">Starts:</span> {formatDate(batch.startDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      <span className="font-medium">Duration:</span> {Math.ceil((new Date(batch.endDate).getTime() - new Date(batch.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))} weeks
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      <span className="font-medium">Capacity:</span> {batch.capacity} students
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      <span className="font-medium">Trainer:</span> {batch.trainerName || "To be announced"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="text-primary font-bold">
                    {formatCurrency(batch.fee)}
                  </div>
                  <LeadCaptureDialog 
                    buttonText="Register" 
                    formType="register"
                    buttonVariant="default"
                    buttonClassName="px-4"
                    extraData={{
                      batchId: batch.id,
                      batchName: batch.name,
                      batchStartDate: batch.startDate
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}