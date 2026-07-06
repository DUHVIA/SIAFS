import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    icon?: LucideIcon;
    options: SelectOption[];
    error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', icon: Icon, options, error, ...props }, ref) => {
        return (
            <div className="w-full flex flex-col gap-1.5 relative">
                <div className="relative flex items-center w-full">
                    {Icon && (
                        <Icon className="absolute left-4 w-5 h-5 text-tertiary pointer-events-none" />
                    )}
                    <select
                        ref={ref}
                        className={`w-full appearance-none bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm focus:shadow-soft px-4 py-3 font-body text-sm text-secondary outline-none transition-all duration-300
 ${Icon ? 'pl-11' : ''} pr-10
 ${error ? 'border-red-400 focus:border-red-500' : 'focus:border-primary/50'}
 ${className}
 `}
                        {...props}
                    >
                        <option value="" disabled hidden>Seleccionar opción...</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-white ">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {/* Custom Arrow */}
                    <ChevronDown className="absolute right-4 w-5 h-5 text-tertiary pointer-events-none" />
                </div>
                {error && <span className="text-xs text-red-500 ml-2 font-medium">{error}</span>}
            </div>
        );
    }
);

Select.displayName = 'Select';
