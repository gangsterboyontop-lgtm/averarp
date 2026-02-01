import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/authOptions'
import fs from 'fs'
import path from 'path'

// File-based storage for logs
interface LogEntry {
  id: string
  action: string
  userId: string
  userName: string
  details: string
  timestamp: string
}

// File path for storing logs
const DATA_DIR = path.join(process.cwd(), 'data')
const LOGS_FILE = path.join(DATA_DIR, 'logs.json')

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Load logs from file
function loadLogs(): LogEntry[] {
  try {
    ensureDataDir()
    if (fs.existsSync(LOGS_FILE)) {
      const fileContent = fs.readFileSync(LOGS_FILE, 'utf-8')
      return JSON.parse(fileContent)
    }
    return []
  } catch (error) {
    console.error('Error loading logs:', error)
    return []
  }
}

// Save logs to file
function saveLogs(logs: LogEntry[]): void {
  try {
    ensureDataDir()
    // Keep only last 10000 logs to prevent file from growing too large
    const logsToSave = logs.slice(-10000)
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logsToSave, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving logs:', error)
  }
}

// POST - Create a new log entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, userId, userName, details } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    const newLog: LogEntry = {
      id: Date.now().toString(),
      action,
      userId: userId || (session.user as any)?.id || 'unknown',
      userName: userName || session.user?.name || 'Unknown',
      details: details || '',
      timestamp: new Date().toISOString(),
    }

    const logs = loadLogs()
    logs.push(newLog)
    saveLogs(logs)

    return NextResponse.json({
      success: true,
      log: newLog,
    })
  } catch (error) {
    console.error('Error creating log:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get logs (admin only)
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

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    let logs = loadLogs()

    // Filter by userId if provided
    if (userId) {
      logs = logs.filter((log) => log.userId === userId)
    }

    // Filter by action if provided
    if (action) {
      logs = logs.filter((log) => log.action === action)
    }

    // Sort by timestamp (newest first) and limit
    logs = logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
