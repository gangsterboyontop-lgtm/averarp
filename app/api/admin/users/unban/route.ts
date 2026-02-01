import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import { removeRole, addRole, sendDirectMessage } from '@/lib/discord'

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
    const { userId, reason, restoreWhitelist } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Bruger ID er påkrævet' },
        { status: 400 }
      )
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Grund for unban er påkrævet' },
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
    const whitelistRoleId = '1459894678336831552'

    // Remove ban role
    try {
      const banRemoved = await removeRole(userId, guildId, banRoleId)
      if (!banRemoved) {
        console.error(`Failed to remove ban role for user ${userId}`)
        return NextResponse.json(
          { success: false, error: 'Fejl ved fjernelse af ban rolle' },
          { status: 500 }
        )
      }
    } catch (banError: any) {
      console.error('Error removing ban role:', banError)
      return NextResponse.json(
        { success: false, error: `Fejl ved fjernelse af ban rolle: ${banError.message || 'Ukendt fejl'}` },
        { status: 500 }
      )
    }

    // Add whitelist role if requested
    if (restoreWhitelist) {
      try {
        const whitelistAdded = await addRole(userId, guildId, whitelistRoleId)
        if (!whitelistAdded) {
          console.warn(`Failed to add whitelist role for user ${userId}, but ban was removed`)
        }
      } catch (whitelistError: any) {
        console.warn('Error adding whitelist role:', whitelistError)
        // Don't fail the unban if whitelist addition fails
      }
    }

    // Send DM to the unbanned user
    const unbanMessage = `✅ **Du er blevet unbanned fra serveren**\n\n` +
      `**Grund:** ${reason}\n\n` +
      `${restoreWhitelist ? 'Whitelist-rollen er blevet givet tilbage.\n\n' : ''}` +
      `Velkommen tilbage!`
    
    const dmSent = await sendDirectMessage(userId, unbanMessage)
    if (!dmSent) {
      console.warn(`Failed to send DM to unbanned user ${userId}, but unban was successful`)
    }

    // Log the unban action
    console.log(`User ${userId} unbanned by ${session.user?.name} (${(session.user as any)?.id}). Reason: ${reason}. Whitelist restored: ${restoreWhitelist}`)

    return NextResponse.json({
      success: true,
      message: 'Bruger er blevet unbanned',
      whitelistRestored: restoreWhitelist,
    })
  } catch (error: any) {
    console.error('Error unbanning user:', error)
    const errorMessage = error?.message || 'Der opstod en fejl ved unbanning af brugeren'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
