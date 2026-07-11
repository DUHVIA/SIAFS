"use client";

import React, { useState, useEffect } from 'react';
import { Search, Bell, Moon, Sun, Menu } from 'lucide-react';

interface NavbarProps {
    onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check initial dark mode preference
        if (document.documentElement.classList.contains('dark')) {
            setIsDarkMode(true);
        }
    }, []);

    const toggleDarkMode = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        setIsDarkMode(isDark);
    };

    return (
        <header className="sticky top-4 z-40 mx-4 h-16 bg-white/70 backdrop-blur-xl rounded-full shadow-soft flex items-center justify-between px-6 transition-all duration-300">

            {/* Hamburger Menu Button */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-full text-tertiary hover:bg-neutral-light transition-colors mr-2"
                aria-label="Abrir menú"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar - Soft UI */}
            <div className="flex-1 max-w-md flex items-center bg-neutral-light rounded-full px-4 py-2 transition-all duration-300 focus-within:shadow-sm focus-within:bg-white ">
                <Search className="w-5 h-5 text-tertiary" />
                <input
                    type="text"
                    placeholder="Buscar algo..."
                    className="w-full bg-transparent border-none outline-none px-3 text-sm font-body text-secondary placeholder-tertiary"
                />
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-4">
                {/* Toggle Theme */}
                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full text-tertiary hover:bg-neutral-light transition-colors"
                    aria-label="Toggle Dark Mode"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Notifications */}
                <button className="relative p-2 rounded-full text-tertiary hover:bg-neutral-light transition-colors">
                    <Bell className="w-5 h-5" />
                    {/* Badge */}
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white " />
                </button>

                {/* User Avatar */}
                <div className="ml-2 w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-rose-400 p-[2px] cursor-pointer hover:shadow-sm transition-all duration-300">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <span className="text-primary font-bold text-sm">AD</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
