import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const scores = await prisma.score.findMany({
      take: 10,
      orderBy: {
        points: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    const formattedScores = scores.map(score => ({
      id: score.id,
      points: score.points,
      createdAt: score.createdAt,
      user: {
        name: score.user.name,
        email: score.user.email ? `${score.user.email.slice(0, 3)}***@${score.user.email.split('@')[1]}` : null,
      },
    }))

    return NextResponse.json(formattedScores)
  } catch (error) {
    console.error('Error fetching scores:', error)
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { points } = await request.json()

    if (typeof points !== 'number' || points < 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
    }

    const score = await prisma.score.create({
      data: {
        points,
        userId: session.user.id,
      },
    })

    return NextResponse.json(score)
  } catch (error) {
    console.error('Error saving score:', error)
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }
}