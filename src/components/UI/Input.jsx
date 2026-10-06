export default function Input({
    label,
    id,
    error,
    className = '',
    leftIcon: LeftIcon,
    ...props
}) {
    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {LeftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LeftIcon className="h-5 w-5 text-gray-400" />
                    </div>
                )}
                <input
                    id={id}
                    className={`appearance-none block w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${LeftIcon ? 'pl-10' : ''
                        } ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
