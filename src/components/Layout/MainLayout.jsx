import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex w-full overflow-x-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full transition-all duration-300">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 lg:hidden flex-shrink-0 flex items-center justify-between h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 sm:px-4 shadow-xs">
                    <button
                        type="button"
                        className="p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open navigation menu"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex items-center space-x-2">
                        <img src="/logo-full.png" alt="JAL" className="h-9 w-auto" />
                        <span className="text-base font-bold tracking-tight text-gray-900">JAL ENTERPRISES</span>
                    </div>
                    {/* Placeholder to keep logo centered */}
                    <div className="w-8" aria-hidden="true" />
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 w-full min-w-0 max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
