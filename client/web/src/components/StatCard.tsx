import React from 'react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, hint, href, icon }: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex items-start justify-between ${href ? 'hover:border-blue-400 hover:shadow-md transition-all' : ''}`}>
      <div>
        <p className="text-[15px] font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {hint && <p className="text-[13px] text-slate-500 mt-2">{hint}</p>}
      </div>
      {icon && <div className="text-slate-400 p-2 bg-slate-50 rounded-lg">{icon}</div>}
    </div>
  );

  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }

  return content;
}

