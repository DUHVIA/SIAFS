"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Lock, Loader2, Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';
import { siteConfig } from '@/lib/config';

export default function InvitacionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    const hasMinLength = password.length >= 8;
    const hasMatch = password === confirmPassword && password.length > 0;
    const isValid = hasMinLength && hasMatch && token;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/invitacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                const data = await res.json();
                setError(data.error || 'Error al establecer la contraseña');
            }
        } catch (error) {
            setError('Error de conexión al servidor');
        } finally {
            setLoading(false);
        }
    };

    if (!token && !success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-secondary mb-2">Enlace Inválido</h2>
                    <p className="text-tertiary mb-6">El enlace de invitación no es válido o está incompleto.</p>
                    <Button variant="primary" onClick={() => router.push('/login')} className="w-full">
                        Ir al inicio
                    </Button>
                </div>
            </div>
        );
    }

    const logoSrc = isDarkMode ? siteConfig.logo_2 : siteConfig.logo;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full"></div>

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-soft max-w-md w-full relative z-10 border border-white/50">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                        <img src={logoSrc} alt={siteConfig.name} className="w-16 h-16 object-contain drop-shadow-md" />
                    </div>
                    <h1 className="text-2xl font-bold text-secondary font-headline">Bienvenido a {siteConfig.name}</h1>
                    <p className="text-tertiary mt-2">Por favor, establece tu contraseña para acceder al sistema.</p>
                </div>

                {success ? (
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-secondary mb-2">¡Contraseña Guardada!</h2>
                        <p className="text-tertiary mb-6">Tu cuenta ya está segura. Serás redirigido al inicio de sesión en unos segundos...</p>
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm text-center font-medium">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-secondary">Nueva Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-secondary"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors p-2"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-secondary">Confirmar Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Repite tu contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-secondary"
                                    required
                                />
                            </div>
                        </div>

                        {/* Checklist */}
                        {(password.length > 0 || confirmPassword.length > 0) && (
                            <div className="flex flex-col gap-2 mt-2 bg-black/5 p-4 rounded-xl border border-black/5">
                                <div className="flex items-center gap-3 text-sm">
                                    {hasMinLength ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                                    <span className={hasMinLength ? "text-green-600 font-medium" : "text-tertiary"}>Al menos 8 caracteres</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    {hasMatch ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />}
                                    <span className={hasMatch ? "text-green-600 font-medium" : "text-tertiary"}>Las contraseñas coinciden</span>
                                </div>
                            </div>
                        )}

                        <Button 
                            variant="primary" 
                            className="w-full py-3 mt-4 text-base"
                            icon={loading ? Loader2 : Lock}
                            disabled={loading || !isValid}
                        >
                            {loading ? 'Guardando...' : 'Establecer Contraseña'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
