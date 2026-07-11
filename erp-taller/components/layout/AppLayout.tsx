"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    if (pathname === '/login') {
        return <div className="flex-1 min-h-screen bg-transparent">{children}</div>;
    }

    return (
        <>
            <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
            <main className="flex-1 flex flex-col min-h-screen lg:ml-[18rem] transition-all duration-300 w-full overflow-x-hidden">
                <Navbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
                <div className="flex-1 p-4 md:p-8">
                    {children}
                </div>
            </main>
        </>
    );
}
