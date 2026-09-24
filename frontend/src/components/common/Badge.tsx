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
  success: 'bg-risk-success/10 text-risk-success border border-risk-success/20',
  warning: 'bg-risk-warning/10 text-risk-warning border border-risk-warning/20',
  critical: 'bg-risk-critical/10 text-risk-critical border border-risk-critical/20',
  info: 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20',
  neutral: 'bg-app-surfaceSecondary text-text-secondary border border-app-border',
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
