import { User as SchemaUser } from '../../shared/schema';

declare global {
  namespace Express {
    // Extend the Request interface
    interface Request {
      user?: SchemaUser;
    }
    
    // Extend the User interface to match our schema
    interface User extends SchemaUser {}
  }
}

// This is needed to make the file a module
export {};