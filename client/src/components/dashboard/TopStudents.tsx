import { Link } from 'wouter';

// Mock top students data
const topStudents = [
  {
    id: 1,
    name: 'Alex Kim',
    initials: 'AK',
    score: 95
  },
  {
    id: 2,
    name: 'Maya Johnson',
    initials: 'MJ',
    score: 92
  },
  {
    id: 3,
    name: 'Tyler Patel',
    initials: 'TP',
    score: 89
  },
  {
    id: 4,
    name: 'Sarah Lee',
    initials: 'SL',
    score: 87
  }
];

export default function TopStudents() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
      <div className="p-4 border-b border-neutral-100">
        <h2 className="font-semibold text-neutral-800">Top Performing Students</h2>
      </div>
      <div className="p-4 space-y-4">
        {topStudents.map(student => (
          <div key={student.id} className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
              {student.initials}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-900">{student.name}</p>
                <p className="text-sm text-neutral-500">{student.score}%</p>
              </div>
              <div className="mt-1 w-full bg-neutral-200 rounded-full h-1.5">
                <div 
                  className="bg-primary-600 h-1.5 rounded-full" 
                  style={{ width: `${student.score}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-neutral-100 bg-neutral-50">
        <Link href="/analytics/leaderboard" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center">
          View full leaderboard
        </Link>
      </div>
    </div>
  );
}
