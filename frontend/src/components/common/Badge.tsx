import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type BadgeVariant = 'success' | 'warning' | 'critical' | 'info' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-risk-low border border-green-200',
  warning: 'bg-yellow-100 text-risk-moderate border border-yellow-200',
  critical: 'bg-red-100 text-risk-critical border border-red-200',
  info: 'bg-blue-100 text-brand-primary border border-blue-200',
  neutral: 'bg-gray-100 text-text-secondary border border-gray-200',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className, children, ...props }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
