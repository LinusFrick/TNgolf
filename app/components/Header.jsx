'use client';
import Link from 'next/link'
import '../globals.css'

export default function Header({ style }){
    return(
        <header style={style} className='flex justify-between items-center top-0 h-full'>
                <div>
                    <Link href="/" className=''>
                        <img src="/images/logo-white.svg" className='w-60 pt-2' />
                    </Link>
                </div>
                    <div className="flex-row p-10 justify-around">
                    <ul className="flex flex-row justify-around items-center gap-24 font-extrabold text-2xl">
                        <li>
                            <Link href="/"><h1 className=''>Hem</h1></Link>
                        </li>
                        <li>
                            <Link href="/services" ><h1>Gruppträning</h1></Link>
                        </li> 
                        <li>
                            <Link href="/bookings"><h1>Priser</h1></Link>
                        </li>
                    </ul>
                    </div>
        </header>
    )
}