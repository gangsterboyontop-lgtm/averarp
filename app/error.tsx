'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-chrome-gray-900">
      <div className="text-center px-4">
        <h2 className="text-4xl font-bold text-red-400 mb-4">Noget gik galt!</h2>
        <p className="text-chrome-gray-300 mb-6">
          {error?.message || 'Der opstod en uventet fejl'}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Prøv igen
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-chrome-gray-700 hover:bg-chrome-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Tilbage til forsiden
          </Link>
        </div>
      </div>
    </div>
  )
}
