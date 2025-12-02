'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from './useTheme';

export default function Logo({ className = 'w-60', href = '/', onClick }) {
    const theme = useTheme();

    // For white SVG to black: use brightness(0) 
    // For white SVG to stay white: no filter
    const filterStyle = theme === 'light' 
        ? { filter: 'brightness(0)' } // Makes white logo black in light mode
        : { filter: 'none' }; // Keeps white logo white in dark mode

    const logoElement = (
        <Image
            src="/images/logo-white.svg"
            alt="TN Golf - Logotyp"
            width={240}
            height={80}
            className={`transition-all duration-300 ${className}`}
            style={filterStyle}
            priority
            unoptimized
            aria-hidden="false"
        />
    );

    if (href) {
        return (
            <Link 
                href={href} 
                onClick={onClick} 
                className="block focus:outline-none rounded-lg"
                aria-label="Gå till startsidan"
            >
                {logoElement}
            </Link>
        );
    }

    return logoElement;
}

