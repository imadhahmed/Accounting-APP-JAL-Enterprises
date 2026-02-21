import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Receipt, LogOut, X, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const { logout } = useAuth();

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
                    "fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden",
                    isOpen ? "opacity-100 ease-out duration-300" : "opacity-0 ease-in duration-200 pointer-events-none"
                )}
                onClick={onClose}
            ></div>

            {/* Sidebar */}
            <div
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between h-24 px-6 border-b border-gray-200">
                    <img src="/logo-full.png" alt="JAL Construction" className="h-20 w-auto" />
                    <button
                        type="button"
                        className="lg:hidden text-gray-500 hover:text-gray-600 focus:outline-none"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={clsx(
                                    isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                                )}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                                <item.icon
                                    className={clsx(
                                        isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500',
                                        'mr-3 flex-shrink-0 h-6 w-6 transition-colors'
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="mr-3 flex-shrink-0 h-6 w-6" />
                        Sign Out
                    </button>
                </div>
            </div >
        </>
    );
}
