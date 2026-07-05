"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export function AppLayout({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 
 if (pathname === '/login') {
 return <div className="flex-1 min-h-screen bg-transparent">{children}</div>;
 }

 return (
 <>
 <Sidebar />
 <main className="flex-1 flex flex-col min-h-screen ml-[18rem] transition-all duration-300">
 <Navbar />
 <div className="flex-1 p-8">
 {children}
 </div>
 </main>
 </>
 );
}
