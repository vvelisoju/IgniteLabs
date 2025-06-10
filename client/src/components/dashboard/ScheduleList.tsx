import { Calendar, Users, PhoneCall } from 'lucide-react';
import { Link } from 'wouter';

// Mock schedule data
const schedule = [
  {
    id: 1,
    time: '9:00',
    period: 'AM',
    title: 'JavaScript Fundamentals',
    subtitle: 'Promises & Async/Await',
    status: 'Live',
    statusClass: 'bg-primary-100 text-primary-800',
    details: '28 students enrolled',
    icon: <Users className="h-4 w-4 mr-1" />
  },
  {
    id: 2,
    time: '11:30',
    period: 'AM',
    title: 'React & JSX',
    subtitle: 'State Management with Redux',
    status: 'Upcoming',
    statusClass: 'bg-neutral-100 text-neutral-800',
    details: '24 students enrolled',
    icon: <Users className="h-4 w-4 mr-1" />
  },
  {
    id: 3,
    time: '2:00',
    period: 'PM',
    title: 'Code Review Session',
    subtitle: 'React Component Library',
    status: 'Upcoming',
    statusClass: 'bg-neutral-100 text-neutral-800',
    details: 'Group meeting',
    icon: <PhoneCall className="h-4 w-4 mr-1" />
  }
];

export default function ScheduleList() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
      <div className="p-4 border-b border-neutral-100">
        <h2 className="font-semibold text-neutral-800">Today's Schedule</h2>
      </div>
      <div className="divide-y divide-neutral-100">
        {schedule.map(event => (
          <div key={event.id} className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 text-center">
                <div className="text-sm font-medium text-neutral-900">{event.time}</div>
                <div className="text-xs text-neutral-500">{event.period}</div>
              </div>
              <div className="flex-1 ml-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-neutral-900">{event.title}</h3>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.statusClass}`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 mt-1">{event.subtitle}</p>
                <div className="mt-2 flex items-center text-xs text-neutral-500">
                  {event.icon}
                  {event.details}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-neutral-100 bg-neutral-50">
        <Link href="/calendar" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center">
          <Calendar className="h-4 w-4 mr-1" />
          Add to calendar
        </Link>
      </div>
    </div>
  );
}
