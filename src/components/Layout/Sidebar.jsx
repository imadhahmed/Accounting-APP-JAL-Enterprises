import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Receipt, LogOut, X, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const { currentUser, logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Projects', href: '/projects', icon: Briefcase },
        { name: 'Loans & Settlements', href: '/loans', icon: Receipt },
        { name: 'Reports', href: '/reports', icon: FileText },
    ];

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-xs transition-opacity lg:hidden",
                    isOpen ? "opacity-100 ease-out duration-300" : "opacity-0 ease-in duration-200 pointer-events-none"
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <div
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-gray-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col lg:w-64",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between h-20 px-5 sm:px-6 border-b border-gray-200">
                    <img src="/logo-full.png" alt="JAL Construction" className="h-16 w-auto" />
                    <button
                        type="button"
                        className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none touch-manipulation"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1.5 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={clsx(
                                    isActive
                                        ? 'bg-primary-50 text-primary-700 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    'group flex items-center px-3 py-2.5 sm:py-2 text-sm rounded-lg transition-colors touch-manipulation'
                                )}
                                onClick={() => onClose()}
                            >
                                <item.icon
                                    className={clsx(
                                        isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500',
                                        'mr-3 flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 transition-colors'
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 space-y-2">
                    {currentUser?.email && (
                        <div className="px-2 py-1 text-xs text-gray-500 truncate">
                            Signed in as <span className="font-medium text-gray-700 block truncate">{currentUser.email}</span>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation"
                    >
                        <LogOut className="mr-3 flex-shrink-0 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
}
