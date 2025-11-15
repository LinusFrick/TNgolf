'use client';
import Header from './components/Header'
import dynamic from 'next/dynamic';
import React, { useState, useEffect, Suspense } from 'react';
import { useTheme } from './components/useTheme';

const GolfBall = dynamic(() => import('./components/tests/GolfBall'), {
  ssr: false
});

export default function ClientLayout({ children }) {
  const [ScrollBreakPoint, setScrollBreakPoint] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const theme = useTheme();
  const isLight = theme === 'light';

  const checkNavPos = () => {
    const currentScrollY = window.scrollY;
    setScrollBreakPoint(currentScrollY > 100);
    setScrollY(currentScrollY);
    
    // Detect which section is in view
    const sections = [
      document.getElementById('section-1'),
      document.getElementById('section-2'),
      document.getElementById('section-3'),
      document.getElementById('section-4'),
      document.getElementById('section-5'),
    ];
    
    const viewportHeight = window.innerHeight;
    const viewportCenter = window.scrollY + viewportHeight / 2;
    
    // Find which section is closest to viewport center
    let activeSection = 1;
    let minDistance = Infinity;
    
    sections.forEach((section, index) => {
      if (section) {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;
        const sectionBottom = sectionTop + rect.height;
        const sectionCenter = sectionTop + rect.height / 2;
        
        // Check if section is in viewport
        if (rect.top < viewportHeight && rect.bottom > 0) {
          const distance = Math.abs(sectionCenter - viewportCenter);
          if (distance < minDistance) {
            minDistance = distance;
            activeSection = index + 1;
          }
        }
      }
    });
    
    setCurrentSection(activeSection);
  }

  useEffect(() => {
    // Wait for DOM to be ready
    const initDetection = () => {
      const section1 = document.getElementById('section-1');
      if (section1) {
        checkNavPos();
      } else {
        setTimeout(initDetection, 100);
      }
    };
    
    const handleScroll = () => checkNavPos();
    
    window.addEventListener('scroll', handleScroll);
    // Initialize after a short delay to ensure DOM is ready
    setTimeout(initDetection, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const changeHeader = ScrollBreakPoint ? {
    backgroundColor: isLight ? 'white' : 'black',
    position: 'sticky',
    transition: 'all 0.8s ease-in-out',
  } : {
    transition: 'all 1s ease-in-out',
  };

  return (
    <>
      {/* Golf ball at top level - fixed position, lower z-index */}
      <div className="fixed top-0 left-0 w-full h-screen z-[1]">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        }>
          <GolfBall scrollY={scrollY} theme={theme} currentSection={currentSection} />
        </Suspense>
      </div>
      
      {/* Header and content with higher z-index to be clickable */}
      <div className="relative z-50">
        <Header />
        {children}
      </div>
      {/* <Footer /> */}
    </>
  );
}