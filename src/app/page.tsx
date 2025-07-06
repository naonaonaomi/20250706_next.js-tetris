'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-8 text-cyan-400">
            🎮 Tetris Game
          </h1>
          <p className="text-xl mb-12 text-gray-300">
            Play the classic Tetris game and compete with other players!
          </p>

          {session ? (
            <div className="space-y-8">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-semibold mb-4">Welcome, {session.user?.name}!</h2>
                <div className="space-y-4">
                  <Link
                    href="/play"
                    className="block bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    🎮 Start Game
                  </Link>
                  <Link
                    href="/ranking"
                    className="block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    🏆 View Rankings
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
                <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
                <p className="text-gray-300 mb-6">
                  Sign in with Google to start playing and track your high scores!
                </p>
                <button
                  onClick={() => signIn('google')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 w-full"
                >
                  <span>🔐</span>
                  Sign in with Google
                </button>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <Link
                  href="/ranking"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  🏆 View Rankings (No login required)
                </Link>
              </div>
            </div>
          )}

          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-cyan-400">How to Play</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-cyan-300">🎯 Objective</h3>
                <p className="text-gray-300">
                  Arrange falling blocks (Tetriminos) to create complete horizontal lines. 
                  Clear lines to score points and prevent the board from filling up!
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-cyan-300">🎮 Controls</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>← → : Move piece left/right</li>
                  <li>↓ : Soft drop (faster fall)</li>
                  <li>↑ : Rotate piece</li>
                  <li>Space : Hard drop (instant fall)</li>
                  <li>P : Pause game</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}