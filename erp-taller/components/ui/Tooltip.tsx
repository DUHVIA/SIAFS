"use client";

import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [show, setShow] = useState(false);

  if (!content) return <>{children}</>;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center max-w-full"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={`absolute ${positionClasses[position]} z-[100] px-3 py-1.5 bg-neutral-900/95 text-white text-xs font-headline font-medium rounded-xl shadow-2xl border border-white/10 backdrop-blur-md whitespace-normal break-words max-w-xs animate-in fade-in zoom-in-95 pointer-events-none transition-all ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

interface TruncatedCellProps {
  text: string;
  maxWidthClass?: string;
  className?: string;
  subtext?: string;
}

export function TruncatedCell({
  text,
  maxWidthClass = 'max-w-[220px]',
  className = '',
  subtext
}: TruncatedCellProps) {
  if (!text) return <span className="text-tertiary text-xs">-</span>;

  return (
    <Tooltip content={subtext ? `${text} · ${subtext}` : text}>
      <div className={`flex flex-col min-w-0 ${className}`}>
        <span
          className={`truncate ${maxWidthClass} text-secondary font-medium font-body block`}
        >
          {text}
        </span>
        {subtext && (
          <span
            className={`truncate ${maxWidthClass} text-[11px] text-tertiary font-body block`}
          >
            {subtext}
          </span>
        )}
      </div>
    </Tooltip>
  );
}
