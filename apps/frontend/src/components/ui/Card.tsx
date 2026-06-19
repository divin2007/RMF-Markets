'use client';
import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  glow?: boolean;
}

export const Card = ({ children, className = '', noPadding = false, glow = false, ...props }: CardProps) => {
  return (
    <div
      className={`rounded-3xl bg-white/90 backdrop-blur-xl shadow-[0_4px_28px_-6px_rgba(27,28,28,0.10)] transition-all duration-400 ${
        glow ? 'hover:-translate-y-1.5 hover:shadow-[0_24px_56px_-10px_rgba(255,107,0,0.22)]' : ''
      } ${noPadding ? '' : 'p-4 sm:p-6'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
