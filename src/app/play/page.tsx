'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import TetrisGame from '@/components/TetrisGame'
import Link from 'next/link'

export default function PlayPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  const handleGameOver = async (score: number) => {
    if (!session?.user?.id) return

    setIsSubmittingScore(true)
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points: score }),
      })

      if (!response.ok) {
        throw new Error('Failed to save score')
      }

      console.log('Score saved successfully!')
    } catch (error) {
      console.error('Error saving score:', error)
    } finally {
      setIsSubmittingScore(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-6">You need to be logged in to play the game.</p>
          <button
            onClick={() => signIn('google')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          ← Back to Home
        </Link>
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <Link
          href="/ranking"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          🏆 Rankings
        </Link>
      </div>

      {isSubmittingScore && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg">
            Saving score...
          </div>
        </div>
      )}

      <TetrisGame onGameOver={handleGameOver} />
    </div>
  )
}