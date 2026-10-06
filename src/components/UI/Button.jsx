import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Button({
    children,
    variant = 'primary',
    isLoading = false,
    className = '',
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none active:scale-[0.98]";

    const variants = {
        primary: "border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 shadow-sm",
        secondary: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500",
        danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
        ghost: "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500"
    };

    return (
        <button
            className={clsx(baseStyles, variants[variant], className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
            {children}
        </button>
    );
}
