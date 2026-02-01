import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-chrome-gray-900">
      <div className="text-center px-4">
        <h2 className="text-6xl font-bold text-red-400 mb-4">404</h2>
        <h3 className="text-2xl font-semibold text-white mb-4">Siden blev ikke fundet</h3>
        <p className="text-chrome-gray-300 mb-6">
          Den side du leder efter eksisterer ikke.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          Tilbage til forsiden
        </Link>
      </div>
    </div>
  )
}
