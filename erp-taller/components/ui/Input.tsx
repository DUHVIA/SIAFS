import React, { InputHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
 icon?: LucideIcon;
 error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
 ({ className = '', icon: Icon, error, ...props }, ref) => {
 return (
 <div className="w-full flex flex-col gap-1.5">
 <div className="relative flex items-center w-full">
 {Icon && (
 <Icon className="absolute left-4 w-5 h-5 text-tertiary pointer-events-none" />
 )}
 <input
 ref={ref}
 className={`w-full bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm focus:shadow-soft px-4 py-3 font-body text-sm text-secondary outline-none transition-all duration-300 placeholder-tertiary/60
 ${Icon ? 'pl-11' : ''}
 ${error ? 'border-red-400 focus:border-red-500' : 'focus:border-primary/50'}
 ${className}
 `}
 {...props}
 />
 </div>
 {error && <span className="text-xs text-red-500 ml-2 font-medium">{error}</span>}
 </div>
 );
 }
);

Input.displayName = 'Input';
