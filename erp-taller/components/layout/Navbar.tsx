"use client";

import React, { useState, useEffect } from 'react';
import { Moon, Sun, Menu } from 'lucide-react';

interface NavbarProps {
    onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Cargar preferencia guardada en localStorage o sistema
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, []);

    const toggleDarkMode = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        setIsDarkMode(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
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

            {/* Spacer para mantener el layout */}
            <div className="flex-1" />

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
