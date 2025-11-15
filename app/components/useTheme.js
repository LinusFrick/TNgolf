'use client';
import { useState, useEffect } from 'react';

export function useTheme() {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        // Check initial theme
        const currentTheme = document.body.dataset.theme || 'dark';
        setTheme(currentTheme);

        // Watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    setTheme(document.body.dataset.theme || 'dark');
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => observer.disconnect();
    }, []);

    return theme;
}

