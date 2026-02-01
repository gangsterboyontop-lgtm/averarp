'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="da">
      <body>
        <div className="min-h-screen relative flex items-center justify-center bg-chrome-gray-900">
          <div className="text-center px-4">
            <h2 className="text-4xl font-bold text-red-400 mb-4">Kritisk Fejl</h2>
            <p className="text-chrome-gray-300 mb-6">
              {error?.message || 'Der opstod en kritisk fejl'}
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Prøv igen
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
