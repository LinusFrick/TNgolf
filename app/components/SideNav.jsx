'use client';
import { useTheme } from './useTheme';
import { useState, useEffect } from 'react';

const sections = [
  { id: 'section-1', label: 'Hem' },
  { id: 'section-2', label: 'Om Oss' },
  { id: 'section-3', label: 'Tjänster' },
  { id: 'section-4', label: 'Priser' },
  { id: 'section-5', label: 'Kontakt' },
];

export default function SideNav() {
  const theme = useTheme();
  const isLight = theme === 'light';
  const [activeSection, setActiveSection] = useState('section-1');

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      // Find which section is currently in view
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section) {
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + window.scrollY;
          const sectionBottom = sectionTop + rect.height;
          
          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme-consistent darker shade background with curved border
  const navBgColor = isLight 
    ? 'bg-gray-800/95' 
    : 'bg-gray-900/95';
  
  // Darker shade border - darker than background
  const borderColor = isLight
    ? 'border-gray-900/50'
    : 'border-gray-950/60';

  return (
    <nav className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 ${navBgColor} backdrop-blur-md rounded-r-2xl shadow-2xl border-r-2 ${borderColor} p-6 transition-all duration-300`}>
      <ul className="flex flex-col gap-4">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                activeSection === section.id
                  ? isLight
                    ? 'text-yellow-500 font-bold bg-yellow-500/20'
                    : 'text-yellow-400 font-bold bg-yellow-400/20'
                  : isLight
                    ? 'text-gray-200 hover:text-yellow-500 hover:bg-gray-700/50'
                    : 'text-white hover:text-yellow-300 hover:bg-gray-700/50'
              }`}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

