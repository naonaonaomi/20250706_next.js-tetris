'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const BOARD_SIZE = BOARD_WIDTH * BOARD_HEIGHT

const TETROMINOS = {
  I: {
    shape: [
      [1, 1, 1, 1]
    ],
    color: 'bg-cyan-500'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-yellow-500'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: 'bg-purple-500'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: 'bg-green-500'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: 'bg-red-500'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: 'bg-blue-500'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: 'bg-orange-500'
  }
}

const TETROMINO_KEYS = Object.keys(TETROMINOS) as (keyof typeof TETROMINOS)[]

type Piece = {
  shape: number[][]
  color: string
  x: number
  y: number
}

export default function TetrisGame() {
  const [isClient, setIsClient] = useState(false)
  const [board, setBoard] = useState<number[]>(new Array(BOARD_SIZE).fill(0))
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [linesCleared, setLinesCleared] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setIsClient(true)
    
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/audio/コロブチカ.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = 0.3
      audioRef.current.addEventListener('loadeddata', () => {
        console.log('Audio loaded successfully')
      })
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e)
      })
      audioRef.current.addEventListener('play', () => {
        setIsMusicPlaying(true)
      })
      audioRef.current.addEventListener('pause', () => {
        setIsMusicPlaying(false)
      })
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const createEmptyBoard = useCallback(() => {
    return new Array(BOARD_SIZE).fill(0)
  }, [])

  const randomTetromino = useCallback(() => {
    const randomKey = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)]
    const tetromino = TETROMINOS[randomKey]
    return {
      shape: tetromino.shape,
      color: tetromino.color,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
      y: 0
    }
  }, [])

  const isValidPosition = useCallback((piece: Piece, board: number[], x: number, y: number) => {
    for (let py = 0; py < piece.shape.length; py++) {
      for (let px = 0; px < piece.shape[py].length; px++) {
        if (piece.shape[py][px]) {
          const newX = x + px
          const newY = y + py
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false
          }
          
          if (newY >= 0 && board[newY * BOARD_WIDTH + newX]) {
            return false
          }
        }
      }
    }
    return true
  }, [])

  const placePiece = useCallback((piece: Piece, board: number[]) => {
    const newBoard = [...board]
    for (let py = 0; py < piece.shape.length; py++) {
      for (let px = 0; px < piece.shape[py].length; px++) {
        if (piece.shape[py][px]) {
          const x = piece.x + px
          const y = piece.y + py
          if (y >= 0) {
            newBoard[y * BOARD_WIDTH + x] = 1
          }
        }
      }
    }
    return newBoard
  }, [])

  const clearLines = useCallback((board: number[]) => {
    const newBoard = [...board]
    let linesCleared = 0
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      let isFullLine = true
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (!newBoard[y * BOARD_WIDTH + x]) {
          isFullLine = false
          break
        }
      }
      
      if (isFullLine) {
        newBoard.splice(y * BOARD_WIDTH, BOARD_WIDTH)
        newBoard.unshift(...new Array(BOARD_WIDTH).fill(0))
        linesCleared++
        y++
      }
    }
    
    return { board: newBoard, linesCleared }
  }, [])

  const rotatePiece = useCallback((piece: Piece) => {
    const rotated = {
      ...piece,
      shape: piece.shape[0].map((_, index: number) =>
        piece.shape.map((row: number[]) => row[index]).reverse()
      )
    }
    return rotated
  }, [])

  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameOver || isPaused) return
    
    const newPiece = {
      ...currentPiece,
      x: currentPiece.x + dx,
      y: currentPiece.y + dy
    }
    
    if (isValidPosition(newPiece, board, newPiece.x, newPiece.y)) {
      setCurrentPiece(newPiece)
    } else if (dy > 0) {
      const newBoard = placePiece(currentPiece, board)
      const { board: clearedBoard, linesCleared: cleared } = clearLines(newBoard)
      
      setBoard(clearedBoard)
      setLinesCleared(prev => prev + cleared)
      setScore(prev => prev + cleared * 100 * level + 10)
      
      const newPiece = randomTetromino()
      if (!isValidPosition(newPiece, clearedBoard, newPiece.x, newPiece.y)) {
        setGameOver(true)
        return
      }
      
      setCurrentPiece(newPiece)
    }
  }, [currentPiece, board, gameOver, isPaused, isValidPosition, placePiece, clearLines, randomTetromino, level])

  const rotatePieceHandler = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return
    
    const rotated = rotatePiece(currentPiece)
    if (isValidPosition(rotated, board, rotated.x, rotated.y)) {
      setCurrentPiece(rotated)
    }
  }, [currentPiece, board, gameOver, isPaused, rotatePiece, isValidPosition])

  const calculateGhostPosition = useCallback((piece: Piece) => {
    if (!piece) return null
    
    let ghostY = piece.y
    while (isValidPosition(piece, board, piece.x, ghostY + 1)) {
      ghostY++
    }
    
    return { ...piece, y: ghostY }
  }, [board, isValidPosition])

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return
    
    let newY = currentPiece.y
    while (isValidPosition(currentPiece, board, currentPiece.x, newY + 1)) {
      newY++
    }
    
    const droppedPiece = { ...currentPiece, y: newY }
    const newBoard = placePiece(droppedPiece, board)
    const { board: clearedBoard, linesCleared: cleared } = clearLines(newBoard)
    
    setBoard(clearedBoard)
    setLinesCleared(prev => prev + cleared)
    setScore(prev => prev + cleared * 100 * level + (newY - currentPiece.y) * 2)
    
    const newPiece = randomTetromino()
    if (!isValidPosition(newPiece, clearedBoard, newPiece.x, newPiece.y)) {
      setGameOver(true)
      return
    }
    
    setCurrentPiece(newPiece)
  }, [currentPiece, board, gameOver, isPaused, isValidPosition, placePiece, clearLines, randomTetromino, level])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        movePiece(-1, 0)
        break
      case 'ArrowRight':
        e.preventDefault()
        movePiece(1, 0)
        break
      case 'ArrowDown':
        e.preventDefault()
        movePiece(0, 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        hardDrop()
        break
      case 'Shift':
        e.preventDefault()
        rotatePieceHandler()
        break
      case 'p':
      case 'P':
        e.preventDefault()
        setIsPaused(prev => !prev)
        break
    }
  }, [movePiece, rotatePieceHandler, hardDrop])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  useEffect(() => {
    if (linesCleared > 0 && linesCleared % 10 === 0) {
      setLevel(prev => prev + 1)
    }
  }, [linesCleared])

  useEffect(() => {
    if (gameOver || isPaused) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
      return
    }

    const dropInterval = Math.max(50, 1000 - (level - 1) * 100)
    gameLoopRef.current = setInterval(() => movePiece(0, 1), dropInterval)
    
    if (audioRef.current && !isMusicPlaying) {
      audioRef.current.play().catch(console.error)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [movePiece, level, gameOver, isPaused, isMusicPlaying])

  useEffect(() => {
    if (!currentPiece) {
      setCurrentPiece(randomTetromino())
    }
  }, [currentPiece, randomTetromino])

  const renderBoard = () => {
    const displayBoard = [...board]
    
    const ghostPiece = currentPiece ? calculateGhostPosition(currentPiece) : null
    
    if (ghostPiece && currentPiece && ghostPiece.y !== currentPiece.y) {
      for (let py = 0; py < ghostPiece.shape.length; py++) {
        for (let px = 0; px < ghostPiece.shape[py].length; px++) {
          if (ghostPiece.shape[py][px]) {
            const x = ghostPiece.x + px
            const y = ghostPiece.y + py
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y * BOARD_WIDTH + x] = 3
            }
          }
        }
      }
    }
    
    if (currentPiece) {
      for (let py = 0; py < currentPiece.shape.length; py++) {
        for (let px = 0; px < currentPiece.shape[py].length; px++) {
          if (currentPiece.shape[py][px]) {
            const x = currentPiece.x + px
            const y = currentPiece.y + py
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y * BOARD_WIDTH + x] = 2
            }
          }
        }
      }
    }

    return displayBoard.map((cell, index) => {
      const cellClass = cell === 1 ? 'bg-gray-600' : 
                       cell === 2 ? (currentPiece?.color || 'bg-gray-400') : 
                       cell === 3 ? (currentPiece?.color || 'bg-gray-400') + ' opacity-30' :
                       'bg-gray-100'
      
      return (
        <div
          key={index}
          className={`w-6 h-6 border border-gray-300 ${cellClass}`}
        />
      )
    })
  }

  const resetGame = () => {
    setBoard(createEmptyBoard())
    setCurrentPiece(null)
    setScore(0)
    setLevel(1)
    setLinesCleared(0)
    setGameOver(false)
    setIsPaused(false)
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(console.error)
    }
  }

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(console.error)
      }
    }
  }

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4">Tetris</h1>
            <div 
              className="grid grid-cols-10 gap-0 border-2 border-gray-500 p-2 bg-gray-800"
              style={{ width: 'fit-content' }}
            >
              {new Array(BOARD_SIZE).fill(0).map((_, index) => (
                <div
                  key={index}
                  className="w-6 h-6 border border-gray-300 bg-gray-100"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 min-w-48">
            <div className="bg-gray-800 p-4 rounded">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Score</span>
                  <span className="text-lg font-bold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Level</span>
                  <span className="text-lg font-bold">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Lines</span>
                  <span className="text-lg font-bold">0</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-sm space-y-1">
                <p>← → : Move</p>
                <p>↓ : Soft drop</p>
                <p>↑ : Hard drop</p>
                <p>Shift : Rotate</p>
                <p>P : Pause</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="flex gap-8">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4">Tetris</h1>
          <div 
            className="grid grid-cols-10 gap-0 border-2 border-gray-500 p-2 bg-gray-800"
            style={{ width: 'fit-content' }}
          >
            {renderBoard()}
          </div>
        </div>
        
        <div className="flex flex-col gap-4 min-w-48">
          <div className="bg-gray-800 p-4 rounded">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Score</span>
                <span className="text-lg font-bold">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Level</span>
                <span className="text-lg font-bold">{level}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Lines</span>
                <span className="text-lg font-bold">{linesCleared}</span>
              </div>
            </div>
          </div>
          
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-sm space-y-1">
                <p>← → : Move</p>
                <p>↓ : Soft drop</p>
                <p>↑ : Hard drop</p>
                <p>Shift : Rotate</p>
                <p>P : Pause</p>
              </div>
            </div>
            
            <button
              onClick={toggleMusic}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full"
            >
              {isMusicPlaying ? '🔇 Music OFF' : '🎵 Music ON'}
            </button>
          
          {gameOver && (
            <div className="bg-green-600 p-4 rounded text-center">
              <p className="mb-4">Final Score: {score}</p>
              <button
                onClick={resetGame}
                className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded"
              >
                Play Again
              </button>
            </div>
          )}
          
          {isPaused && !gameOver && (
            <div className="bg-yellow-600 p-4 rounded text-center">
              <h2 className="text-xl font-bold">Paused</h2>
              <p>Press P to resume</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}