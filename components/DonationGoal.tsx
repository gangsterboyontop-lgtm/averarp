'use client'

export default function DonationGoal() {
  const progress = 65 // Example: 65% of 2000 DKK
  
  return (
    <div className="bg-chrome-gray-800/60 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-white">Månedligt Mål</h2>
      <p className="text-chrome-gray-300 mb-2">Serverens driftsomkostninger</p>
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-chrome-gray-300">{progress * 20} DKK</span>
          <span className="text-chrome-gray-300">af 2000 DKK</span>
        </div>
        <div className="w-full bg-chrome-gray-700 rounded-full h-3">
          <div
            className="bg-chrome-gray-500 h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <div className="text-chrome-gray-400 text-sm">Henter data...</div>
    </div>
  )
}
