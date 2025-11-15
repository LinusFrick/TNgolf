'use client';

export default function Home() {
  return (
      <main className="min-h-screen flex-col items-center text-black bold">
        {/* Section 1 - Hem */}
        <section id="section-1" className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Hem</h1>
          </div>
        </section>
        
        {/* Section 2 - Om Oss */}
        <section id="section-2" className="h-screen flex items-center justify-center bg-gradient-to-b from-transparent to-gray-100 dark:to-gray-800">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Om Oss</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Information om oss kommer här
            </p>
          </div>
        </section>
        
        {/* Section 3 - Tjänster (Where ball rolls right) */}
        <section id="section-3" className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-3xl font-semibold mb-4">Tjänster</h3>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Watch the ball roll right
            </p>
          </div>
        </section>
        
        {/* Section 4 - Priser */}
        <section id="section-4" className="h-screen flex items-center justify-center bg-gradient-to-b from-transparent to-gray-100 dark:to-gray-800">
          <div className="text-center">
            <h3 className="text-3xl font-semibold mb-4">Priser</h3>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Våra priser och paket
            </p>
          </div>
        </section>
        
        {/* Section 5 - Kontakt */}
        <section id="section-5" className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-3xl font-semibold mb-4">Kontakt</h3>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Kontakta oss här
            </p>
          </div>
        </section>
      </main>
  )
}

