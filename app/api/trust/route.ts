import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import { getOrCreateUserData } from '@/lib/trustStore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any)?.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found' },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const requestedUserId = searchParams.get('userId')

    // Ensure user can only access their own trust data (unless admin)
    const isAdmin = (session.user as any)?.isAdmin || false
    if (!isAdmin && requestedUserId && requestedUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const targetUserId = requestedUserId || userId
    const userData = getOrCreateUserData(targetUserId)

    return NextResponse.json({
      success: true,
      trustScore: userData.trustScore,
      warnings: userData.warnings,
    })
  } catch (error) {
    console.error('Error fetching trust data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
