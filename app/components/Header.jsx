'use client';
import Link from 'next/link'
import '../globals.css'
import './Header.css';
import NavBar from './NavBar';
import ThemeToggle from './theme';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const links = [
    {
        href: '/', placeholder: 'Hem'
    },
    {
        href: '/services', placeholder: 'Gruppträning'
    },
    {
        href: '/bookings', placeholder: 'Priser',
    },
]

export default function Header({ style }){
    const path = usePathname();

    return(
        <header
        style={style}
        className='pl-6 top-0 h-full'>
            <ul className="flex flex-row justify-between items-center gap-4 p-2 font-extrabold text-2xl">
                    <li>
                        <Link href="/" className=''>
                            <img src="/images/logo-white.svg" className='w-60' />
                        </Link>
                    </li>

                <div className='hidden md:flex justify-center items-center gap-24 mr-8 '>
                    {links.map((link) => (
                        <li key={link.href}>
                            <motion.div
                            whileHover={{ rotate: 180,
                            rotateY: 50,
                            scaleY: 3 }}>
                                <Link className={`${link.href === path ? "text-yellow-400 font-bold" : ""} text-base`} href={link.href}>{link.placeholder}</Link>
                            </motion.div>
                        </li>
                    ))}
                    <li className='hidden-md'>
                        <ThemeToggle />
                    </li>
                </div>
                <NavBar />
            </ul>
    </header>
    )
}