import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/authOptions'
import fs from 'fs'
import path from 'path'

interface UserNote {
  id: string
  userId: string
  content: string
  imageUrl?: string
  createdAt: string
  createdBy: string
}

// File path for storing user notes
const DATA_DIR = path.join(process.cwd(), 'data')
const NOTES_FILE = path.join(DATA_DIR, 'user-notes.json')
const NOTES_IMAGES_DIR = path.join(DATA_DIR, 'notes-images')

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(NOTES_IMAGES_DIR)) {
    fs.mkdirSync(NOTES_IMAGES_DIR, { recursive: true })
  }
}

// Load notes from file
function loadNotes(): UserNote[] {
  try {
    ensureDataDir()
    if (fs.existsSync(NOTES_FILE)) {
      const fileContent = fs.readFileSync(NOTES_FILE, 'utf-8')
      return JSON.parse(fileContent)
    }
    return []
  } catch (error) {
    console.error('Error loading notes:', error)
    return []
  }
}

// Save notes to file
function saveNotes(notes: UserNote[]): void {
  try {
    ensureDataDir()
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving notes:', error)
  }
}

// Save image from base64
function saveImage(base64Data: string, noteId: string): string {
  try {
    ensureDataDir()
    // Remove data:image/...;base64, prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Image, 'base64')
    const imageFileName = `${noteId}.png`
    const imagePath = path.join(NOTES_IMAGES_DIR, imageFileName)
    fs.writeFileSync(imagePath, buffer)
    return `/api/admin/users/notes/image/${imageFileName}`
  } catch (error) {
    console.error('Error saving image:', error)
    throw error
  }
}

// GET - Get notes for a user
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
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    const notes = loadNotes()
    const userNotes = notes.filter((note) => note.userId === userId)

    return NextResponse.json({
      success: true,
      notes: userNotes,
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new note
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
    const { userId, content, image } = body

    if (!userId || !content) {
      return NextResponse.json(
        { success: false, error: 'User ID and content are required' },
        { status: 400 }
      )
    }

    const notes = loadNotes()
    const noteId = Date.now().toString()
    
    let imageUrl: string | undefined = undefined
    if (image) {
      try {
        imageUrl = saveImage(image, noteId)
      } catch (error) {
        console.error('Error saving image:', error)
        // Continue without image if save fails
      }
    }

    const newNote: UserNote = {
      id: noteId,
      userId,
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
      createdBy: session.user?.name || 'Admin',
    }

    notes.push(newNote)
    saveNotes(notes)

    // Create log entry
    const LOGS_FILE = path.join(DATA_DIR, 'logs.json')
    let logs: any[] = []
    if (fs.existsSync(LOGS_FILE)) {
      const fileContent = fs.readFileSync(LOGS_FILE, 'utf-8')
      logs = JSON.parse(fileContent)
    }
    logs.push({
      id: Date.now().toString(),
      action: 'note_added',
      userId,
      userName: session.user?.name || 'Admin',
      details: `Note tilføjet til bruger ${userId}`,
      timestamp: new Date().toISOString(),
    })
    const logsToSave = logs.slice(-10000)
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logsToSave, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      note: newNote,
    })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
