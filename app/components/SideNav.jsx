'use client';
import { useTheme } from './useTheme';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useIsCoach } from '../lib/useIsCoach';

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
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isCoach, isLoading: isCheckingCoach } = useIsCoach();

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
    <nav 
      className={`hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 ${navBgColor} backdrop-blur-md rounded-r-2xl shadow-2xl border-r-2 ${borderColor} transition-all duration-300
        md:py-4 md:px-3 lg:py-6 lg:px-4`}
      aria-label="Sidnavigering"
    >
      <ul className="flex flex-col md:gap-2.5 lg:gap-3.5" role="list">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              aria-label={`Gå till ${section.label}`}
              aria-current={activeSection === section.id ? 'true' : 'false'}
              className={`w-full text-left rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px]
                md:px-3 md:py-2.5 md:text-sm
                lg:px-4 lg:py-3 lg:text-base
                font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
                ${
                activeSection === section.id
                  ? isLight
                    ? 'text-yellow-500 bg-yellow-500/20'
                    : 'text-yellow-400 bg-yellow-400/20'
                  : isLight
                    ? 'text-gray-200 hover:text-yellow-500 hover:bg-gray-700/50'
                    : 'text-white hover:text-yellow-300 hover:bg-gray-700/50'
              }`}
            >
              {section.label}
            </button>
          </li>
        ))}
        {/* Conditional link based on user role */}
        <li className="md:mt-1 lg:mt-1.5">
          {isCheckingCoach ? (
            // Skeleton loader while checking coach status - show skeleton if checking OR if we have session and still checking
            <div 
              className={`w-full rounded-lg min-h-[44px] animate-pulse ${
                isLight ? 'bg-gray-700/30' : 'bg-gray-700/50'
              }`}
              aria-label="Laddar..."
              role="status"
            >
              <div className={`h-full w-3/4 rounded ${
                isLight ? 'bg-gray-600/30' : 'bg-gray-600/50'
              }`}></div>
            </div>
          ) : isCoach ? (
            // Admin link - only for coach
            <Link
              href="/admin"
              aria-label="Coach Dashboard"
              aria-current={pathname === '/admin' ? 'page' : undefined}
              className={`w-full text-left rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px]
                md:px-3 md:py-2.5 md:text-sm
                lg:px-4 lg:py-3 lg:text-base
                font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
                ${
                pathname === '/admin'
                  ? isLight
                    ? 'text-yellow-500 bg-yellow-500/20'
                    : 'text-yellow-400 bg-yellow-400/20'
                  : isLight
                    ? 'text-gray-200 hover:text-yellow-500 hover:bg-gray-700/50'
                    : 'text-white hover:text-yellow-300 hover:bg-gray-700/50'
              }`}
            >
              Admin
            </Link>
          ) : session ? (
            // Mitt GolfMind - for logged in regular users
            <Link
              href="/boka"
              aria-label="Visa mitt GolfMind"
              aria-current={pathname === '/boka' ? 'page' : undefined}
              className={`w-full text-left rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px]
                md:px-3 md:py-2.5 md:text-sm
                lg:px-4 lg:py-3 lg:text-base
                font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
                ${
                pathname === '/boka'
                  ? isLight
                    ? 'text-yellow-500 bg-yellow-500/20'
                    : 'text-yellow-400 bg-yellow-400/20'
                  : isLight
                    ? 'text-gray-200 hover:text-yellow-500 hover:bg-gray-700/50'
                    : 'text-white hover:text-yellow-300 hover:bg-gray-700/50'
              }`}
            >
              Mitt GolfMind
            </Link>
          ) : (
            // Boka - for non-logged in users
            <Link
              href="/boka"
              aria-label="Boka en tid"
              aria-current={pathname === '/boka' ? 'page' : undefined}
              className={`w-full text-left rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px]
                md:px-3 md:py-2.5 md:text-sm
                lg:px-4 lg:py-3 lg:text-base
                font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
                ${
                pathname === '/boka'
                  ? isLight
                    ? 'text-yellow-500 bg-yellow-500/20'
                    : 'text-yellow-400 bg-yellow-400/20'
                  : isLight
                    ? 'text-gray-200 hover:text-yellow-500 hover:bg-gray-700/50'
                    : 'text-white hover:text-yellow-300 hover:bg-gray-700/50'
              }`}
            >
              Boka
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

