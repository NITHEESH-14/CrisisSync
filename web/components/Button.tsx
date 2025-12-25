import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    className?: string;
}

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md";

    const variants = {
        primary: "bg-black text-white hover:opacity-80 focus:ring-neutral-900 border border-transparent",
        danger: "bg-emergency text-white hover:bg-red-600 focus:ring-red-500 shadow-lg shadow-red-200",
        ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-200",
        outline: "bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-200"
    };

    const sizes = {
        sm: "h-8 px-4 text-sm",
        md: "h-10 px-6 text-base",
        lg: "h-14 px-8 text-lg font-semibold"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
