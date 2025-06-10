import PDFDocument from 'pdfkit';
import { Payment, SETTINGS_KEYS } from '@shared/schema';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

interface InvoiceData {
  payment: Payment;
  student: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    batch?: {
      name: string;
    }
  };
  organization: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    gstin?: string;
    logo?: string;
  };
}

// Helper function to format currency
function formatCurrency(amount: string | number): string {
  return `Rs. ${Number(amount).toFixed(2)}`;
}

export async function generateInvoice(data: InvoiceData): Promise<string> {
  const { payment, student, organization } = data;

  // Create a document
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'A4',
    info: {
      Title: `Invoice #${payment.id}`,
      Author: organization.name
    }
  });
  
  // Create a temp file path
  const tempFilePath = path.join(tmpdir(), `invoice-${payment.id}-${Date.now()}.pdf`);
  
  // Pipe its output to a file
  const stream = fs.createWriteStream(tempFilePath);
  doc.pipe(stream);

  // Document dimensions
  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  // Background color for the header area
  doc.rect(0, 0, pageWidth, 130).fill('#f0f7ff');
  
  // Add the organization logo if exists
  if (organization.logo) {
    try {
      // Get absolute file path - ensure we're looking from the project root
      const logoPath = path.resolve(process.cwd(), `.${organization.logo}`);
      
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin, 40, { width: 70 });
      } else {
        // Try alternative paths
        const altPath = path.resolve(process.cwd(), organization.logo.substring(1));
        
        if (fs.existsSync(altPath)) {
          doc.image(altPath, margin, 40, { width: 70 });
        } 
      }
    } catch (error) {
      console.error('Error adding logo to invoice:', error);
    }
  }
  
  // Add INVOICE title
  doc.font('Helvetica-Bold').fontSize(28).fillColor('#0066cc');
  doc.text('INVOICE', 400, 40);
  
  // Add invoice details
  doc.fillColor('#000000').font('Helvetica').fontSize(11);
  doc.text(`Invoice #: ${payment.id}`, 400, 80);
  
  doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 400, 95);
  
  doc.fillColor('#009900').font('Helvetica-Bold').fontSize(11);
  doc.text(`Payment Status: ${payment.status || 'Completed'}`, 400, 110);
  
  // Add organization name
  let yPos = 150;
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(16);
  doc.text(organization.name, margin, yPos);
  
  // Add organization info
  yPos += 20;
  doc.font('Helvetica').fontSize(10);
  doc.text(organization.address, margin, yPos);
  
  yPos += 15;
  doc.text(`Phone: ${organization.phone}`, margin, yPos);
  
  yPos += 15;
  doc.text(`Email: ${organization.email}`, margin, yPos);
  
  yPos += 15;
  if (organization.website) {
    doc.text(`Website: ${organization.website}`, margin, yPos);
    yPos += 15;
  }
  
  if (organization.gstin) {
    doc.fillColor('#0066cc');
    doc.text(`GSTIN: ${organization.gstin}`, margin, yPos);
    doc.fillColor('#000000');
    yPos += 15;
  }

  // Add a styled divider
  doc.strokeColor('#0066cc').lineWidth(1);
  doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).stroke();
  doc.strokeColor('#000000');

  // Bill To section
  yPos += 20;
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0066cc');
  doc.text('Bill To:', margin, yPos);
  
  // Add student details
  doc.fillColor('#000000');
  yPos += 20;
  
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text(student.name, margin, yPos);
  
  yPos += 15;
  doc.font('Helvetica').fontSize(10);
  doc.text(`ID: ${student.id}`, margin, yPos);
  
  yPos += 15;
  if (student.phone) {
    doc.text(`Phone: ${student.phone}`, margin, yPos);
    yPos += 15;
  }
  
  if (student.email) {
    doc.text(`Email: ${student.email}`, margin, yPos);
    yPos += 15;
  }
  
  if (student.batch?.name) {
    doc.text(`Batch: ${student.batch.name}`, margin, yPos);
    yPos += 15;
  }

  // Payment Details section
  yPos += 25; // Added more space before Payment Details heading
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0066cc');
  doc.text('Payment Details', margin, yPos);
  
  // Create table - column positions and widths with more space
  yPos += 30; // Increased from 25 to 30 for more space before table
  
  // Draw entire table header with more height
  doc.rect(margin, yPos, contentWidth, 30).fillAndStroke('#d6e9ff', '#0066cc'); // Increased height from 25 to 30
  
  // Add column headers with more space
  doc.fillColor('#000033').font('Helvetica-Bold').fontSize(10);
  doc.text('Description', margin + 10, yPos + 10); // Adjusted y position from +8 to +10
  doc.text('Amount', 480, yPos + 10); // Adjusted y position from +8 to +10
  
  // Add table row with increased spacing
  yPos += 40; // Increased from 25 to 40 for more space after header
  const paymentMethod = payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1).replace('_', ' ');
  
  doc.fillColor('#000000').font('Helvetica').fontSize(10);
  doc.text(`Fee Payment (${paymentMethod})`, margin + 10, yPos);
  
  doc.font('Helvetica-Bold');
  doc.text(formatCurrency(payment.amount), 480, yPos);
  
  // Add payment notes if available
  yPos += 25; // Increased from 20 to 25 for more space
  if (payment.notes) {
    doc.font('Helvetica').fontSize(10);
    doc.text(`Notes: ${payment.notes}`, margin, yPos);
    yPos += 25; // Increased from 20 to 25 for more space
  }
  
  // Add Total Amount section with more space
  yPos += 30; // Increased from 20 to 30 for more space
  const totalBoxWidth = 200;
  const totalBoxX = 345;
  
  // Draw total box with more height
  doc.rect(totalBoxX, yPos, totalBoxWidth, 35).fill('#d6e9ff'); // Increased height from 30 to 35
  
  // Add total amount text with adjusted positioning
  doc.fillColor('#000033').font('Helvetica-Bold').fontSize(12);
  doc.text('Total Amount:', totalBoxX + 10, yPos + 12); // Adjusted from +10 to +12
  doc.text(formatCurrency(payment.amount), 480, yPos + 12); // Adjusted from +10 to +12
  
  // Add next payment due date if available
  if (payment.nextPaymentDueDate) {
    yPos += 60; // Increased from 50 to 60 for more space
    doc.font('Helvetica').fontSize(10).fillColor('#0066cc');
    doc.text(`Next Payment Due: ${new Date(payment.nextPaymentDueDate).toLocaleDateString()}`, margin, yPos);
    doc.fillColor('#000000');
  }
  
  // Add Terms and Conditions section
  yPos += 50;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0066cc');
  doc.text('Terms & Conditions:', margin, yPos);
  doc.fillColor('#000000').font('Helvetica').fontSize(9);
  
  // Terms and conditions content with indentation
  yPos += 20;
  const terms = [
    '1. Payment is non-refundable once the course has started.',
    '2. This receipt is evidence of payment and must be presented for any payment-related queries.',
    '3. A late fee of 5% will be charged on payments received after the due date.',
    '4. Batch timings and schedules are subject to change with prior notification.',
    '5. Students are required to maintain 80% attendance to qualify for certification.',
    '6. All disputes are subject to jurisdiction of local courts only.'
  ];
  
  // Add each term on a new line
  let termsY = yPos;
  terms.forEach(term => {
    doc.text(term, margin, termsY);
    termsY += 15;
  });
  
  // Calculate footer position based on the last term's position
  // This ensures all content fits on a single page
  const footerY = Math.min(termsY + 30, 700); // Cap at 700 to prevent overflow
  
  // Add footer at dynamic position
  doc.rect(0, footerY, pageWidth, 112).fill('#f0f7ff');
  
  // Add footer text with center alignment
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Thank you for your business!', 297, footerY + 20, { align: 'center' });
  
  doc.fontSize(8).font('Helvetica');
  doc.text(`Generated on ${new Date().toLocaleString()}`, 297, footerY + 40, { align: 'center' });
  doc.text(`${organization.name} - ${organization.phone}`, 297, footerY + 55, { align: 'center' });

  // Finalize PDF file
  doc.end();
  
  // Return the path once the file is written
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(tempFilePath);
    });
    
    stream.on('error', (err) => {
      reject(err);
    });
  });
}

