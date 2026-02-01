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
  roles?: string[]
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

interface Application {
  id: string
  type: string
  status: 'pending' | 'accepted' | 'rejected'
  submitted_at: string
  reviewed_at?: string
}

interface UserNote {
  id: string
  userId: string
  content: string
  imageUrl?: string
  createdAt: string
  createdBy: string
}

export default function UserAdministration() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userApplications, setUserApplications] = useState<Application[]>([])
  const [userNotes, setUserNotes] = useState<UserNote[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [trustFilter, setTrustFilter] = useState<string>('')
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteImage, setNoteImage] = useState<string | null>(null)
  const [noteImageFile, setNoteImageFile] = useState<File | null>(null)
  const [showBanModal, setShowBanModal] = useState(false)
  const [banUser, setBanUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banning, setBanning] = useState(false)
  const [showUnbanModal, setShowUnbanModal] = useState(false)
  const [unbanUser, setUnbanUser] = useState<User | null>(null)
  const [unbanReason, setUnbanReason] = useState('')
  const [restoreWhitelist, setRestoreWhitelist] = useState(false)
  const [unbanning, setUnbanning] = useState(false)
  const usersPerPage = 20
  const BAN_ROLE_ID = '1459894685051916448'
  const WHITELIST_ROLE_ID = '1459894678336831552'

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
      loadUsers()
    }
  }, [status, session])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const result = await response.json()

      if (result.success) {
        setUsers(result.users || [])
        setFilteredUsers(result.users || [])
      } else {
        console.error('Error loading users:', result.error)
        alert(`Fejl ved indlæsning af brugere: ${result.error}`)
        setUsers([])
        setFilteredUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadUserApplications = async (userId: string) => {
    try {
      const response = await fetch(`/api/applications?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setUserApplications(
          result.applications.map((app: any) => ({
            id: app.id,
            type: app.type,
            status: app.status,
            submitted_at: app.submitted_at,
            reviewed_at: app.reviewed_at,
          }))
        )
      }
    } catch (error) {
      console.error('Error loading user applications:', error)
      setUserApplications([])
    }
  }

  // Filter users based on search query and trust filter
  useEffect(() => {
    let filtered = users

    // Filter by trust score
    if (trustFilter) {
      if (trustFilter === 'high') {
        filtered = filtered.filter((user) => user.trustScore >= 80)
      } else if (trustFilter === 'medium') {
        filtered = filtered.filter((user) => user.trustScore >= 60 && user.trustScore < 80)
      } else if (trustFilter === 'low') {
        filtered = filtered.filter((user) => user.trustScore < 60)
      } else if (trustFilter === 'warnings') {
        filtered = filtered.filter((user) => user.warnings.filter((w) => !w.removedAt).length > 0)
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((user) => {
        const name = (user.name || '').toLowerCase()
        const discordId = (user.discordId || '').toLowerCase()
        return name.includes(query) || discordId.includes(query)
      })
    }

    setFilteredUsers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, trustFilter, users])

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getTrustScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-400/10 border-green-400/30'
    if (score >= 60) return 'bg-yellow-400/10 border-yellow-400/30'
    if (score >= 40) return 'bg-orange-400/10 border-orange-400/30'
    return 'bg-red-400/10 border-red-400/30'
  }

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user)
    await loadUserApplications(user.id)
    await loadUserNotes(user.id)
    setShowAddNote(false)
    setNoteContent('')
    setNoteImage(null)
    setNoteImageFile(null)
  }

  const loadUserNotes = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/notes?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setUserNotes(result.notes || [])
      }
    } catch (error) {
      console.error('Error loading user notes:', error)
      setUserNotes([])
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Billedet er for stort. Maksimal størrelse er 5MB.')
        return
      }
      
      setNoteImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setNoteImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddNote = async () => {
    if (!selectedUser || !noteContent.trim()) {
      alert('Du skal indtaste en note')
      return
    }

    try {
      const response = await fetch('/api/admin/users/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          content: noteContent,
          image: noteImage,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadUserNotes(selectedUser.id)
        setNoteContent('')
        setNoteImage(null)
        setNoteImageFile(null)
        setShowAddNote(false)
      } else {
        alert('Fejl ved tilføjelse af note: ' + result.error)
      }
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Der opstod en fejl ved tilføjelse af noten')
    }
  }

  const handleBanUser = async () => {
    if (!banUser || !banReason.trim()) {
      alert('Du skal indtaste en grund for ban')
      return
    }

    try {
      setBanning(true)
      const response = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: banUser.discordId,
          reason: banReason.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Bruger ${banUser.name} er blevet banned. Grund: ${banReason.trim()}`)
        setShowBanModal(false)
        setBanUser(null)
        setBanReason('')
        // Reload users to reflect changes
        await loadUsers()
      } else {
        alert('Fejl ved banning af bruger: ' + result.error)
      }
    } catch (error) {
      console.error('Error banning user:', error)
      alert('Der opstod en fejl ved banning af brugeren')
    } finally {
      setBanning(false)
    }
  }

  const handleUnbanUser = async () => {
    if (!unbanUser || !unbanReason.trim()) {
      alert('Du skal indtaste en grund for unban')
      return
    }

    try {
      setUnbanning(true)
      const response = await fetch('/api/admin/users/unban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: unbanUser.discordId,
          reason: unbanReason.trim(),
          restoreWhitelist: restoreWhitelist,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Bruger ${unbanUser.name} er blevet unbanned. Grund: ${unbanReason.trim()}${restoreWhitelist ? ' Whitelist er blevet givet tilbage.' : ''}`)
        setShowUnbanModal(false)
        setUnbanUser(null)
        setUnbanReason('')
        setRestoreWhitelist(false)
        // Reload users to reflect changes
        await loadUsers()
      } else {
        alert('Fejl ved unbanning af bruger: ' + result.error)
      }
    } catch (error) {
      console.error('Error unbanning user:', error)
      alert('Der opstod en fejl ved unbanning af brugeren')
    } finally {
      setUnbanning(false)
    }
  }

  const getTypeText = (type: string) => {
    const types: Record<string, string> = {
      whitelist: 'Whitelist',
      staff: 'Staff',
      politi: 'Politi',
      firma: 'Firma',
      bande: 'Bande',
    }
    return types[type] || type
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepteret'
      case 'rejected':
        return 'Afvist'
      case 'pending':
        return 'Afventer'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/30'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      default:
        return 'text-chrome-gray-400 bg-chrome-gray-400/10 border-chrome-gray-400/30'
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
                <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                  Bruger Administration
                </h1>
                <p className="text-lg text-chrome-gray-300">Administrer brugere, roller og tilladelser</p>
              </div>
              <button
                onClick={loadUsers}
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
                    placeholder="Søg efter navn eller Discord ID..."
                    className="w-full px-4 py-2 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                {/* Trust Filter */}
                <div>
                  <label className="block text-sm text-chrome-gray-400 mb-2">Filtrer efter Trust Score</label>
                  <select
                    value={trustFilter}
                    onChange={(e) => setTrustFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  >
                    <option value="">Alle brugere</option>
                    <option value="high">Høj (80+)</option>
                    <option value="medium">Medium (60-79)</option>
                    <option value="low">Lav (&lt;60)</option>
                    <option value="warnings">Med advarsler</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center justify-between text-sm text-chrome-gray-400">
                <div>
                  Viser {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} af {filteredUsers.length} brugere
                </div>
                {(searchQuery || trustFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setTrustFilter('')
                    }}
                    className="text-gray-400 hover:text-white transition"
                  >
                    Ryd filtre
                  </button>
                )}
              </div>
            </div>

            {/* Users List */}
            <div className="bg-chrome-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg shadow-chrome-gray-900/50">
              {currentUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-chrome-gray-400">
                    {searchQuery || trustFilter ? 'Ingen brugere fundet' : 'Ingen brugere'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-12 h-12 rounded-full border-2 border-chrome-gray-600"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-chrome-gray-700 border-2 border-chrome-gray-600 flex items-center justify-center">
                              <svg className="w-6 h-6 text-chrome-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
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
                                  {user.warnings.filter((w) => !w.removedAt).length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/admin/trust?userId=${user.id}`}>
                            <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold">
                              Trust Score
                            </button>
                          </Link>
                          <button
                            onClick={() => handleUserSelect(user)}
                            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-semibold"
                          >
                            Se Detaljer
                          </button>
                          {user.roles?.includes(BAN_ROLE_ID) ? (
                            <button
                              onClick={() => {
                                setUnbanUser(user)
                                setShowUnbanModal(true)
                                setUnbanReason('')
                                setRestoreWhitelist(false)
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setBanUser(user)
                                setShowBanModal(true)
                                setBanReason('')
                              }}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                            >
                              Ban
                            </button>
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
                                ? 'bg-blue-600 text-white'
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

            {/* User Details Modal */}
            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-chrome-gray-800 rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="flex items-center justify-between mb-4">
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
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedUser.name}</h2>
                        {selectedUser.roles?.includes(BAN_ROLE_ID) && (
                          <span className="inline-block mt-1 px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm font-semibold">
                            Banned
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null)
                        setUserApplications([])
                        setUserNotes([])
                        setShowAddNote(false)
                        setNoteContent('')
                        setNoteImage(null)
                        setNoteImageFile(null)
                      }}
                      className="text-chrome-gray-400 hover:text-white transition"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* User Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Bruger Information</h3>
                      <div className="bg-chrome-gray-900/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-chrome-gray-400">Discord ID:</span>
                          <span className="text-white">{selectedUser.discordId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-chrome-gray-400">Trust Score:</span>
                          <span className={`font-bold ${selectedUser.roles?.includes(BAN_ROLE_ID) ? 'text-red-400' : getTrustScoreColor(selectedUser.trustScore)}`}>
                            {selectedUser.roles?.includes(BAN_ROLE_ID) ? '0%' : `${selectedUser.trustScore}%`}
                          </span>
                        </div>
                        {selectedUser.roles?.includes(BAN_ROLE_ID) && (
                          <div className="flex justify-between">
                            <span className="text-chrome-gray-400">Status:</span>
                            <span className="text-red-400 font-semibold">Banned</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-chrome-gray-400">Aktive Advarsler:</span>
                          <span className="text-white">
                            {selectedUser.warnings.filter((w) => !w.removedAt).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trust Score Actions */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Trust Score</h3>
                      <Link href={`/admin/trust?userId=${selectedUser.id}`}>
                        <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
                          Administrer Trust Score
                        </button>
                      </Link>
                    </div>

                    {/* Add Note Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">Noter</h3>
                        <button
                          onClick={() => setShowAddNote(!showAddNote)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold"
                        >
                          {showAddNote ? 'Skjul' : 'Tilføj Note'}
                        </button>
                      </div>

                      {/* Add Note Dropdown */}
                      {showAddNote && (
                        <div className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50 mb-4 transition-all">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-chrome-gray-400 mb-2">Note *</label>
                              <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Skriv din note her..."
                                className="w-full px-3 py-2 bg-chrome-gray-800 border border-chrome-gray-700 rounded-lg text-white resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
                                rows={4}
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-chrome-gray-400 mb-2">Billede (valgfrit)</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="w-full px-3 py-2 bg-chrome-gray-800 border border-chrome-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                              />
                              {noteImage && (
                                <div className="mt-3">
                                  <p className="text-sm text-chrome-gray-400 mb-2">Forhåndsvisning:</p>
                                  <img
                                    src={noteImage}
                                    alt="Preview"
                                    className="max-w-full h-auto max-h-64 rounded-lg border border-chrome-gray-700"
                                  />
                                  <button
                                    onClick={() => {
                                      setNoteImage(null)
                                      setNoteImageFile(null)
                                    }}
                                    className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                                  >
                                    Fjern Billede
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={handleAddNote}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                              >
                                Gem Note
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddNote(false)
                                  setNoteContent('')
                                  setNoteImage(null)
                                  setNoteImageFile(null)
                                }}
                                className="px-4 py-2 bg-chrome-gray-700 hover:bg-chrome-gray-600 text-white rounded-lg font-semibold"
                              >
                                Annuller
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Existing Notes */}
                      {userNotes.length > 0 ? (
                        <div className="space-y-3">
                          {userNotes
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((note) => (
                              <div
                                key={note.id}
                                className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <p className="text-white whitespace-pre-wrap">{note.content}</p>
                                    {note.imageUrl && (
                                      <div className="mt-3">
                                        <img
                                          src={note.imageUrl}
                                          alt="Note attachment"
                                          className="max-w-full h-auto max-h-64 rounded-lg border border-chrome-gray-700"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-chrome-gray-400 mt-2 pt-2 border-t border-chrome-gray-700/50">
                                  <span>Tilføjet af: {note.createdBy}</span>
                                  <span>
                                    {new Date(note.createdAt).toLocaleString('da-DK', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-chrome-gray-400 text-center py-4">Ingen noter</p>
                      )}
                    </div>

                    {/* Applications */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Ansøgninger</h3>
                      {userApplications.length === 0 ? (
                        <p className="text-chrome-gray-400 text-center py-4">Ingen ansøgninger</p>
                      ) : (
                        <div className="space-y-2">
                          {userApplications.map((app) => (
                            <div
                              key={app.id}
                              className="bg-chrome-gray-900/50 rounded-lg p-3 border border-chrome-gray-700/50"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-white font-semibold">{getTypeText(app.type)}</span>
                                  <p className="text-sm text-chrome-gray-400">
                                    Indsendt: {new Date(app.submitted_at).toLocaleDateString('da-DK')}
                                  </p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getStatusColor(app.status)}`}>
                                  {getStatusText(app.status)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Warnings */}
                    {selectedUser.warnings.filter((w) => !w.removedAt).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Aktive Advarsler</h3>
                        <div className="space-y-2">
                          {selectedUser.warnings
                            .filter((w) => !w.removedAt)
                            .map((warning) => (
                              <div
                                key={warning.id}
                                className="bg-chrome-gray-900/50 rounded-lg p-3 border border-yellow-400/30"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-white font-semibold">{warning.reason}</p>
                                    {warning.note && (
                                      <p className="text-sm text-chrome-gray-400 mt-1">{warning.note}</p>
                                    )}
                                    <p className="text-xs text-chrome-gray-500 mt-1">
                                      {new Date(warning.issuedAt).toLocaleDateString('da-DK')} af {warning.issuedBy}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                      warning.severity === 'high'
                                        ? 'bg-red-400/10 text-red-400'
                                        : warning.severity === 'medium'
                                        ? 'bg-orange-400/10 text-orange-400'
                                        : 'bg-yellow-400/10 text-yellow-400'
                                    }`}
                                  >
                                    {warning.severity === 'high' ? 'Høj' : warning.severity === 'medium' ? 'Medium' : 'Lav'}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Ban Modal */}
            {showBanModal && banUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-chrome-gray-800 rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg max-w-md w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Ban Bruger</h2>
                    <button
                      onClick={() => {
                        setShowBanModal(false)
                        setBanUser(null)
                        setBanReason('')
                      }}
                      className="text-chrome-gray-400 hover:text-white transition"
                      disabled={banning}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-chrome-gray-300 mb-2">
                        Du er ved at banne <span className="text-white font-semibold">{banUser.name}</span>
                      </p>
                      <p className="text-sm text-chrome-gray-400">
                        Dette vil fjerne alle brugerens ranks fra Discord og give dem ban ranken.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Grund for ban *
                      </label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Indtast grunden for ban..."
                        className="w-full px-4 py-3 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                        rows={4}
                        disabled={banning}
                      />
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                          />
                        </svg>
                        <p className="text-sm text-red-300">
                          <strong className="text-red-400">Advarsel:</strong> Denne handling kan ikke fortrydes. 
                          Alle brugerens ranks vil blive fjernet og de vil modtage ban ranken.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-2">
                      <button
                        onClick={() => {
                          setShowBanModal(false)
                          setBanUser(null)
                          setBanReason('')
                        }}
                        disabled={banning}
                        className="px-4 py-2 bg-chrome-gray-700 hover:bg-chrome-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                      >
                        Annuller
                      </button>
                      <button
                        onClick={handleBanUser}
                        disabled={banning || !banReason.trim()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                      >
                        {banning ? 'Banner...' : 'Bekræft Ban'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Unban Modal */}
            {showUnbanModal && unbanUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-chrome-gray-800 rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg max-w-md w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Unban Bruger</h2>
                    <button
                      onClick={() => {
                        setShowUnbanModal(false)
                        setUnbanUser(null)
                        setUnbanReason('')
                        setRestoreWhitelist(false)
                      }}
                      className="text-chrome-gray-400 hover:text-white transition"
                      disabled={unbanning}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-chrome-gray-300 mb-2">
                        Du er ved at unbanne <span className="text-white font-semibold">{unbanUser.name}</span>
                      </p>
                      <p className="text-sm text-chrome-gray-400">
                        Dette vil fjerne ban ranken fra brugeren.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Grund for unban *
                      </label>
                      <textarea
                        value={unbanReason}
                        onChange={(e) => setUnbanReason(e.target.value)}
                        placeholder="Indtast grunden for unban..."
                        className="w-full px-4 py-3 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                        rows={4}
                        disabled={unbanning}
                      />
                    </div>

                    <div className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restoreWhitelist}
                          onChange={(e) => setRestoreWhitelist(e.target.checked)}
                          disabled={unbanning}
                          className="mt-1 w-4 h-4 text-blue-600 bg-chrome-gray-700 border-chrome-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <p className="text-white font-semibold mb-1">Giv whitelist tilbage</p>
                          <p className="text-sm text-chrome-gray-400">
                            Hvis markeret, vil brugeren modtage whitelist-rollen (1459894678336831552) efter unban.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-2">
                      <button
                        onClick={() => {
                          setShowUnbanModal(false)
                          setUnbanUser(null)
                          setUnbanReason('')
                          setRestoreWhitelist(false)
                        }}
                        disabled={unbanning}
                        className="px-4 py-2 bg-chrome-gray-700 hover:bg-chrome-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                      >
                        Annuller
                      </button>
                      <button
                        onClick={handleUnbanUser}
                        disabled={unbanning || !unbanReason.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                      >
                        {unbanning ? 'Unbanner...' : 'Bekræft Unban'}
                      </button>
                    </div>
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
