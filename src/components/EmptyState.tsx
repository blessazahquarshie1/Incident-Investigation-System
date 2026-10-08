import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 min-h-[200px]">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h3 className="text-[17px] font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-2 text-base text-slate-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

