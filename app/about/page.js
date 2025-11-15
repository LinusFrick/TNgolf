'use client';
import { FaBrain, FaQuoteLeft } from 'react-icons/fa';
import { GiGolfFlag } from 'react-icons/gi';
import { useTheme } from '../components/useTheme';

export default function AboutPage() {
    const theme = useTheme();
    const isLight = theme === 'light';

    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 px-6 md:px-12 lg:px-24">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-yellow-400">
                        Therese "Tess" Nilsson
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
                        Din Personliga Golf- och Mindfulness Coach
                    </p>
                    <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="py-12 px-6 md:px-12 lg:px-24">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Introduction */}
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                            Med över tio års erfarenhet som golftränare och mental tränare, har Therese hjälpt många golfspelare att utvecklas – både på och utanför banan. Hon brinner för att ge sina elever en tydlig väg att följa och en djup förståelse för varje steg de tar i sin golfresa.
                        </p>
                        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                            Therese tror på regelbunden träning för bästa resultat, men även enstaka lektioner kan ge betydande framsteg. Hon anpassar alltid sin coaching efter dina mål och din utveckling, för att säkerställa att du känner dig trygg på banan och att golfglädjen ökar.
                        </p>
                    </div>

                    {/* Coaching Areas */}
                    <div className="mt-16">
                        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-200">
                            Therese erbjuder coaching inom två områden:
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-8 mt-12">
                            {/* Golf Training */}
                            <div className={`p-8 rounded-lg border-2 transition-all duration-300 ${
                                isLight 
                                    ? 'bg-blue-50 border-blue-200 hover:border-blue-400' 
                                    : 'bg-gray-800 border-gray-700 hover:border-yellow-400'
                            }`}>
                                <div className="flex items-center mb-4">
                                    <div className={`p-3 rounded-full mr-4 ${
                                        isLight ? 'bg-blue-100' : 'bg-yellow-400/20'
                                    }`}>
                                        <GiGolfFlag className={`text-3xl ${
                                            isLight ? 'text-blue-600' : 'text-yellow-400'
                                        }`} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                                        Golfträning
                                    </h3>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    För dig som vill förbättra ditt tekniska spel och få en mer konsekvent prestation på banan.
                                </p>
                            </div>

                            {/* Mental Training */}
                            <div className={`p-8 rounded-lg border-2 transition-all duration-300 ${
                                isLight 
                                    ? 'bg-green-50 border-green-200 hover:border-green-400' 
                                    : 'bg-gray-800 border-gray-700 hover:border-yellow-400'
                            }`}>
                                <div className="flex items-center mb-4">
                                    <div className={`p-3 rounded-full mr-4 ${
                                        isLight ? 'bg-green-100' : 'bg-yellow-400/20'
                                    }`}>
                                        <FaBrain className={`text-3xl ${
                                            isLight ? 'text-green-600' : 'text-yellow-400'
                                        }`} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                                        Mental träning (Golf & Mind)
                                    </h3>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    För dig som vill arbeta med din mentala styrka och fokus för att hantera utmaningar på banan och i livet.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mission Statement */}
                    <div className={`mt-16 p-8 rounded-lg ${
                        isLight 
                            ? 'bg-gradient-to-r from-blue-50 to-green-50' 
                            : 'bg-gradient-to-r from-gray-800 to-gray-700'
                    }`}>
                        <p className="text-xl leading-relaxed text-center text-gray-800 dark:text-gray-200 font-medium">
                            Målet är alltid samma: att öka din golfglädje, ge dig en känsla av trygghet på banan och att inspirera dig att bli den bästa versionen av dig själv – både som golfspelare och som person.
                        </p>
                    </div>
                </div>
            </section>

            {/* Testimonials Section (Placeholder) */}
            <section className="py-16 px-6 md:px-12 lg:px-24 bg-gray-100 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center text-gray-800 dark:text-gray-200">
                        Vad säger eleverna?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Placeholder for testimonials */}
                        <div className={`p-6 rounded-lg ${
                            isLight ? 'bg-white' : 'bg-gray-800'
                        }`}>
                            <FaQuoteLeft className={`text-3xl mb-4 ${
                                isLight ? 'text-blue-400' : 'text-yellow-400'
                            }`} />
                            <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                                "Här kan du lägga in citat från dina elever när du har feedback."
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                                — Elev
                            </p>
                        </div>
                        <div className={`p-6 rounded-lg ${
                            isLight ? 'bg-white' : 'bg-gray-800'
                        }`}>
                            <FaQuoteLeft className={`text-3xl mb-4 ${
                                isLight ? 'text-green-400' : 'text-yellow-400'
                            }`} />
                            <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                                "Här kan du lägga in fler citat från elever som bekräftar din metod."
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                                — Elev
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Image Placeholder Section */}
            <section className="py-12 px-6 md:px-12 lg:px-24">
                <div className="max-w-4xl mx-auto text-center">
                    <div className={`w-full h-64 md:h-96 rounded-lg flex items-center justify-center ${
                        isLight 
                            ? 'bg-gradient-to-br from-blue-100 to-green-100' 
                            : 'bg-gradient-to-br from-gray-800 to-gray-700'
                    }`}>
                        <p className="text-gray-600 dark:text-gray-400">
                            [Plats för professionell bild på Therese när hon coachar eller spelar golf]
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
