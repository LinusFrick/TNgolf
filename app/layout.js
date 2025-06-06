'use client';
import Footer from './components/Footer'
import Header from './components/Header'
import GolfBall from './components/tests/GolfBall';
import './globals.css'
import { Inter } from 'next/font/google'
import React, { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({ children }) {
  const [ScrollBreakPoint, setScrollBreakPoint] = useState(false);

  const checkNavPos = () => {
    setScrollBreakPoint(window.scrollY > 100);
  }

  useEffect(() => {
    window.addEventListener('scroll', checkNavPos);
    return () => {
      window.removeEventListener('scroll', checkNavPos);
    };
  }, [ScrollBreakPoint]);

  const changeHeader = ScrollBreakPoint ? {
    backgroundColor: 'black',
    position: 'sticky',
    transition: 'all 0.8s ease-in-out',
  } : {
    transition: 'all 1s ease-in-out',
  };

  return (
    <html lang="en">
      <body className={inter.className}>
            <Header style={changeHeader} />
                {children}
                <GolfBall />
            {/* <Footer /> */}
      </body>
    </html>
  )
}