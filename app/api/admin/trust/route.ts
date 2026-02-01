import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/authOptions'
import { getOrCreateUserData, setUserData } from '@/lib/trustStore'
import fs from 'fs'
import path from 'path'

// File-based logging (shared with logs API)
interface LogEntry {
  id: string
  action: string
  userId: string
  userName: string
  details: string
  timestamp: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const LOGS_FILE = path.join(DATA_DIR, 'logs.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Helper function to create log entries directly
function createLog(action: string, userId: string, userName: string, details: string) {
  try {
    ensureDataDir()
    let logs: LogEntry[] = []
    
    if (fs.existsSync(LOGS_FILE)) {
      const fileContent = fs.readFileSync(LOGS_FILE, 'utf-8')
      logs = JSON.parse(fileContent)
    }

    const newLog: LogEntry = {
      id: Date.now().toString(),
      action,
      userId,
      userName,
      details,
      timestamp: new Date().toISOString(),
    }

    logs.push(newLog)
    // Keep only last 10000 logs
    const logsToSave = logs.slice(-10000)
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logsToSave, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error creating log entry:', error)
    // Don't fail the request if logging fails
  }
}

// GET - Get trust data for a specific user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isAdmin = (session.user as any)?.isAdmin || false
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Non-admins can only see their own data
    if (!isAdmin && (session.user as any)?.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const userData = getOrCreateUserData(userId)

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

// POST - Update trust score or add warning
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isAdmin = (session.user as any)?.isAdmin || false
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, action, value } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    const userData = getOrCreateUserData(userId)

    if (action === 'adjustScore') {
      // Adjust trust score
      const adjustment = typeof value === 'number' ? value : parseInt(value)
      const oldScore = userData.trustScore
      userData.trustScore = Math.max(0, Math.min(100, userData.trustScore + adjustment))
      setUserData(userId, userData) // Save changes
      
      // Log the change
      await createLog(
        'trust_score_adjusted',
        userId,
        session.user?.name || 'Admin',
        `Trust score justeret fra ${oldScore} til ${userData.trustScore} (${adjustment > 0 ? '+' : ''}${adjustment})`
      )
    } else if (action === 'setScore') {
      // Set trust score to specific value
      const newScore = typeof value === 'number' ? value : parseInt(value)
      const oldScore = userData.trustScore
      userData.trustScore = Math.max(0, Math.min(100, newScore))
      setUserData(userId, userData) // Save changes
      
      // Log the change
      await createLog(
        'trust_score_set',
        userId,
        session.user?.name || 'Admin',
        `Trust score sat fra ${oldScore} til ${userData.trustScore}`
      )
    } else if (action === 'addWarning') {
      // Add warning
      const { reason, note, severity } = value
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Warning reason required' },
          { status: 400 }
        )
      }

      const newWarning = {
        id: Date.now().toString(),
        reason,
        note: note || undefined,
        severity: severity || 'low',
        issuedAt: new Date().toISOString(),
        issuedBy: session.user?.name || 'Admin',
      }

      userData.warnings.push(newWarning)

      // Automatically reduce trust score based on severity
      const scoreReduction = severity === 'high' ? 20 : severity === 'medium' ? 10 : 5
      const oldScore = userData.trustScore
      userData.trustScore = Math.max(0, userData.trustScore - scoreReduction)
      
      setUserData(userId, userData) // Save changes
      
      // Log the warning
      await createLog(
        'warning_added',
        userId,
        session.user?.name || 'Admin',
        `Advarsel tilføjet: ${reason} (${severity} alvorlighed). Trust score reduceret fra ${oldScore} til ${userData.trustScore}${note ? `. Note: ${note}` : ''}`
      )
    } else if (action === 'removeWarning') {
      // Remove warning
      const { warningId, reason } = value
      if (!warningId) {
        return NextResponse.json(
          { success: false, error: 'Warning ID required' },
          { status: 400 }
        )
      }
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Removal reason required' },
          { status: 400 }
        )
      }

      const warning = userData.warnings.find((w: any) => w.id === warningId)
      if (!warning) {
        return NextResponse.json(
          { success: false, error: 'Warning not found' },
          { status: 404 }
        )
      }

      // Mark warning as removed instead of deleting it
      warning.removedAt = new Date().toISOString()
      warning.removedBy = session.user?.name || 'Admin'
      warning.removalReason = reason

      // Restore trust score based on severity
      const scoreRestoration = warning.severity === 'high' ? 20 : warning.severity === 'medium' ? 10 : 5
      const oldScore = userData.trustScore
      userData.trustScore = Math.min(100, userData.trustScore + scoreRestoration)
      
      setUserData(userId, userData) // Save changes
      
      // Log the warning removal
      await createLog(
        'warning_removed',
        userId,
        session.user?.name || 'Admin',
        `Advarsel fjernet: ${warning.reason} (${warning.severity} alvorlighed). Trust score forhøjet fra ${oldScore} til ${userData.trustScore}. Grund: ${reason}`
      )
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      trustScore: userData.trustScore,
      warnings: userData.warnings,
    })
  } catch (error) {
    console.error('Error updating trust data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
