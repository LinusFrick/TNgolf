'use client';
import { HiSun, HiMoon } from 'react-icons/hi';
import { useState, useEffect } from "react";
import { useTheme } from './useTheme';

const ThemeToggle = () => {
    const [activeTheme, setActiveTheme] = useState('dark');
    const theme = useTheme();
    const inactiveTheme = activeTheme === 'dark' ? 'light': 'dark';
    const isLight = theme === 'light';

    useEffect(() => {
        document.body.dataset.theme = activeTheme;
    }, [activeTheme]);

    // Sync with theme hook
    useEffect(() => {
        setActiveTheme(theme);
    }, [theme]);

    const iconColor = isLight ? 'text-black hover:text-yellow-600' : 'text-white hover:text-yellow-300';

    return (
        <button 
            onClick={() => setActiveTheme(inactiveTheme)}
            className={`${iconColor} transition-colors duration-200 flex items-center justify-center`}
            aria-label="Toggle theme"
        >
            {activeTheme === 'dark' ? (
                <HiSun className="w-5 h-5" />
            ) : (
                <HiMoon className="w-5 h-5" />
            )}
        </button>
    );
}

export default ThemeToggle;