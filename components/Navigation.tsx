'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'

export default function Navigation() {
  const { data: session } = useSession()
  
  // Check if user is admin based on Discord roles
  const isAdmin = (session?.user as any)?.isAdmin || false

  return (
    <nav className="bg-gradient-to-b from-chrome-gray-700/95 via-chrome-gray-800/95 to-chrome-gray-900/95 backdrop-blur-md border-b border-chrome-gray-500/40 sticky top-0 z-50 shadow-xl shadow-chrome-gray-900/50 relative overflow-hidden">
      <div className="absolute inset-0 chrome-wave"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/billed/logo.png"
              alt="Avera Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-chrome-gray-100 to-chrome-gray-300 bg-clip-text text-transparent">Avera</span>
          </Link>
          <div className="hidden md:flex space-x-6 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="text-chrome-gray-300 hover:text-white transition">
              Hjem
            </Link>
            <Link href="/regler" className="text-chrome-gray-300 hover:text-white transition">
              Regler
            </Link>
            <Link href="/ansogninger" className="text-chrome-gray-300 hover:text-white transition">
              Ansøgninger
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-red-400 hover:text-red-300 transition font-semibold">
                Admin Panel
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <Link
                href="/dashboard"
                className="bg-chrome-gray-800/80 border border-chrome-gray-700/50 rounded-lg px-3 py-2 flex items-center space-x-2 hover:bg-chrome-gray-700/80 transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <span className="text-white text-sm">{session.user?.name}</span>
              </Link>
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="bg-chrome-gray-900 hover:bg-chrome-gray-800 text-white px-4 py-2 rounded-lg transition-all border border-chrome-gray-600 hover:border-chrome-gray-500 flex items-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
