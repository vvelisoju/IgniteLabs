import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Assignment } from '@shared/schema';
import { format } from 'date-fns';

export default function AssignmentTable() {
  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['/api/assignments'],
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
        <div className="text-red-500">Failed to load assignments</div>
      </div>
    );
  }

  // Get recent assignments
  const recentAssignments = assignments?.slice(0, 3) || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
      <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
        <h2 className="font-semibold text-neutral-800">Recent Assignments</h2>
        <Link href="/assignments">
          <a className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</a>
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Assignment
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Batch
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {recentAssignments.map((assignment: Assignment) => {
              // Generate a status based on due date
              const dueDate = new Date(assignment.dueDate);
              const today = new Date();
              let status = 'In Progress';
              let statusClass = 'bg-yellow-100 text-yellow-800';
              
              if (dueDate < today) {
                status = 'Completed';
                statusClass = 'bg-green-100 text-green-800';
              } else if (dueDate.getTime() - today.getTime() < 2 * 24 * 60 * 60 * 1000) {
                status = 'Due Soon';
                statusClass = 'bg-orange-100 text-orange-800';
              }
              
              return (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">{assignment.title}</div>
                    <div className="text-sm text-neutral-500">Week {assignment.week}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">Batch #{assignment.batchId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/assignments/${assignment.id}`}>
                      <a className="text-primary-600 hover:text-primary-900">View</a>
                    </Link>
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
