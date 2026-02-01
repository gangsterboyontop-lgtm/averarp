'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Image from 'next/image'

interface User {
  id: string
  name: string
  discordId: string
  avatar?: string
  trustScore: number
  warnings: Warning[]
}

interface Warning {
  id: string
  reason: string
  note?: string
  issuedAt: string
  issuedBy: string
  severity: 'low' | 'medium' | 'high'
  removedAt?: string
  removedBy?: string
  removalReason?: string
}

export default function TrustAdministration() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAddWarning, setShowAddWarning] = useState(false)
  const [warningForm, setWarningForm] = useState({
    reason: '',
    note: '',
    severity: 'low' as 'low' | 'medium' | 'high',
  })
  const [showRemoveWarning, setShowRemoveWarning] = useState<string | null>(null)
  const [removalReason, setRemovalReason] = useState('')

  // Save warning form to localStorage whenever it changes
  useEffect(() => {
    if (showAddWarning) {
      localStorage.setItem('admin_warning_form', JSON.stringify(warningForm))
    }
  }, [warningForm, showAddWarning])

  // Save removal reason to localStorage
  useEffect(() => {
    if (showRemoveWarning) {
      localStorage.setItem('admin_removal_reason', removalReason)
    }
  }, [removalReason, showRemoveWarning])

  // Load removal reason from localStorage when showing remove warning
  useEffect(() => {
    if (showRemoveWarning) {
      const saved = localStorage.getItem('admin_removal_reason')
      if (saved) {
        setRemovalReason(saved)
      }
    }
  }, [showRemoveWarning])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10

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
    // Load warning form from localStorage
    const savedWarningForm = localStorage.getItem('admin_warning_form')
    if (savedWarningForm) {
      try {
        const parsed = JSON.parse(savedWarningForm)
        setWarningForm(parsed)
      } catch (e) {
        console.error('Error loading warning form from localStorage:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Load users when session is ready
    if (status === 'authenticated' && session) {
      loadUsers()
    }
  }, [status, session])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch users with trust data
      const usersResponse = await fetch('/api/admin/users')
      const usersResult = await usersResponse.json()

      if (!usersResult.success) {
        const errorMsg = usersResult.error || 'Unknown error occurred'
        console.error('Error fetching users:', errorMsg, usersResult.details)
        alert(`Fejl ved indlæsning af brugere: ${errorMsg}`)
        setUsers([])
        setFilteredUsers([])
        setLoading(false)
        return
      }

      const loadedUsers = usersResult.users || []
      
      // Always ensure current user is in the list
      const currentUserId = (session?.user as any)?.id
      if (currentUserId && !loadedUsers.find((u: User) => u.id === currentUserId)) {
        // Add current user if not found
        loadedUsers.push({
          id: currentUserId,
          name: session?.user?.name || `User ${currentUserId}`,
          discordId: currentUserId,
          avatar: (session?.user as any)?.image,
          trustScore: 100,
          warnings: [],
        })
      }
      
      setUsers(loadedUsers)
      setFilteredUsers(loadedUsers)
      setCurrentPage(1) // Reset to first page when loading new data
      
      console.log('Loaded users:', loadedUsers.length, 'Current user ID:', currentUserId)
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase().trim()
      const filtered = users.filter((user) => {
        const name = (user.name || '').toLowerCase()
        const discordId = (user.discordId || '').toLowerCase()
        // Check if query matches name or Discord ID
        return name.includes(query) || discordId.includes(query) || discordId === query
      })
      setFilteredUsers(filtered)
    }
    // Always reset to first page when search changes
    setCurrentPage(1)
  }, [searchQuery, users])

  // Calculate pagination - if searching, show all results, otherwise paginate
  const isSearching = searchQuery.trim().length > 0
  const totalPages = isSearching ? 1 : Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = isSearching ? 0 : (currentPage - 1) * usersPerPage
  const endIndex = isSearching ? filteredUsers.length : startIndex + usersPerPage
  const currentUsers = isSearching ? filteredUsers : filteredUsers.slice(startIndex, endIndex)

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-400/10 border-red-400/30'
      case 'medium':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/30'
      case 'low':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      default:
        return 'text-chrome-gray-400 bg-chrome-gray-400/10 border-chrome-gray-400/30'
    }
  }

  const handleAddWarning = async () => {
    if (!selectedUser || !warningForm.reason) return

    try {
      const response = await fetch('/api/admin/trust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'addWarning',
          value: {
            reason: warningForm.reason,
            note: warningForm.note,
            severity: warningForm.severity,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        const updatedUsers = users.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                trustScore: result.trustScore,
                warnings: result.warnings,
              }
            : user
        )
        setUsers(updatedUsers)
        setFilteredUsers(updatedUsers)

        // Update selected user with fresh data from result
        setSelectedUser({
          ...selectedUser,
          trustScore: result.trustScore,
          warnings: result.warnings,
        })

        setWarningForm({ reason: '', note: '', severity: 'low' })
        setShowAddWarning(false)
        
        // Clear localStorage
        localStorage.removeItem('admin_warning_form')
        
        // Reload users to get updated data from server
        await loadUsers()
      } else {
        alert('Fejl ved tilføjelse af advarsel: ' + result.error)
      }
    } catch (error) {
      console.error('Error adding warning:', error)
      alert('Der opstod en fejl ved tilføjelse af advarslen')
    }
  }

  const handleRemoveWarning = async (warningId: string) => {
    if (!selectedUser || !removalReason.trim()) {
      alert('Du skal angive en grund for at fjerne advarslen')
      return
    }

    try {
      const response = await fetch('/api/admin/trust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'removeWarning',
          value: {
            warningId,
            reason: removalReason,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setUsers(
          users.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  trustScore: result.trustScore,
                  warnings: result.warnings,
                }
              : user
          )
        )

        // Update selected user
        const fullUser = users.find(u => u.id === selectedUser.id)
        if (fullUser) {
          setSelectedUser({
            ...fullUser,
            trustScore: result.trustScore,
            warnings: result.warnings,
          })
        } else {
          setSelectedUser({
            ...selectedUser,
            trustScore: result.trustScore,
            warnings: result.warnings,
          })
        }

        setRemovalReason('')
        setShowRemoveWarning(null)
        
        // Clear localStorage
        localStorage.removeItem('admin_removal_reason')
        
        // Reload users to get updated data
        await loadUsers()
      } else {
        alert('Fejl ved fjernelse af advarsel: ' + result.error)
      }
    } catch (error) {
      console.error('Error removing warning:', error)
      alert('Der opstod en fejl ved fjernelse af advarslen')
    }
  }

  const handleAdjustTrustScore = async (userId: string, adjustment: number) => {
    try {
      const response = await fetch('/api/admin/trust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'adjustScore',
          value: adjustment,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setUsers(
          users.map((user) =>
            user.id === userId
              ? { ...user, trustScore: result.trustScore }
              : user
          )
        )

        // Update selected user if it's the one being adjusted
        if (selectedUser && selectedUser.id === userId) {
          // Fetch updated user data
          const trustResponse = await fetch(`/api/admin/trust?userId=${userId}`)
          const trustResult = await trustResponse.json()
          if (trustResult.success) {
            setSelectedUser({
              ...selectedUser,
              trustScore: trustResult.trustScore,
              warnings: trustResult.warnings,
            })
          }
        }
        
        // Reload users to get updated data
        await loadUsers()
      } else {
        alert('Fejl ved opdatering af trust score: ' + result.error)
      }
    } catch (error) {
      console.error('Error adjusting trust score:', error)
      alert('Der opstod en fejl ved opdatering af trust score')
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
                <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent">
                  Trust Score Administration
                </h1>
                <p className="text-lg text-chrome-gray-300">Administrer trust scores og advarsler for brugere</p>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-chrome-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg shadow-chrome-gray-900/50 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Brugere</h2>
                <div className="text-sm text-chrome-gray-400">
                  Viser {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} af {filteredUsers.length}
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søg efter bruger (navn eller Discord ID)..."
                  className="w-full px-4 py-2 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
                />
                {searchQuery && (
                  <p className="text-xs text-chrome-gray-500 mt-1">
                    Søger efter: "{searchQuery}" - Fundet {filteredUsers.length} resultat(er)
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {currentUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-chrome-gray-400">
                      {searchQuery ? 'Ingen brugere fundet' : 'Ingen brugere'}
                    </p>
                  </div>
                ) : (
                  currentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50 hover:border-green-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                          <p className="text-sm text-chrome-gray-400">Discord ID: {user.discordId}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div>
                              <span className="text-sm text-chrome-gray-400">Trust Score: </span>
                              <span className={`text-lg font-bold ${getTrustScoreColor(user.trustScore)}`}>
                                {user.trustScore}%
                              </span>
                            </div>
                          <div>
                            <span className="text-sm text-chrome-gray-400">Advarsler: </span>
                            <span className="text-lg font-semibold text-white">
                              {user.warnings.filter((w: Warning) => !w.removedAt).length}
                            </span>
                          </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Find the full user data from all users (not just filtered)
                              const fullUser = users.find(u => u.id === user.id) || user
                              setSelectedUser(fullUser)
                              setShowAddWarning(false)
                              // Scroll to details section
                              setTimeout(() => {
                                const detailsElement = document.getElementById('user-details')
                                if (detailsElement) {
                                  detailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }
                              }, 100)
                            }}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-semibold"
                          >
                            Se Detaljer
                          </button>
                          <button
                            onClick={() => handleAdjustTrustScore(user.id, 5)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleAdjustTrustScore(user.id, -5)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                          >
                            -5
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination - Only show when not searching */}
              {!isSearching && totalPages > 1 && (
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
                      // Show first page, last page, current page, and pages around current
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
                                ? 'bg-green-600 text-white'
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

            {/* Selected User Details */}
            {selectedUser && (
              <div id="user-details" className="bg-chrome-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg shadow-chrome-gray-900/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {selectedUser.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                        className="w-16 h-16 rounded-full border-2 border-chrome-gray-600"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-chrome-gray-700 border-2 border-chrome-gray-600 flex items-center justify-center">
                        <svg className="w-8 h-8 text-chrome-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <h2 className="text-2xl font-bold text-white">
                      Detaljer for {selectedUser.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 bg-chrome-gray-700 hover:bg-chrome-gray-600 text-white rounded-lg transition-colors"
                  >
                    Luk
                  </button>
                </div>

                {/* Trust Score Section */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">Trust Score</h3>
                  <div className="flex items-center space-x-4">
                    <div className={`text-4xl font-bold ${getTrustScoreColor(selectedUser.trustScore)}`}>
                      {selectedUser.trustScore}%
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAdjustTrustScore(selectedUser.id, 10)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleAdjustTrustScore(selectedUser.id, -10)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                      >
                        -10
                      </button>
                    </div>
                  </div>
                </div>

                {/* Warnings Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Advarsler</h3>
                    <button
                      onClick={() => setShowAddWarning(true)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold"
                    >
                      Tilføj Advarsel
                    </button>
                  </div>

                  {showAddWarning && (
                    <div className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50 mb-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Ny Advarsel</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-chrome-gray-400 mb-1">Grund *</label>
                          <input
                            type="text"
                            value={warningForm.reason}
                            onChange={(e) => setWarningForm({ ...warningForm, reason: e.target.value })}
                            className="w-full px-3 py-2 bg-chrome-gray-800 border border-chrome-gray-700 rounded-lg text-white"
                            placeholder="Indtast grund til advarslen"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-chrome-gray-400 mb-1">Note</label>
                          <textarea
                            value={warningForm.note}
                            onChange={(e) => setWarningForm({ ...warningForm, note: e.target.value })}
                            className="w-full px-3 py-2 bg-chrome-gray-800 border border-chrome-gray-700 rounded-lg text-white resize-none"
                            placeholder="Tilføj en note (valgfrit)"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-chrome-gray-400 mb-1">Alvorlighed</label>
                          <select
                            value={warningForm.severity}
                            onChange={(e) => setWarningForm({ ...warningForm, severity: e.target.value as any })}
                            className="w-full px-3 py-2 bg-chrome-gray-800 border border-chrome-gray-700 rounded-lg text-white"
                          >
                            <option value="low">Lav</option>
                            <option value="medium">Medium</option>
                            <option value="high">Høj</option>
                          </select>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleAddWarning}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                          >
                            Tilføj
                          </button>
                          <button
                            onClick={() => {
                              setShowAddWarning(false)
                              setWarningForm({ reason: '', note: '', severity: 'low' })
                              localStorage.removeItem('admin_warning_form')
                            }}
                            className="px-4 py-2 bg-chrome-gray-700 hover:bg-chrome-gray-600 text-white rounded-lg font-semibold"
                          >
                            Annuller
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {selectedUser.warnings.length === 0 ? (
                      <p className="text-chrome-gray-400 text-center py-4">Ingen advarsler</p>
                    ) : (
                      selectedUser.warnings
                        .filter((warning) => !warning.removedAt) // Only show active warnings
                        .map((warning) => (
                        <div
                          key={warning.id}
                          className={`p-4 rounded-lg border ${getSeverityColor(warning.severity)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white mb-2">{warning.reason}</h4>
                              {warning.note && (
                                <p className="text-chrome-gray-300 mb-2 italic text-sm">
                                  <span className="text-chrome-gray-400">Note:</span> {warning.note}
                                </p>
                              )}
                              <div className="space-y-1 text-sm">
                                <p className="text-chrome-gray-300">
                                  <span className="text-chrome-gray-400">Udstedt af:</span> {warning.issuedBy}
                                </p>
                                <p className="text-chrome-gray-300">
                                  <span className="text-chrome-gray-400">Dato:</span>{' '}
                                  {new Date(warning.issuedAt).toLocaleDateString('da-DK', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                <p className="text-chrome-gray-300">
                                  <span className="text-chrome-gray-400">Alvorlighed:</span>{' '}
                                  {warning.severity === 'high' ? 'Høj' : warning.severity === 'medium' ? 'Medium' : 'Lav'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setShowRemoveWarning(warning.id)
                                setRemovalReason('')
                              }}
                              className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                            >
                              Fjern
                            </button>
                          </div>
                          {showRemoveWarning === warning.id && (
                            <div className="mt-4 pt-4 border-t border-chrome-gray-700/50">
                              <h5 className="text-sm font-semibold text-white mb-2">Fjern Advarsel</h5>
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs text-chrome-gray-400 mb-1">Grund for fjernelse *</label>
                                  <input
                                    type="text"
                                    value={removalReason}
                                    onChange={(e) => setRemovalReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-chrome-gray-800 border border-chrome-gray-700 rounded-lg text-white text-sm"
                                    placeholder="Indtast grund for at fjerne advarslen"
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleRemoveWarning(warning.id)}
                                    disabled={!removalReason.trim()}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-semibold"
                                  >
                                    Bekræft Fjernelse
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowRemoveWarning(null)
                                      setRemovalReason('')
                                      localStorage.removeItem('admin_removal_reason')
                                    }}
                                    className="px-3 py-1 bg-chrome-gray-700 hover:bg-chrome-gray-600 text-white rounded text-sm font-semibold"
                                  >
                                    Annuller
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
