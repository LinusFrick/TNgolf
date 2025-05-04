import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from "react";

const ThemeToggle = () => {
    const [activeTheme, setActiveTheme] = useState('dark');
    const inactiveTheme = activeTheme === 'dark' ? 'light': 'dark';

    useEffect(() => {
        document.body.dataset.theme = activeTheme;
    }, [activeTheme]);

    if(activeTheme === 'dark'){
        return (
            <button onClick={() => setActiveTheme(inactiveTheme)}>
            <FontAwesomeIcon icon={faSun} />
            </button>
        )
    } else{
        return (
            <button onClick={() => setActiveTheme(inactiveTheme)}>
            <FontAwesomeIcon icon={faMoon} />
            </button>
        )
    }
}

export default ThemeToggle;