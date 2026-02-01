'use client'

import Navigation from '@/components/Navigation'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Background Images */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-chrome-gray-900 via-chrome-gray-900/95 to-chrome-gray-900"></div>
        <Image
          src="/billed/billed1.png"
          alt="Background"
          fill
          className="object-cover opacity-30"
          priority
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 pb-24">
          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-chrome-gray-100 via-white to-chrome-gray-200 bg-clip-text text-transparent">
              Velkommen til Avera
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button className="bg-gradient-to-br from-chrome-gray-500 to-chrome-gray-700 hover:from-chrome-gray-400 hover:to-chrome-gray-600 text-white px-8 py-3 rounded-lg transition-all font-semibold border border-chrome-gray-400/30 shadow-lg shadow-chrome-gray-900/50">
                Send ansøgning
              </button>
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-chrome-gray-500 to-chrome-gray-700 hover:from-chrome-gray-400 hover:to-chrome-gray-600 text-white px-8 py-3 rounded-lg transition-all font-semibold border border-chrome-gray-400/30 shadow-lg shadow-chrome-gray-900/50 inline-block text-center"
              >
                Discord
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
