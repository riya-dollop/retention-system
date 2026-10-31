'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'screen';
  className?: string;
}

export default function Loader({ label = 'Loading data...', size = 'md', className = '' }: LoaderProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    screen: 'w-10 h-10',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-emerald-600`} />
      {label && <p className="text-xs font-medium text-slate-500 animate-pulse">{label}</p>}
    </div>
  );

  if (size === 'screen') {
    return (
      <div className="flex-1 w-full h-full min-h-[300px] flex items-center justify-center bg-white/70 backdrop-blur-xs">
        {spinner}
      </div>
    );
  }

  return spinner;
}

