'use client';
import ThemeToggle from './theme';
import Logo from './Logo';
import SideNav from './SideNav';
import { usePathname } from 'next/navigation';

export default function Header(){
    const path = usePathname();

    return(
        <>
            {/* Left Side Navigation - only on home page */}
            {path === '/' && <SideNav />}
            
            {/* Sticky Logo with Theme Toggle */}
            <div className="fixed top-6 left-6 z-50 flex flex-col gap-4">
                <Logo className="w-60" href="/" />
                <div className="flex items-center justify-start">
                    <ThemeToggle />
                </div>
            </div>
        </>
    )
}