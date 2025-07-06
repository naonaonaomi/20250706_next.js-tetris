'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Score {
  id: string
  points: number
  createdAt: string
  user: {
    name: string | null
    email: string | null
  }
}

export default function RankingPage() {
  const { data: session } = useSession()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    try {
      const response = await fetch('/api/score')
      if (!response.ok) {
        throw new Error('Failed to fetch scores')
      }
      const data = await response.json()
      setScores(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏅'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading rankings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <button
            onClick={fetchScores}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400">🏆 Tetris Rankings</h1>
          <div className="flex gap-4">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              ← Home
            </Link>
            {session && (
              <Link
                href="/play"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                🎮 Play Game
              </Link>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {scores.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">No scores yet!</h2>
              <p className="text-gray-400 mb-6">
                Be the first to play and set a high score!
              </p>
              {session ? (
                <Link
                  href="/play"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  🎮 Start Playing
                </Link>
              ) : (
                <Link
                  href="/"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  🔐 Sign In to Play
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold">Top 10 High Scores</h2>
              </div>
              <div className="divide-y divide-gray-700">
                {scores.map((score, index) => (
                  <div
                    key={score.id}
                    className={`px-6 py-4 flex items-center justify-between hover:bg-gray-700 transition-colors duration-200 ${
                      index < 3 ? 'bg-gray-750' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold w-12 text-center">
                        {getRankEmoji(index + 1)}
                      </div>
                      <div className="text-2xl font-bold text-cyan-400 w-8">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {score.user.name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {score.user.email || 'No email'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-400">
                        {score.points.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(score.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={fetchScores}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              🔄 Refresh Rankings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}