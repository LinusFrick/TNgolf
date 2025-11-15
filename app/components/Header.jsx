'use client';
import ThemeToggle from './theme';
import Logo from './Logo';
import SideNav from './SideNav';
import MobileNav from './MobileNav';
import { usePathname } from 'next/navigation';

export default function Header(){
    const path = usePathname();

    return(
        <>
            {/* Left Side Navigation - only on home page, desktop/tablet only */}
            {path === '/' && <SideNav />}
            
            {/* Mobile Bottom Navigation - only on home page, mobile only */}
            {path === '/' && <MobileNav />}
            
            {/* Sticky Logo with Theme Toggle - Responsive */}
            <div className="fixed z-50 flex flex-col
              top-3 left-3 gap-2
              sm:top-4 sm:left-4 sm:gap-3
              md:top-5 md:left-5 md:gap-3
              lg:top-6 lg:left-6 lg:gap-4">
                <Logo className="
                  w-32 sm:w-40 md:w-48 lg:w-60" href="/" />
                <div className="flex items-center justify-start">
                    <ThemeToggle />
                </div>
            </div>
        </>
    )
}