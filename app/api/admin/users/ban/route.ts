import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import { banUser, sendDirectMessage } from '@/lib/discord'
import { setUserData, getOrCreateUserData } from '@/lib/trustStore'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Ikke autentificeret' }, { status: 401 })
    }

    const isAdmin = (session.user as any)?.isAdmin || false
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Ingen adgang' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, reason } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Bruger ID er påkrævet' },
        { status: 400 }
      )
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Grund for ban er påkrævet' },
        { status: 400 }
      )
    }

    const guildId = process.env.DISCORD_GUILD_ID
    if (!guildId) {
      return NextResponse.json(
        { success: false, error: 'Discord Guild ID er ikke konfigureret' },
        { status: 500 }
      )
    }

    const banRoleId = '1459894685051916448'

    // Ban the user (remove all roles and add ban role)
    try {
      const success = await banUser(userId, guildId, banRoleId)

      if (!success) {
        console.error(`Ban failed for user ${userId}`)
        return NextResponse.json(
          { success: false, error: 'Fejl ved banning af bruger. Tjek server logs for detaljer.' },
          { status: 500 }
        )
      }
    } catch (banError: any) {
      console.error('Error in banUser function:', banError)
      return NextResponse.json(
        { success: false, error: `Fejl ved banning: ${banError.message || 'Ukendt fejl'}` },
        { status: 500 }
      )
    }

    // Set trust score to 0 for banned user
    try {
      const userData = getOrCreateUserData(userId)
      userData.trustScore = 0
      setUserData(userId, userData)
    } catch (trustError) {
      console.warn(`Failed to update trust score for user ${userId}:`, trustError)
      // Don't fail the ban if trust score update fails
    }

    // Send DM to the banned user
    const banMessage = `**Du er blevet banned fra serveren**\n\n` +
      `**Grund:** ${reason}\n\n` +
      `Alle dine ranks er blevet fjernet og du har modtaget ban ranken.\n\n` +
      `Hvis du mener dette er en fejl, kan du kontakte administrationen.`
    
    const dmSent = await sendDirectMessage(userId, banMessage)
    if (!dmSent) {
      console.warn(`Failed to send DM to banned user ${userId}, but ban was successful`)
    }

    // Log the ban action (you can extend this to save to a database)
    console.log(`User ${userId} banned by ${session.user?.name} (${(session.user as any)?.id}). Reason: ${reason}`)

    return NextResponse.json({
      success: true,
      message: 'Bruger er blevet banned',
      dmSent,
    })
  } catch (error: any) {
    console.error('Error banning user:', error)
    const errorMessage = error?.message || 'Der opstod en fejl ved banning af brugeren'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
