import { Fragment } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'sm:max-w-lg' }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-600/75 backdrop-blur-xs transition-opacity"
                aria-hidden="true"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className={`relative bg-white rounded-2xl text-left shadow-2xl transform transition-all my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col ${maxWidth} w-full z-10`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex-shrink-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 -mr-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors touch-manipulation"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="px-4 sm:px-6 py-4 overflow-y-auto overscroll-contain flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
