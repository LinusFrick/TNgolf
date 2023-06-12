'use client';
import Link from 'next/link'
import '../globals.css'
import './Header.css';
import NavBar from './NavBar';

export default function Header({ style }){

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
                    <li>
                        <Link href="/"><h1 className=''>Hem</h1></Link>
                    </li>

                    <li>
                        <Link href="/services" ><h1>Gruppträning</h1></Link>
                    </li> 

                    <li>
                        <Link href="/bookings"><h1>Priser</h1></Link>
                    </li>
                </div> 
                <NavBar />
            </ul>
    </header>
    )
}