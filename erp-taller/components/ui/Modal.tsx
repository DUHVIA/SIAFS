import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title: string;
 children: React.ReactNode;
 maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
 useEffect(() => {
 if (isOpen) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = 'unset';
 }
 return () => { document.body.style.overflow = 'unset'; };
 }, [isOpen]);

 if (!isOpen) return null;

 const maxWidthClasses = {
 sm: 'max-w-sm',
 md: 'max-w-md',
 lg: 'max-w-lg',
 xl: 'max-w-xl',
 '2xl': 'max-w-2xl',
 '3xl': 'max-w-3xl',
 '4xl': 'max-w-4xl',
 '5xl': 'max-w-5xl'
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
 {/* Backdrop */}
 <div 
 className="absolute inset-0 bg-secondary/20 backdrop-blur-sm transition-opacity" 
 onClick={onClose}
 />
 
 {/* Modal Content */}
 <div className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
 
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-light/50 ">
 <h2 className="font-headline font-bold text-xl text-secondary ">{title}</h2>
 <button 
 onClick={onClose}
 className="p-2 rounded-full hover:bg-neutral-light transition-colors text-tertiary"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Body (Scrollable) */}
 <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
 {children}
 </div>
 </div>
 </div>
 );
}
