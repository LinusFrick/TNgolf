import './globals.css'
import { Inter } from 'next/font/google'
import ClientLayout from './ClientLayout'
import Providers from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'TN Golf',
  description: 'Golf coaching and mental training',
}

export default function RootLayout({ children }) {
  return (
    <html lang="sv" className={inter.variable}>
      <body className={inter.className}>
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  )
}