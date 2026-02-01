'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Image from 'next/image'

interface ServerSettings {
  hostname: string
  port: number
  environment: string
  nodeVersion: string
  nextVersion: string
}

export default function ServerSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<ServerSettings>({
    hostname: '0.0.0.0',
    port: 3000,
    environment: 'development',
    nodeVersion: '',
    nextVersion: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
      return
    }

    const isAdmin = (session?.user as any)?.isAdmin || false
    if (!isAdmin) {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session) {
      loadSettings()
    }
  }, [status, session])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // Load from package.json or environment
      const response = await fetch('/api/admin/server-settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      
      const response = await fetch('/api/admin/server-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Indstillinger gemt succesfuldt!' })
        // Update package.json
        setTimeout(() => {
          setMessage(null)
        }, 3000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Fejl ved gemning af indstillinger' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Der opstod en fejl ved gemning af indstillinger' })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const isAdmin = (session?.user as any)?.isAdmin || false
  if (!isAdmin || !session) {
    return null
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/billed/billed1.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-chrome-gray-900/60 via-chrome-gray-900/50 to-chrome-gray-900/60"></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <main className="relative pt-32 pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/admin"
                className="text-chrome-gray-400 hover:text-white transition mb-2 inline-block"
              >
                ← Tilbage til Admin Panel
              </Link>
              <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
                Server Indstillinger
              </h1>
              <p className="text-lg text-chrome-gray-300">Konfigurer server indstillinger og funktioner</p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Settings Form */}
            <div className="bg-chrome-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg shadow-chrome-gray-900/50">
              <div className="space-y-6">
                {/* Hostname Setting */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Hostname
                  </label>
                  <p className="text-xs text-chrome-gray-400 mb-2">
                    IP-adresse eller hostname serveren skal lytte på. Brug 0.0.0.0 for at tillade adgang fra alle netværksinterfaces.
                  </p>
                  <input
                    type="text"
                    value={settings.hostname}
                    onChange={(e) => setSettings({ ...settings, hostname: e.target.value })}
                    className="w-full px-4 py-2 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                    placeholder="0.0.0.0"
                  />
                </div>

                {/* Port Setting */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Port
                  </label>
                  <p className="text-xs text-chrome-gray-400 mb-2">
                    Port nummer serveren skal køre på. Standard er 3000.
                  </p>
                  <input
                    type="number"
                    value={settings.port}
                    onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) || 3000 })}
                    className="w-full px-4 py-2 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                    placeholder="3000"
                    min="1"
                    max="65535"
                  />
                </div>

                {/* Environment Info */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Miljø
                  </label>
                  <p className="text-xs text-chrome-gray-400 mb-2">
                    Nuværende miljø (read-only)
                  </p>
                  <input
                    type="text"
                    value={settings.environment}
                    disabled
                    className="w-full px-4 py-2 bg-chrome-gray-900/30 border border-chrome-gray-700/30 rounded-lg text-chrome-gray-400 cursor-not-allowed"
                  />
                </div>

                {/* Server Info */}
                <div className="pt-4 border-t border-chrome-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">Server Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50">
                      <p className="text-xs text-chrome-gray-400 mb-1">Node.js Version</p>
                      <p className="text-white font-semibold">
                        {settings.nodeVersion || 'Indlæser...'}
                      </p>
                    </div>
                    <div className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50">
                      <p className="text-xs text-chrome-gray-400 mb-1">Next.js Version</p>
                      <p className="text-white font-semibold">
                        {settings.nextVersion || 'Indlæser...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-chrome-gray-700/50">
                  <Link
                    href="/admin"
                    className="px-6 py-2 bg-chrome-gray-700 hover:bg-chrome-gray-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    Annuller
                  </Link>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                  >
                    {saving ? 'Gemmer...' : 'Gem Indstillinger'}
                  </button>
                </div>

                {/* Warning */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-yellow-400 mb-1">Vigtigt</p>
                      <p className="text-xs text-yellow-300/80">
                        Ændringer i server indstillinger kræver en genstart af serveren for at træde i kraft. 
                        Sørg for at gemme alle vigtige data før genstart.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
