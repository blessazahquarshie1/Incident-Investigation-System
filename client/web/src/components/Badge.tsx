import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-medium ${className}`}>
      {children}
    </span>
  );
}

