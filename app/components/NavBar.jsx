import Link from 'next/link';
import { useState } from 'react';

export default function NavBar() {
    const [navbarOpen, setNavbarOpen] = useState(false);

    const handleCloseMenu = () => {
        setNavbarOpen(false);
      };

    return (
        <div>
            <div
            className="space-y-2 block md:hidden toggle cursor-pointer"
            onClick={() => setNavbarOpen((prev) => !prev)}
        >
            <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
            />
            </svg>
        </div>

        <nav
            className={`md:hidden navbar ${navbarOpen ? 'block' : 'hidden'}`} // toggle between 'block' and 'hidden'
        >
            <ul className="flex flex-col justify-center items-center gap-4 p-4 bg-gray-200">
            <li>
                <Link href="/" className="">
                    <img src="/images/logo-white.svg" className="w-60" alt="Logo" />
                </Link>
            </li>

            <li>
                <Link href="/">
                <h1 onClick={handleCloseMenu} className="">Hem</h1>
                </Link>
            </li>

            <li>
                <Link href="/services">
                <h1 onClick={handleCloseMenu}>Gruppträning</h1>
                </Link>
            </li>

            <li>
                <Link href="/bookings">
                <h1 onClick={handleCloseMenu}>Priser</h1>
                </Link>
            </li>
            </ul>
        </nav>
      </div>
    )
}