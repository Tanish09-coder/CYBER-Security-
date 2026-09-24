import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-white border-transparent hover:bg-brand-primary/90 shadow-sm',
  secondary: 'bg-app-surfaceSecondary text-text-primary hover:bg-app-border border border-app-border shadow-sm',
  outline: 'bg-transparent text-text-primary border border-app-border hover:bg-app-surfaceSecondary',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-app-surfaceSecondary border-transparent',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
