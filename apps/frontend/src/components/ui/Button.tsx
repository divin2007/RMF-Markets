'use client';
import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  loading = false,
  ...props
}: ButtonProps) => {
  const baseStyles =
    'relative magnetic-pop inline-flex items-center justify-center gap-2 rounded-2xl font-black tracking-tight transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100';

  const variants = {
    primary:
      'text-white bg-gradient-to-br from-[#ff6b00] to-[#ff9340] shadow-[0_6px_24px_-4px_rgba(255,107,0,0.45)] hover:shadow-[0_16px_40px_-6px_rgba(255,107,0,0.55)] hover:-translate-y-0.5 focus-visible:ring-[#ff6b00]',
    secondary:
      'bg-[#1b1c1c] text-white shadow-[0_6px_20px_-4px_rgba(27,28,28,0.35)] hover:shadow-[0_14px_32px_-6px_rgba(27,28,28,0.45)] hover:-translate-y-0.5 focus-visible:ring-[#1b1c1c]',
    outline:
      'border-2 border-[#ff6b00] bg-white/80 backdrop-blur-sm text-[#ff6b00] hover:bg-[#ff6b00] hover:text-white focus-visible:ring-[#ff6b00]',
    ghost:
      'text-[#1b1c1c] hover:bg-[#ffedd5]/70 hover:text-[#ff6b00] focus-visible:ring-[#ff6b00]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs min-h-9',
    md: 'px-5 py-3 text-sm min-h-11',
    lg: 'px-7 py-3.5 text-base min-h-12',
  };

  const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      <span className={loading ? 'opacity-0' : 'inline-flex items-center gap-2'}>{children}</span>
      {loading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        </span>
      )}
    </button>
  );
};
