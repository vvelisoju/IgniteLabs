import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type InvoiceDownloadButtonProps = {
  paymentId: number;
  label?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

export function InvoiceDownloadButton({ 
  paymentId, 
  label = 'Download Invoice', 
  size = 'sm', 
  variant = 'outline'
}: InvoiceDownloadButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Make a GET request to the invoice API with responseType blob
      const response = await fetch(`/api/invoices/${paymentId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to download invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleDownload}
      disabled={isLoading}
    >
      <Download className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
}

type ConsolidatedInvoiceButtonProps = {
  studentId: number;
  label?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

export function ConsolidatedInvoiceButton({ 
  studentId, 
  label = 'Download All Invoices', 
  size = 'sm', 
  variant = 'outline'
}: ConsolidatedInvoiceButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Make a GET request to the consolidated invoice API
      const response = await fetch(`/api/students/${studentId}/invoices/consolidated`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate consolidated invoice');
      }
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `consolidated-invoice-${studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Consolidated invoice downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading consolidated invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to download consolidated invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleDownload}
      disabled={isLoading}
    >
      <Download className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
}