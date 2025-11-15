'use client';
import Link from 'next/link';
import { useTheme } from './useTheme';

export default function Logo({ className = 'w-60', href = '/', onClick }) {
    const theme = useTheme();

    // For white SVG to black: use brightness(0) 
    // For white SVG to stay white: no filter
    const filterStyle = theme === 'light' 
        ? { filter: 'brightness(0)' } // Makes white logo black in light mode
        : { filter: 'none' }; // Keeps white logo white in dark mode

    const logoElement = (
        <img
            src="/images/logo-white.svg"
            className={`transition-all duration-300 ${className}`}
            style={filterStyle}
            alt="Logo"
        />
    );

    if (href) {
        return (
            <Link href={href} onClick={onClick} className="block">
                {logoElement}
            </Link>
        );
    }

    return logoElement;
}

