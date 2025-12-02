'use client';
import { HiSun, HiMoon } from 'react-icons/hi';
import { useState, useEffect } from "react";
import { useTheme } from './useTheme';

const ThemeToggle = () => {
    const [activeTheme, setActiveTheme] = useState('dark');
    const [isAnimating, setIsAnimating] = useState(false);
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

    const handleToggle = () => {
        setIsAnimating(true);
        setActiveTheme(inactiveTheme);
        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <button 
            onClick={handleToggle}
            className={`
                min-h-[44px] min-w-[44px] 
                flex items-center justify-center
                rounded-lg
                transition-all duration-300
                focus:outline-none
                ${isLight 
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-900 active:bg-gray-400' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white active:bg-gray-500'
                }
                ${isAnimating ? 'scale-95' : 'scale-100'}
            `}
            aria-label={`Växla till ${inactiveTheme === 'dark' ? 'mörkt' : 'ljusst'} tema`}
            aria-pressed={activeTheme === 'dark'}
        >
            <div className={`transition-transform duration-300 ${isAnimating ? 'rotate-180' : 'rotate-0'}`}>
                {activeTheme === 'dark' ? (
                    <HiSun className="w-5 h-5" />
                ) : (
                    <HiMoon className="w-5 h-5" />
                )}
            </div>
        </button>
    );
}

export default ThemeToggle;