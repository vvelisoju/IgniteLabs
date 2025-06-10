import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { format } from 'date-fns';

export default function BatchTable() {
  const { data: batches, isLoading, error } = useQuery({
    queryKey: ['/api/batches/active'],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-32 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-100 p-6">
        <div className="text-red-500">Failed to load batches</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
      <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
        <h2 className="font-semibold text-neutral-800">Active Batches</h2>
        <Link href="/batches">
          <span className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</span>
        </Link>
      </div>
      
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Batch
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Progress
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Students
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {batches?.map((batch: any) => {
              // Handle snake_case property names from server
              const startDate = new Date(batch.start_date || batch.startDate);
              const endDate = new Date(batch.end_date || batch.endDate);
              const today = new Date();
              
              // Check if dates are valid before calculating
              const isStartDateValid = !isNaN(startDate.getTime());
              const isEndDateValid = !isNaN(endDate.getTime());
              
              // Calculate progress percentage only if dates are valid
              let totalDays = 30; // Default if dates are invalid
              let daysPassed = 0;
              let progress = 0;
              
              if (isStartDateValid && isEndDateValid) {
                totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
                daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
                progress = Math.min(Math.max(Math.floor((daysPassed / totalDays) * 100), 0), 100);
              }
              
              // Calculate which week the batch is in
              const weekNumber = Math.ceil(daysPassed / 7);
              const totalWeeks = Math.ceil(totalDays / 7);
              
              // Generate initials for the batch
              const initials = batch.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              
              // Set batch color based on name (just for variety)
              const colors = [
                { bg: 'bg-primary-100', text: 'text-primary-700' },
                { bg: 'bg-blue-100', text: 'text-blue-700' },
                { bg: 'bg-purple-100', text: 'text-purple-700' },
                { bg: 'bg-green-100', text: 'text-green-700' },
                { bg: 'bg-indigo-100', text: 'text-indigo-700' },
              ];
              const colorIndex = batch.id % colors.length;
              const { bg, text } = colors[colorIndex];
              
              return (
                <tr key={batch.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded ${bg} flex items-center justify-center ${text} font-bold`}>
                        {initials}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">{batch.name}</div>
                        <div className="text-sm text-neutral-500">
                          {isStartDateValid && format(startDate, 'MMM d')} - {isEndDateValid && format(endDate, 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-neutral-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1 text-neutral-500">Week {weekNumber} of {totalWeeks}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">28 Students</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
