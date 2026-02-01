import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/authOptions'

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

    // Check if user is admin
    const isAdmin = (session.user as any)?.isAdmin || false
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const botToken = process.env.DISCORD_BOT_TOKEN
    const guildId = process.env.DISCORD_GUILD_ID

    if (!botToken || !guildId) {
      return NextResponse.json(
        { success: false, error: 'Discord bot not configured' },
        { status: 500 }
      )
    }

    try {
      // Fetch all guild members
      const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
        headers: {
          'Authorization': `Bot ${botToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`)
      }

      const members = await response.json()
      
      // Transform to user format
      const users = members.map((member: any) => ({
        id: member.user.id,
        discordId: member.user.id,
        name: member.user.global_name || member.user.username || `User ${member.user.id}`,
        avatar: member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : null,
      }))

      return NextResponse.json({
        success: true,
        users,
      })
    } catch (error: any) {
      console.error('Error fetching Discord users:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch Discord users' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in discord-users route:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
