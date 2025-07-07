'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

// --- 定数・型定義 ---
const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const BOARD_SIZE = BOARD_WIDTH * BOARD_HEIGHT

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-sky-400 shadow-sky-300/60' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-amber-200 shadow-amber-100/60' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-violet-400 shadow-violet-300/60' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-lime-300 shadow-lime-200/60' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-pink-400 shadow-pink-200/60' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-800 shadow-blue-700/60' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-300 shadow-orange-200/60' }
}
const TETROMINO_KEYS = Object.keys(TETROMINOS) as (keyof typeof TETROMINOS)[]

type Piece = {
  shape: number[][]
  color: string
  x: number
  y: number
}

export default function TetrisGame() {
  // --- State & Ref ---
  const [isClient, setIsClient] = useState(false)
  const [board, setBoard] = useState<number[]>(new Array(BOARD_SIZE).fill(0))
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
  const [score, setScore] = useState(0)
  const [linesCleared, setLinesCleared] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [bag, setBag] = useState<(keyof typeof TETROMINOS)[]>([])
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // --- ユーティリティ関数 ---
  // 空のボードを作成
  const createEmptyBoard = useCallback(() => new Array(BOARD_SIZE).fill(0), [])

  // 7バッグをシャッフルして返す
  const shuffleBag = useCallback((): (keyof typeof TETROMINOS)[] => {
    const array = [...TETROMINO_KEYS]
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }, [])

  // ランダムなテトリミノを生成（7バッグ方式）
  const randomTetromino = useCallback(() => {
    let nextBag = bag
    if (nextBag.length === 0) {
      nextBag = shuffleBag()
    }
    const randomKey = nextBag[0] as keyof typeof TETROMINOS
    setBag(nextBag.slice(1))
    const tetromino = TETROMINOS[randomKey]
    return {
      shape: tetromino.shape,
      color: tetromino.color,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
      y: -1
    }
  }, [bag, shuffleBag])

  // --- 判定・操作系 ---
  // ピースが指定位置に置けるか判定
  const isValidPosition = useCallback((piece: Piece, board: number[], x: number, y: number) => {
    for (let py = 0; py < piece.shape.length; py++) {
      for (let px = 0; px < piece.shape[py].length; px++) {
        if (piece.shape[py][px]) {
          const newX = x + px
          const newY = y + py
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false
          if (newY >= 0 && board[newY * BOARD_WIDTH + newX]) return false
        }
      }
    }
    return true
  }, [])

  // ピースをボードに固定
  const placePiece = useCallback((piece: Piece, board: number[]) => {
    const newBoard = [...board]
    for (let py = 0; py < piece.shape.length; py++) {
      for (let px = 0; px < piece.shape[py].length; px++) {
        if (piece.shape[py][px]) {
          const x = piece.x + px
          const y = piece.y + py
          if (y >= 0) newBoard[y * BOARD_WIDTH + x] = 1
        }
      }
    }
    return newBoard
  }, [])

  // ラインが揃っているか判定し、消去
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

  // ピースを右回転
  const rotatePiece = useCallback((piece: Piece) => {
    return {
      ...piece,
      shape: piece.shape[0].map((_, index: number) => piece.shape.map((row: number[]) => row[index]).reverse())
    }
  }, [])

  // ゴーストピース（落下位置の影）を計算
  const calculateGhostPosition = useCallback((piece: Piece) => {
    if (!piece) return null
    let ghostY = piece.y
    while (isValidPosition(piece, board, piece.x, ghostY + 1)) ghostY++
    return { ...piece, y: ghostY }
  }, [board, isValidPosition])

  // --- ゲーム操作系 ---
  // ピースを移動（dx: 横, dy: 縦）
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameOver || isPaused) return
    const newPiece = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy }
    if (isValidPosition(newPiece, board, newPiece.x, newPiece.y)) {
      setCurrentPiece(newPiece)
    } else if (dy > 0) {
      const newBoard = placePiece(currentPiece, board)
      const { board: clearedBoard, linesCleared: cleared } = clearLines(newBoard)
      setBoard(clearedBoard)
      setLinesCleared(prev => prev + cleared)
      setScore(prev => prev + cleared * 100 * (Math.floor((linesCleared + cleared) / 10) + 1) + 10)
      const nextPiece = randomTetromino()
      if (!isValidPosition(nextPiece, clearedBoard, nextPiece.x, nextPiece.y)) {
        setGameOver(true)
        return
      }
      setCurrentPiece(nextPiece)
    }
  }, [currentPiece, board, gameOver, isPaused, isValidPosition, placePiece, clearLines, randomTetromino, linesCleared])

  // ピースを回転させるハンドラ
  const rotatePieceHandler = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return
    const rotated = rotatePiece(currentPiece)
    if (isValidPosition(rotated, board, rotated.x, rotated.y)) setCurrentPiece(rotated)
  }, [currentPiece, board, gameOver, isPaused, rotatePiece, isValidPosition])

  // ハードドロップ（即座に最下部まで落とす）
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return
    let newY = currentPiece.y
    while (isValidPosition(currentPiece, board, currentPiece.x, newY + 1)) newY++
    const droppedPiece = { ...currentPiece, y: newY }
    const newBoard = placePiece(droppedPiece, board)
    const { board: clearedBoard, linesCleared: cleared } = clearLines(newBoard)
    setBoard(clearedBoard)
    setLinesCleared(prev => prev + cleared)
    setScore(prev => prev + cleared * 100 * (Math.floor((linesCleared + cleared) / 10) + 1) + (newY - currentPiece.y) * 2)
    const nextPiece = randomTetromino()
    if (!isValidPosition(nextPiece, clearedBoard, nextPiece.x, nextPiece.y)) {
      setGameOver(true)
      return
    }
    setCurrentPiece(nextPiece)
  }, [currentPiece, board, gameOver, isPaused, isValidPosition, placePiece, clearLines, randomTetromino, linesCleared])

  // --- イベントハンドラ ---
  // キーボード操作のハンドラ
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); movePiece(-1, 0); break
      case 'ArrowRight': e.preventDefault(); movePiece(1, 0); break
      case 'ArrowDown': e.preventDefault(); movePiece(0, 1); break
      case 'ArrowUp': e.preventDefault(); hardDrop(); break
      case 'Control': e.preventDefault(); rotatePieceHandler(); break
      case 'p': case 'P': e.preventDefault(); setIsPaused(prev => !prev); break
    }
  }, [movePiece, rotatePieceHandler, hardDrop])

  // --- その他UI操作 ---
  // ゲームをリセット
  const resetGame = () => {
    setBoard(createEmptyBoard())
    setCurrentPiece(null)
    setScore(0)
    setLinesCleared(0)
    setGameOver(false)
    setIsPaused(false)
    setBag([])
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(console.error)
    }
  }

  // 音楽のON/OFF切り替え
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) audioRef.current.pause()
      else audioRef.current.play().catch(console.error)
    }
  }

  // ボードを描画（ゴーストピースや現在のピースも反映）
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
      let cellClass = ''
      if (cell === 1) {
        // 固定ブロック: 共通の薄いグレー色
        cellClass = 'bg-slate-400 opacity-40 border-slate-600'
      } else if (cell === 2) {
        // 操作中のブロック: 通常のテトリミノ色
        cellClass = (currentPiece?.color || 'bg-slate-400') + ' shadow-lg border-slate-300'
      } else if (cell === 3) {
        // ゴーストピース: さらに薄く
        cellClass = (currentPiece?.color || 'bg-slate-400') + ' opacity-20 border-slate-700'
      } else {
        // 空白: 濃い背景
        cellClass = 'bg-slate-900 border-slate-800'
      }
      return (
        <div
          key={index}
          className={`w-6 h-6 border ${cellClass} rounded-md transition-all`}
        />
      )
    })
  }

  // --- useEffect群 ---
  // 初期化処理（クライアント判定と音楽の準備）
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

  // キーイベントの登録・解除
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  // ゲームループ（自動落下や音楽再生）
  useEffect(() => {
    if (gameOver || isPaused) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      if (audioRef.current) audioRef.current.pause()
      return
    }
    const dropInterval = Math.max(50, 1000 - (Math.floor(linesCleared / 10) + 1 - 1) * 100)
    gameLoopRef.current = setInterval(() => movePiece(0, 1), dropInterval)
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [movePiece, linesCleared, gameOver, isPaused])

  // isMusicPlayingの変化で音楽再生/停止を制御
  useEffect(() => {
    if (!audioRef.current) return
    if (isMusicPlaying) {
      audioRef.current.play().catch(console.error)
    } else {
      audioRef.current.pause()
    }
  }, [isMusicPlaying])

  // ピースがなければ新しいピースを生成
  useEffect(() => {
    if (!currentPiece) setCurrentPiece(randomTetromino())
  }, [currentPiece, randomTetromino])

  // --- サーバーサイドレンダリング時のプレースホルダー ---
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
                  <span className="text-lg font-bold min-w-[6ch] text-right">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Level</span>
                  <span className="text-lg font-bold min-w-[6ch] text-right">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Lines</span>
                  <span className="text-lg font-bold min-w-[6ch] text-right">0</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-sm space-y-1">
                <p>← → : 移動</p>
                <p>↓ : ソフトドロップ</p>
                <p>↑ : ハードドロップ</p>
                <p>Ctrl : 回転</p>
                <p>P : ポーズ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- メインの描画 ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-4 font-sans">
      <div className="flex gap-10 md:gap-16">
        <div className="flex flex-row items-end gap-10">
          {/* スコア＋音楽切替ボタン */}
          <div className="flex flex-col items-center gap-1">
            {/* 音楽切替ボタン */}
            <button
              onClick={toggleMusic}
              className="mb-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm font-bold flex items-center gap-1 transition-all duration-150"
              title={isMusicPlaying ? 'ミュージックOFF' : 'ミュージックON'}
              aria-label="ミュージック切替"
            >
              {isMusicPlaying ? '🎵 ON' : '🔇 OFF'}
            </button>
            {/* スコア表示 */}
            <div className="flex flex-col text-xs text-slate-400 bg-slate-900/70 rounded px-2 py-1 select-none items-center gap-1">
              <div>Score: <span className="inline-block min-w-[6ch] text-right">{score}</span></div>
              <div>Level: <span className="inline-block min-w-[6ch] text-right">{Math.floor(linesCleared / 10) + 1}</span></div>
              <div>Lines: <span className="inline-block min-w-[6ch] text-right">{linesCleared}</span></div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-extrabold mb-6 tracking-tight drop-shadow-lg text-slate-100">Tetris</h1>
            <div 
              className="relative grid grid-cols-10 gap-0 border-4 border-slate-700 p-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl"
              style={{ width: 'fit-content' }}
            >
              {renderBoard()}
              {/* 一時停止表示 */}
              {isPaused && !gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <div className="bg-slate-900/80 rounded-xl px-4 py-3 flex flex-col items-center shadow-xl border border-slate-200/10">
                    <span className="text-xl mb-1 font-bold text-white drop-shadow flex items-center gap-1">
                      <svg xmlns='http://www.w3.org/2000/svg' className='inline w-5 h-5 mr-1 text-indigo-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'><rect x='6' y='4' width='4' height='16' rx='2'/><rect x='14' y='4' width='4' height='16' rx='2'/></svg>
                      Paused
                    </span>
                    <span className="text-xs text-slate-200">Pキーで再開</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 min-w-56">
          <div className="bg-white/5 backdrop-blur border border-white/10 shadow-xl rounded-xl p-6">
            <div className="text-sm space-y-1 text-slate-200">
              <p>← → : 移動</p>
              <p>↓ : ソフトドロップ</p>
              <p>↑ : ハードドロップ</p>
              <p>Ctrl : 回転</p>
              <p>P : ポーズ</p>
            </div>
          </div>
          {gameOver && (
            <div className="bg-gradient-to-r from-lime-300 to-amber-200 p-4 rounded-xl text-center shadow-xl border border-white/10">
              <p className="mb-4 text-lg font-bold text-slate-900 drop-shadow">Final Score: {score}</p>
              <button
                onClick={resetGame}
                className="bg-white/90 hover:bg-white text-slate-900 font-bold px-4 py-2 rounded-lg shadow"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}