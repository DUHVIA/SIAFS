import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
 id: string;
 type: ToastType;
 message: string;
}

interface ToastProps {
 toast: ToastMessage;
 onClose: (id: string) => void;
}

const ICONS = {
 success: <CheckCircle className="w-5 h-5 text-green-500" />,
 error: <XCircle className="w-5 h-5 text-red-500" />,
 warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
 info: <Info className="w-5 h-5 text-blue-500" />
};

export function Toast({ toast, onClose }: ToastProps) {
 const [isClosing, setIsClosing] = useState(false);

 useEffect(() => {
 // 4000ms is the lifespan of the toast
 const timer = setTimeout(() => {
 setIsClosing(true);
 setTimeout(() => onClose(toast.id), 300); // 300ms for exit animation
 }, 4000);

 return () => clearTimeout(timer);
 }, [toast.id, onClose]);

 const handleClose = () => {
 setIsClosing(true);
 setTimeout(() => onClose(toast.id), 300);
 };

 return (
 <div className={`relative w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-300 transform
 ${isClosing ? 'opacity-0 translate-x-8' : 'animate-in slide-in-from-right-8 fade-in'}
 `}>
 <div className="flex items-start gap-3 p-4">
 <div className="shrink-0 mt-0.5">
 {ICONS[toast.type]}
 </div>
 <p className="flex-1 font-body text-sm font-medium text-secondary ">
 {toast.message}
 </p>
 <button 
 onClick={handleClose}
 className="shrink-0 text-tertiary hover:text-secondary transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 
 {/* Barra de progreso */}
 <div className="h-1 w-full bg-neutral-light/50 absolute bottom-0 left-0">
 <div 
 className={`h-full ${
 toast.type === 'success' ? 'bg-green-500' :
 toast.type === 'error' ? 'bg-red-500' :
 toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
 }`}
 style={{ animation: 'shrinkWidth 4s linear forwards' }}
 />
 </div>
 </div>
 );
}
