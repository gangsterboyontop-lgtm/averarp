import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
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

    // Check if user is admin
    const isAdmin = (session.user as any)?.isAdmin || false
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Fetch Discord users
    const botToken = process.env.DISCORD_BOT_TOKEN
    const guildId = process.env.DISCORD_GUILD_ID

    if (!botToken || !guildId) {
      return NextResponse.json(
        { success: false, error: 'Discord bot not configured' },
        { status: 500 }
      )
    }

    try {
      // Fetch all guild members with pagination
      let allMembers: any[] = []
      let after: string | null = null
      let hasMore = true

      while (hasMore) {
        const url: string = `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000${after ? `&after=${after}` : ''}`
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bot ${botToken}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = `Discord API error: ${response.status}`
          
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.message || errorMessage
          } catch {
            errorMessage = errorText || errorMessage
          }

          // Provide more specific error messages
          if (response.status === 401) {
            errorMessage = 'Invalid Discord bot token. Please check DISCORD_BOT_TOKEN in your .env.local file.'
          } else if (response.status === 403) {
            errorMessage = 'Bot lacks required permissions. Ensure the bot has "Server Members Intent" enabled in Discord Developer Portal and is in the guild.'
          } else if (response.status === 404) {
            errorMessage = 'Guild not found. Please check DISCORD_GUILD_ID in your .env.local file and ensure the bot is in the guild.'
          } else if (response.status === 429) {
            errorMessage = 'Discord API rate limit exceeded. Please try again later.'
          }

          console.error('Discord API error details:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            url: url.replace(botToken, 'REDACTED'),
          })

          throw new Error(errorMessage)
        }

        const members = await response.json()
        
        // Handle empty response or invalid data
        if (!Array.isArray(members)) {
          console.error('Unexpected Discord API response:', members)
          throw new Error('Discord API returned invalid data format')
        }

        allMembers = allMembers.concat(members)

        // Check if there are more members
        if (members.length < 1000) {
          hasMore = false
        } else {
          // Get the last member's user ID for pagination
          after = members[members.length - 1].user.id
        }
      }
      
      // Combine Discord users with trust data
      const usersMap = new Map<string, any>()
      
      allMembers.forEach((member: any) => {
        if (!member?.user?.id) {
          console.warn('Skipping member with missing user data:', member)
          return
        }

        const trustData = getOrCreateUserData(member.user.id)
        // Get Discord avatar URL
        // Note: discriminator is deprecated, use default avatar based on user ID
        const avatarUrl = member.user.avatar
          ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=256`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(member.user.id) % 5}.png`
        
        usersMap.set(member.user.id, {
          id: member.user.id,
          discordId: member.user.id,
          name: member.user.global_name || member.user.username || `User ${member.user.id}`,
          avatar: avatarUrl,
          trustScore: trustData.trustScore,
          warnings: trustData.warnings,
          roles: member.roles || [],
        })
      })

      // Always include the current user even if not in guild (for testing/admin purposes)
      const currentUserId = (session.user as any)?.id
      if (currentUserId && !usersMap.has(currentUserId)) {
        const trustData = getOrCreateUserData(currentUserId)
        // Get Discord avatar URL from session or use default
        const sessionAvatar = (session.user as any)?.image || session.user?.image
        const avatarUrl = sessionAvatar || `https://cdn.discordapp.com/embed/avatars/${parseInt(currentUserId) % 5}.png`
        
        usersMap.set(currentUserId, {
          id: currentUserId,
          discordId: currentUserId,
          name: session.user?.name || `User ${currentUserId}`,
          avatar: avatarUrl,
          trustScore: trustData.trustScore,
          warnings: trustData.warnings,
          roles: (session.user as any)?.roleIds || [],
        })
      }

      const users = Array.from(usersMap.values())

      return NextResponse.json({
        success: true,
        users,
      })
    } catch (error: any) {
      console.error('Error fetching Discord users:', error)
      const errorMessage = error?.message || 'Failed to fetch Discord users'
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
