'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Image from 'next/image'

interface LogEntry {
  id: string
  action: string
  userId: string
  userName: string
  details: string
  timestamp: string
}

export default function LogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 50

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
      loadLogs()
    }
  }, [status, session])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/logs?limit=1000')
      const result = await response.json()

      if (result.success) {
        setLogs(result.logs || [])
        setFilteredLogs(result.logs || [])
      } else {
        console.error('Error loading logs:', result.error)
        setLogs([])
        setFilteredLogs([])
      }
    } catch (error) {
      console.error('Error loading logs:', error)
      setLogs([])
      setFilteredLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Filter logs based on search query and action filter
  useEffect(() => {
    let filtered = logs

    // Filter by action
    if (filterAction) {
      filtered = filtered.filter((log) => log.action === filterAction)
    }

    // Filter by search query (userId, userName, or details)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((log) => {
        const userId = (log.userId || '').toLowerCase()
        const userName = (log.userName || '').toLowerCase()
        const details = (log.details || '').toLowerCase()
        const action = (log.action || '').toLowerCase()
        return (
          userId.includes(query) ||
          userName.includes(query) ||
          details.includes(query) ||
          action.includes(query)
        )
      })
    }

    setFilteredLogs(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, filterAction, logs])

  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map((log) => log.action))).sort()

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)
  const startIndex = (currentPage - 1) * logsPerPage
  const endIndex = startIndex + logsPerPage
  const currentLogs = filteredLogs.slice(startIndex, endIndex)

  const getActionColor = (action: string) => {
    if (action.includes('warning')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
    if (action.includes('trust')) return 'text-green-400 bg-green-400/10 border-green-400/30'
    if (action.includes('application')) return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
    if (action.includes('error')) return 'text-red-400 bg-red-400/10 border-red-400/30'
    return 'text-chrome-gray-400 bg-chrome-gray-400/10 border-chrome-gray-400/30'
  }

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <Link
                  href="/admin"
                  className="text-chrome-gray-400 hover:text-white transition mb-2 inline-block"
                >
                  ← Tilbage til Admin Panel
                </Link>
                <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 bg-clip-text text-transparent">
                  System Logs
                </h1>
                <p className="text-lg text-chrome-gray-300">Se system logs og aktivitetshistorik</p>
              </div>
              <button
                onClick={loadLogs}
                className="px-4 py-2 bg-chrome-gray-700 hover:bg-chrome-gray-600 text-white rounded-lg transition-colors font-semibold"
              >
                Opdater
              </button>
            </div>

            {/* Filters */}
            <div className="bg-chrome-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg shadow-chrome-gray-900/50 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm text-chrome-gray-400 mb-2">Søg</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Søg efter bruger, handling eller detaljer..."
                    className="w-full px-4 py-2 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-gray-500/50 transition-colors"
                  />
                </div>

                {/* Action Filter */}
                <div>
                  <label className="block text-sm text-chrome-gray-400 mb-2">Filtrer efter handling</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full px-4 py-2 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white focus:outline-none focus:border-gray-500/50 transition-colors"
                  >
                    <option value="">Alle handlinger</option>
                    {uniqueActions.map((action) => (
                      <option key={action} value={action}>
                        {formatAction(action)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center justify-between text-sm text-chrome-gray-400">
                <div>
                  Viser {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} af {filteredLogs.length} logs
                </div>
                {filterAction && (
                  <button
                    onClick={() => setFilterAction('')}
                    className="text-gray-400 hover:text-white transition"
                  >
                    Ryd filter
                  </button>
                )}
              </div>
            </div>

            {/* Logs List */}
            <div className="bg-chrome-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg shadow-chrome-gray-900/50">
              {currentLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-chrome-gray-400">
                    {searchQuery || filterAction ? 'Ingen logs fundet' : 'Ingen logs endnu'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50 hover:border-gray-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span
                              className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getActionColor(
                                log.action
                              )}`}
                            >
                              {formatAction(log.action)}
                            </span>
                            <span className="text-sm text-chrome-gray-400">
                              {new Date(log.timestamp).toLocaleString('da-DK', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="text-sm text-chrome-gray-300 mb-1">
                            <span className="text-chrome-gray-400">Bruger:</span> {log.userName} (
                            {log.userId})
                          </div>
                          {log.details && (
                            <div className="text-sm text-chrome-gray-300">
                              <span className="text-chrome-gray-400">Detaljer:</span> {log.details}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-chrome-gray-700 hover:bg-chrome-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Forrige
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-gray-600 text-white'
                                : 'bg-chrome-gray-700 hover:bg-chrome-gray-600 text-white'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 text-chrome-gray-400">...</span>
                      }
                      return null
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-chrome-gray-700 hover:bg-chrome-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Næste
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
