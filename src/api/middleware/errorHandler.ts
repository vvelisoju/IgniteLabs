import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error('Error occurred:', err);
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: err.errors 
    });
  }
  
  // Handle other known error types as needed
  
  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
};