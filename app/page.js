import './globals.css'
import Link from 'next/link'

export default function Home() {

  return (
    <main className="min-h-screen flex-col items-center p-24 text-black bold">
      <Link href="/about"><button >About</button></Link>
    </main>
  )
}
