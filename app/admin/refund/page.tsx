'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Image from 'next/image'

export default function RefundPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [playerId, setPlayerId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [refundType, setRefundType] = useState<'money' | 'item'>('money')
  const [itemName, setItemName] = useState('')
  const [itemCount, setItemCount] = useState('1')

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

  if (status === 'loading') {
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

  const generateRefundScript = () => {
    if (!playerId || (!amount && refundType === 'money') || (refundType === 'item' && (!itemName || !itemCount))) {
      alert('Udfyld alle felter')
      return
    }

    let script = ''
    
    if (refundType === 'money') {
      script = `/refund ${playerId} ${amount}`
      if (reason) {
        script += ` -- ${reason}`
      }
    } else {
      script = `/refunditem ${playerId} ${itemName} ${itemCount}`
      if (reason) {
        script += ` -- ${reason}`
      }
    }

    return script
  }

  const copyToClipboard = () => {
    const script = generateRefundScript()
    if (script) {
      navigator.clipboard.writeText(script)
      alert('Script kopieret til udklipsholder!')
    }
  }

  const handleSubmit = () => {
    const script = generateRefundScript()
    if (script) {
      // You can add logic here to save refund history or send to server
      alert(`Script genereret:\n\n${script}\n\nScript er kopieret til udklipsholder!`)
      copyToClipboard()
    }
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
              <button
                onClick={() => router.push('/admin')}
                className="mb-4 flex items-center text-chrome-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tilbage til Admin Panel
              </button>
              <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
                Refund Panel
              </h1>
              <p className="text-lg text-chrome-gray-300">Generer refund scripts for FiveM server</p>
            </div>

            {/* Refund Form */}
            <div className="bg-chrome-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-chrome-gray-700/50 shadow-lg shadow-chrome-gray-900/50">
              <div className="space-y-6">
                {/* Refund Type */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Refund Type</label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setRefundType('money')}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                        refundType === 'money'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-chrome-gray-700 text-chrome-gray-300 hover:bg-chrome-gray-600'
                      }`}
                    >
                      Penge
                    </button>
                    <button
                      onClick={() => setRefundType('item')}
                      className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                        refundType === 'item'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-chrome-gray-700 text-chrome-gray-300 hover:bg-chrome-gray-600'
                      }`}
                    >
                      Item
                    </button>
                  </div>
                </div>

                {/* Player ID */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Player ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    placeholder="Indtast player ID"
                    className="w-full px-4 py-3 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* Money Amount or Item Details */}
                {refundType === 'money' ? (
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Beløb <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Indtast beløb"
                      className="w-full px-4 py-3 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Item Navn <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="f.eks. bread, water, phone"
                        className="w-full px-4 py-3 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Antal <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={itemCount}
                        onChange={(e) => setItemCount(e.target.value)}
                        placeholder="1"
                        min="1"
                        className="w-full px-4 py-3 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Årsag (valgfrit)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Beskriv grunden til refund..."
                    rows={3}
                    className="w-full px-4 py-3 bg-chrome-gray-900/50 border border-chrome-gray-700/50 rounded-lg text-white placeholder-chrome-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                  />
                </div>

                {/* Generated Script Preview */}
                {(playerId && ((refundType === 'money' && amount) || (refundType === 'item' && itemName && itemCount))) && (
                  <div className="bg-chrome-gray-900/50 rounded-lg p-4 border border-chrome-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-white">Genereret Script</label>
                      <button
                        onClick={copyToClipboard}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-semibold transition-colors"
                      >
                        Kopier
                      </button>
                    </div>
                    <div className="bg-chrome-gray-950 rounded p-3 border border-chrome-gray-800">
                      <code className="text-green-400 font-mono text-sm break-all">
                        {generateRefundScript()}
                      </code>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!playerId || (refundType === 'money' && !amount) || (refundType === 'item' && (!itemName || !itemCount))}
                  className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-chrome-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-lg transition-colors"
                >
                  Generer og Kopier Script
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Sådan bruges Refund Panel</h3>
              <ol className="list-decimal list-inside space-y-2 text-chrome-gray-300">
                <li>Vælg om du vil refundere penge eller et item</li>
                <li>Indtast Player ID (findes i server konsollen eller via F8)</li>
                <li>Indtast beløb eller item detaljer</li>
                <li>Tilføj en årsag (valgfrit) for dokumentation</li>
                <li>Script genereres automatisk - kopier og indsæt i server konsollen</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
