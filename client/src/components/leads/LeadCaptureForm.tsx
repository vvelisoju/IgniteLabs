import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Form schema with validation
const leadFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  source: z.string().min(1, { message: "Please select how you found us" }),
  interestedIn: z.string().min(1, { message: "Please select an option" }),
  message: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadCaptureFormProps {
  formType: 'register' | 'apply' | 'bookCall' | 'infoSession' | 'contact';
  onSuccess?: () => void;
  onCancel?: () => void;
  extraData?: Record<string, any>; // Additional data like batch information
}

export function LeadCaptureForm({ formType, onSuccess, onCancel, extraData }: LeadCaptureFormProps) {
  const { toast } = useToast();
  
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      source: '',
      interestedIn: '',
      message: '',
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;

  // Get form title and button text based on form type and extraData
  const getFormConfig = () => {
    switch (formType) {
      case 'register':
        // If batch info is available, customize the form title and note
        if (extraData?.batchId && extraData?.batchName) {
          return {
            title: `Register for ${extraData.batchName}`,
            buttonText: 'Register Now',
            noteText: `Secure your spot in this batch starting ${extraData.batchStartDate ? new Date(extraData.batchStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'soon'}`,
          };
        }
        return {
          title: 'Register Your Interest',
          buttonText: 'Register Now',
          noteText: 'Secure your spot in our first batch',
        };
      case 'apply':
        return {
          title: 'Apply for First Batch',
          buttonText: 'Submit Application',
          noteText: 'Limited seats available with 20% early bird discount',
        };
      case 'bookCall':
        return {
          title: 'Schedule a Free Consultation',
          buttonText: 'Book Your Call',
          noteText: 'Our team will contact you to confirm the time',
        };
      case 'infoSession':
        return {
          title: 'Register for Info Session',
          buttonText: 'Confirm Registration',
          noteText: 'May 20, 2025 at 6:00 PM IST - Virtual Session',
        };
      case 'contact':
        return {
          title: 'Contact Us',
          buttonText: 'Submit',
          noteText: 'We\'ll get back to you shortly',
        };
      default:
        return {
          title: 'Contact Us',
          buttonText: 'Submit',
          noteText: 'We\'ll get back to you shortly',
        };
    }
  };

  const { title, buttonText, noteText } = getFormConfig();

  const onSubmit = async (data: LeadFormValues) => {
    try {
      // Add form type, status, and any extraData to the lead data
      const leadData = {
        ...data,
        formType,
        status: 'new', // Initial status is "new"
        notes: `Submitted via ${title} form on the landing page`,
        ...(extraData ? { batchInfo: extraData } : {}),
      };

      // Send API request
      const response = await apiRequest('POST', '/api/leads', leadData);

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Your information has been submitted successfully. We\'ll contact you soon.',
          variant: 'default',
        });
        
        // If there's a success callback, call it
        if (onSuccess) {
          onSuccess();
        }
        
        // Reset form
        form.reset();
      } else {
        throw new Error('Failed to submit your information');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast({
        title: 'Something went wrong',
        description: 'Failed to submit your information. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{noteText}</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="mb-2">
                <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} className="h-10" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="mb-2">
                <FormLabel className="text-sm font-medium">Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} className="h-10" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="mb-2">
                <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your phone number" {...field} className="h-10" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">How did you hear about us?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="search_engine">Search Engine</SelectItem>
                      <SelectItem value="friend_referral">Friend Referral</SelectItem>
                      <SelectItem value="advertisement">Advertisement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="interestedIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">I'm interested in</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="first_batch">Joining the First Batch</SelectItem>
                      <SelectItem value="fee_details">Learning about Fee Structure</SelectItem>
                      <SelectItem value="placement_info">Placement Information</SelectItem>
                      <SelectItem value="curriculum">Curriculum Details</SelectItem>
                      <SelectItem value="general_info">General Information</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="mb-3">
                <FormLabel className="text-sm font-medium">Message (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Any specific questions or comments?" {...field} className="h-10" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <div className="flex gap-2 pt-3">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                buttonText
              )}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                className="flex-shrink-0 border-primary/20 hover:bg-primary/5"
              >
                Cancel
              </Button>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">By submitting, you agree to our <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span></p>
        </form>
      </Form>
    </div>
  );
}