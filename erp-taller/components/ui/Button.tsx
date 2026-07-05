import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', icon: Icon, children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary/90 shadow-soft hover:shadow-lg',
      secondary: 'bg-white/80 dark:bg-secondary/80 text-secondary dark:text-neutral-light backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-soft hover:bg-neutral-light dark:hover:bg-white/10',
      ghost: 'text-tertiary hover:text-secondary dark:hover:text-neutral-light hover:bg-neutral-light dark:hover:bg-white/10',
      danger: 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5',
      md: 'text-sm px-5 py-2.5',
      lg: 'text-base px-6 py-3'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
