import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-soft border border-white/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline font-semibold text-tertiary text-sm uppercase tracking-wider">
                    {title}
                </h3>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
            </div>

            <div className="flex items-baseline gap-2">
                <p className="font-body font-bold text-3xl text-secondary ">
                    {value}
                </p>

                {trend && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.isPositive
                            ? 'bg-green-100 text-green-700 '
                            : 'bg-red-100 text-red-700 '
                        }`}>
                        {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                    </span>
                )}
            </div>
        </div>
    );
}
