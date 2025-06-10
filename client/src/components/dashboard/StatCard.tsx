import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  iconBgColor: string;
  iconTextColor: string;
}

export default function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  iconBgColor, 
  iconTextColor 
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-100">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-500">{title}</h2>
        <div className={`rounded-full ${iconBgColor} p-2 ${iconTextColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-semibold text-neutral-800">{value}</span>
        {description && (
          <span className="text-sm text-secondary-600 ml-2">{description}</span>
        )}
      </div>
    </div>
  );
}
