import { storage } from '../storage';

// Function to get the current week number for a batch
export const getCurrentBatchWeek = (startDate: Date): number => {
  const now = new Date();
  const start = new Date(startDate);
  
  // Calculate the difference in milliseconds
  const diffTime = Math.abs(now.getTime() - start.getTime());
  
  // Convert to days and then to weeks (rounded down)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;
  
  return weekNumber;
};

// Function to unlock course content based on the batch week
export const unlockWeeklyContent = async () => {
  try {
    console.log('Running weekly content unlock job...');
    
    // Get all active batches
    const activeBatches = await storage.getActiveBatches();
    
    for (const batch of activeBatches) {
      // Calculate which week the batch is currently in
      const currentWeek = getCurrentBatchWeek(batch.startDate);
      
      console.log(`Batch ${batch.id} (${batch.name}) is in week ${currentWeek}`);
      
      // Get all students in the batch
      const students = await storage.getUsersByBatch(batch.id);
      
      // Logic to unlock content for the current week would be implemented here
      // This would involve updating course progress records or similar
      
      console.log(`Unlocked week ${currentWeek} content for ${students.length} students in batch ${batch.id}`);
    }
    
    console.log('Weekly content unlock job completed');
  } catch (error) {
    console.error('Error in weekly content unlock job:', error);
  }
};

// Function to setup the cron jobs
export const setupCronJobs = () => {
  // In a real implementation, we would use a scheduler like node-cron
  // For this MVP, we'll just set up an interval
  
  // Run the content unlock job every day at midnight
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      unlockWeeklyContent();
    }
  }, 60000); // Check every minute
  
  // Also run it once at startup to make sure content is properly unlocked
  unlockWeeklyContent();
  
  console.log('Cron jobs initialized');
};
