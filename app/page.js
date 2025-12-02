'use client';

export default function Home() {
  return (
      <main className="min-h-screen flex-col items-center text-black bold pb-16 md:pb-0" role="main">
        {/* Section 1 - Hem */}
        <section id="section-1" className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8" aria-labelledby="section-1-heading">
          <div className="text-center max-w-4xl mx-auto">
            <h1 id="section-1-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Hem</h1>
          </div>
        </section>
        
        {/* Section 2 - Om Oss */}
        <section id="section-2" className="min-h-screen flex items-center justify-center bg-gradient-to-b from-transparent to-gray-100 dark:to-gray-800 px-4 sm:px-6 md:px-8" aria-labelledby="section-2-heading">
          <div className="text-center max-w-4xl mx-auto">
            <h2 id="section-2-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">Om Oss</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 px-4">
              Information om oss kommer här
            </p>
          </div>
        </section>
        
        {/* Section 3 - Tjänster */}
        <section id="section-3" className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8" aria-labelledby="section-3-heading">
          <div className="text-center max-w-4xl mx-auto">
            <h2 id="section-3-heading" className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 sm:mb-6">Tjänster</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 px-4">
              Våra tjänster kommer här
            </p>
          </div>
        </section>
        
        {/* Section 4 - Priser */}
        <section id="section-4" className="min-h-screen flex items-center justify-center bg-gradient-to-b from-transparent to-gray-100 dark:to-gray-800 px-4 sm:px-6 md:px-8" aria-labelledby="section-4-heading">
          <div className="text-center max-w-4xl mx-auto">
            <h2 id="section-4-heading" className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 sm:mb-6">Priser</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 px-4">
              Våra priser och paket
            </p>
          </div>
        </section>
        
        {/* Section 5 - Kontakt */}
        <section id="section-5" className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8" aria-labelledby="section-5-heading">
          <div className="text-center max-w-4xl mx-auto">
            <h2 id="section-5-heading" className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 sm:mb-6">Kontakt</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 px-4">
              Kontakta oss här
            </p>
          </div>
        </section>
      </main>
  )
}