export async function generateInvoiceBuffer(data: InvoiceData): Promise<Buffer> {
  const { payment, student, organization } = data;
  
  // Create a document
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'A4',
    info: {
      Title: `Invoice #${payment.id}`,
      Author: organization.name
    }
  });
  
  // Collect the PDF data in memory
  const chunks: Buffer[] = [];
  
  doc.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });
  
  // Document dimensions
  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  // Background color for the header area
  doc.rect(0, 0, pageWidth, 130).fill('#f0f7ff');
  
  // Add the organization logo if exists
  if (organization.logo) {
    try {
      // Get absolute file path - ensure we're looking from the project root
      const logoPath = path.resolve(process.cwd(), `.${organization.logo}`);
      
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin, 40, { width: 70 });
      } else {
        // Try alternative paths
        const altPath = path.resolve(process.cwd(), organization.logo.substring(1));
        
        if (fs.existsSync(altPath)) {
          doc.image(altPath, margin, 40, { width: 70 });
        } 
      }
    } catch (error) {
      console.error('Error adding logo to invoice buffer:', error);
    }
  }
  
  // Add INVOICE title
  doc.font('Helvetica-Bold').fontSize(28).fillColor('#0066cc');
  doc.text('INVOICE', 400, 40);
  
  // Add invoice details
  doc.fillColor('#000000').font('Helvetica').fontSize(11);
  doc.text(`Invoice #: ${payment.id}`, 400, 80);
  
  doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 400, 95);
  
  doc.fillColor('#009900').font('Helvetica-Bold').fontSize(11);
  doc.text(`Payment Status: ${payment.status || 'Completed'}`, 400, 110);
  
  // Add organization name
  let yPos = 150;
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(16);
  doc.text(organization.name, margin, yPos);
  
  // Add organization info
  yPos += 20;
  doc.font('Helvetica').fontSize(10);
  doc.text(organization.address, margin, yPos);
  
  yPos += 15;
  doc.text(`Phone: ${organization.phone}`, margin, yPos);
  
  yPos += 15;
  doc.text(`Email: ${organization.email}`, margin, yPos);
  
  yPos += 15;
  if (organization.website) {
    doc.text(`Website: ${organization.website}`, margin, yPos);
    yPos += 15;
  }
  
  if (organization.gstin) {
    doc.fillColor('#0066cc');
    doc.text(`GSTIN: ${organization.gstin}`, margin, yPos);
    doc.fillColor('#000000');
    yPos += 15;
  }

  // Add a styled divider
  doc.strokeColor('#0066cc').lineWidth(1);
  doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).stroke();
  doc.strokeColor('#000000');

  // Bill To section
  yPos += 20;
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0066cc');
  doc.text('Bill To:', margin, yPos);
  
  // Add student details
  doc.fillColor('#000000');
  yPos += 20;
  
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text(student.name, margin, yPos);
  
  yPos += 15;
  doc.font('Helvetica').fontSize(10);
  doc.text(`ID: ${student.id}`, margin, yPos);
  
  yPos += 15;
  if (student.phone) {
    doc.text(`Phone: ${student.phone}`, margin, yPos);
    yPos += 15;
  }
  
  if (student.email) {
    doc.text(`Email: ${student.email}`, margin, yPos);
    yPos += 15;
  }
  
  if (student.batch?.name) {
    doc.text(`Batch: ${student.batch.name}`, margin, yPos);
    yPos += 15;
  }

  // Payment Details section
  yPos += 25; // Added more space before Payment Details heading
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0066cc');
  doc.text('Payment Details', margin, yPos);
  
  // Create table - column positions and widths with more space
  yPos += 30; // Increased from 25 to 30 for more space before table
  
  // Draw entire table header with more height
  doc.rect(margin, yPos, contentWidth, 30).fillAndStroke('#d6e9ff', '#0066cc'); // Increased height from 25 to 30
  
  // Add column headers with more space
  doc.fillColor('#000033').font('Helvetica-Bold').fontSize(10);
  doc.text('Description', margin + 10, yPos + 10); // Adjusted y position from +8 to +10
  doc.text('Amount', 480, yPos + 10); // Adjusted y position from +8 to +10
  
  // Add table row with increased spacing
  yPos += 40; // Increased from 25 to 40 for more space after header
  const paymentMethod = payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1).replace('_', ' ');
  
  doc.fillColor('#000000').font('Helvetica').fontSize(10);
  doc.text(`Fee Payment (${paymentMethod})`, margin + 10, yPos);
  
  doc.font('Helvetica-Bold');
  doc.text(formatCurrency(payment.amount), 480, yPos);
  
  // Add payment notes if available
  yPos += 25; // Increased from 20 to 25 for more space
  if (payment.notes) {
    doc.font('Helvetica').fontSize(10);
    doc.text(`Notes: ${payment.notes}`, margin, yPos);
    yPos += 25; // Increased from 20 to 25 for more space
  }
  
  // Add Total Amount section with more space
  yPos += 30; // Increased from 20 to 30 for more space
  const totalBoxWidth = 200;
  const totalBoxX = 345;
  
  // Draw total box with more height
  doc.rect(totalBoxX, yPos, totalBoxWidth, 35).fill('#d6e9ff'); // Increased height from 30 to 35
  
  // Add total amount text with adjusted positioning
  doc.fillColor('#000033').font('Helvetica-Bold').fontSize(12);
  doc.text('Total Amount:', totalBoxX + 10, yPos + 12); // Adjusted from +10 to +12
  doc.text(formatCurrency(payment.amount), 480, yPos + 12); // Adjusted from +10 to +12
  
  // Add next payment due date if available
  if (payment.nextPaymentDueDate) {
    yPos += 60; // Increased from 50 to 60 for more space
    doc.font('Helvetica').fontSize(10).fillColor('#0066cc');
    doc.text(`Next Payment Due: ${new Date(payment.nextPaymentDueDate).toLocaleDateString()}`, margin, yPos);
    doc.fillColor('#000000');
  }
  
  // Add Terms and Conditions section
  yPos += 50;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0066cc');
  doc.text('Terms & Conditions:', margin, yPos);
  doc.fillColor('#000000').font('Helvetica').fontSize(9);
  
  // Terms and conditions content with indentation
  yPos += 20;
  const terms = [
    '1. Payment is non-refundable once the course has started.',
    '2. This receipt is evidence of payment and must be presented for any payment-related queries.',
    '3. A late fee of 5% will be charged on payments received after the due date.',
    '4. Batch timings and schedules are subject to change with prior notification.',
    '5. Students are required to maintain 80% attendance to qualify for certification.',
    '6. All disputes are subject to jurisdiction of local courts only.'
  ];
  
  // Add each term on a new line
  let termsY = yPos;
  terms.forEach(term => {
    doc.text(term, margin, termsY);
    termsY += 15;
  });
  
  // Calculate footer position based on the last term's position
  // This ensures all content fits on a single page
  const footerY = Math.min(termsY + 30, 700); // Cap at 700 to prevent overflow
  
  // Add footer at dynamic position
  doc.rect(0, footerY, pageWidth, 112).fill('#f0f7ff');
  
  // Add footer text with center alignment
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Thank you for your business!', 297, footerY + 20, { align: 'center' });
  
  doc.fontSize(8).font('Helvetica');
  doc.text(`Generated on ${new Date().toLocaleString()}`, 297, footerY + 40, { align: 'center' });
  doc.text(`${organization.name} - ${organization.phone}`, 297, footerY + 55, { align: 'center' });

  // Finalize PDF file
  doc.end();
  
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    doc.on('error', (err: Error) => {
      reject(err);
    });
  });
}