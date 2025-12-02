'use client';
import ThemeToggle from './theme';
import Logo from './Logo';
import SideNav from './SideNav';
import MobileNav from './MobileNav';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useTheme } from './useTheme';

export default function Header(){
    const path = usePathname();
    const { data: session } = useSession();
    const theme = useTheme();
    const isLight = theme === 'light';

    return(
        <>
            {/* Left Side Navigation - only on home page, desktop/tablet only */}
            {path === '/' && <SideNav />}
            
            {/* Mobile Bottom Navigation - only on home page, mobile only */}
            {path === '/' && <MobileNav />}
            
            {/* Top Navigation Bar - Balanced Layout */}
            <div className="fixed z-50 top-0 left-0 right-0 
              flex items-center justify-between
              px-3 py-3
              sm:px-4 sm:py-4
              md:px-5 md:py-5
              lg:px-6 lg:py-6">
                {/* Left: Logo and Theme Toggle */}
                <div className="flex items-center gap-3 sm:gap-4">
                    <Logo className="
                      w-32 sm:w-40 md:w-48 lg:w-60" href="/" />
                    <ThemeToggle />
                </div>

                {/* Right: Login/Logout Button */}
                <div className="flex items-center">
                    {session ? (
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 ${
                                isLight
                                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                            aria-label="Logga ut"
                        >
                            Logga ut
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 ${
                                isLight
                                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                            aria-label="Logga in"
                        >
                            Logga in
                        </Link>
                    )}
                </div>
            </div>
        </>
    )
}