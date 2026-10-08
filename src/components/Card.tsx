import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-[17px] font-medium text-slate-900">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

