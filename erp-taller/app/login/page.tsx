"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { useLoading } from '@/components/providers/LoadingProvider';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const { success, error } = useToast();
    const { setLoading, isLoading } = useLoading();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                success('Autenticación exitosa. Redirigiendo...');
                // Forzamos la recarga de la página para que el middleware lea la cookie y nos envíe al Dashboard
                window.location.href = '/';
            } else {
                const data = await res.json();
                error(data.error || 'Credenciales inválidas');
            }
        } catch (err) {
            error('Error de red al intentar iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
            <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-soft border border-white/20 ">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="font-headline text-2xl font-bold text-secondary ">
                        Bienvenido a SIAFS
                    </h1>
                    <p className="text-sm text-tertiary mt-2">
                        Ingresa tus credenciales para acceder al ERP
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-xs text-tertiary font-medium mb-1 block">Correo Electrónico</label>
                        <Input
                            required
                            type="email"
                            icon={Mail}
                            placeholder="admin@duhvia.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-tertiary font-medium mb-1 block">Contraseña</label>
                        <Input
                            required
                            type="password"
                            icon={Lock}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-3"
                        icon={ArrowRight}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
                    </Button>
                </form>

            </div>
        </div>
    );
}
