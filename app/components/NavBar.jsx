'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './theme';
import Logo from './Logo';
import { useTheme } from './useTheme';
import { usePathname } from 'next/navigation';

const mobileLinks = [
    { href: '/', placeholder: 'Hem' },
    { href: '/services', placeholder: 'Gruppträning' },
    { href: '/bookings', placeholder: 'Priser' },
];

export default function NavBar() {
    const [navbarOpen, setNavbarOpen] = useState(false);
    const path = usePathname();
    const theme = useTheme();
    const isLight = theme === 'light';

    const handleCloseMenu = () => {
        setNavbarOpen(false);
    };

    const toggleMenu = () => {
        setNavbarOpen((prev) => !prev);
    };

    return (
        <div className="block md:hidden">
            {/* Hamburger Menu Button */}
            <button
                onClick={toggleMenu}
                aria-label={navbarOpen ? "Stäng meny" : "Öppna meny"}
                aria-expanded={navbarOpen}
                aria-controls="mobile-menu"
                className={`min-h-[44px] min-w-[44px] p-2 ${isLight ? 'text-black hover:text-yellow-600' : 'text-white hover:text-yellow-300'} transition-colors z-50 relative focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded-lg`}
            >
                <motion.div
                    animate={navbarOpen ? { rotate: 90 } : { rotate: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        {navbarOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>
                </motion.div>
            </button>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {navbarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                            onClick={handleCloseMenu}
                        />

                        {/* Menu Panel */}
                        <motion.nav
                            id="mobile-menu"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-80 bg-gray-900 dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
                            aria-label="Huvudmeny"
                        >
                            <div className="flex flex-col h-full">
                                {/* Close Button */}
                                <div className="flex justify-end items-center p-6">
                                    <button
                                        onClick={handleCloseMenu}
                                        className="min-h-[44px] min-w-[44px] p-2 text-white hover:text-yellow-300 transition-colors rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                                        aria-label="Stäng meny"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-6 h-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* Logo */}
                                <div className="flex justify-center px-6 pb-8">
                                    <Logo className="w-48" href="/" onClick={handleCloseMenu} />
                                </div>

                                {/* Navigation Links */}
                                <ul className="flex flex-col gap-6 px-6 flex-1">
                                    {mobileLinks.map((link, index) => (
                                        <motion.li
                                            key={link.href}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Link
                                                href={link.href}
                                                onClick={handleCloseMenu}
                                                className={`block min-h-[44px] py-3 px-4 rounded-lg text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 ${
                                                    link.href === path
                                                        ? 'text-yellow-400 bg-yellow-400/10 border-l-4 border-yellow-400'
                                                        : 'text-white hover:text-yellow-300 hover:bg-gray-800'
                                                }`}
                                                aria-current={link.href === path ? 'page' : undefined}
                                            >
                                                {link.placeholder}
                                            </Link>
                                        </motion.li>
                                    ))}
                                </ul>

                                {/* Theme Toggle */}
                                <div className="p-6 border-t border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white text-sm">Tema</span>
                                        <ThemeToggle />
                                    </div>
                                </div>
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}