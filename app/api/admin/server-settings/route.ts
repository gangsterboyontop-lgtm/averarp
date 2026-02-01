import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ success: false, error: 'Ikke autentificeret' }, { status: 401 })
    }

    const isAdmin = (session.user as any)?.isAdmin || false
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Ingen adgang' }, { status: 403 })
    }

    // Read package.json to get current settings
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageJsonContent)

    // Extract hostname and port from dev script
    let hostname = '0.0.0.0'
    let port = 3000

    if (packageJson.scripts?.dev) {
      const devScript = packageJson.scripts.dev
      const hostnameMatch = devScript.match(/-H\s+(\S+)/)
      const portMatch = devScript.match(/-p\s+(\d+)/)
      
      if (hostnameMatch) {
        hostname = hostnameMatch[1]
      }
      if (portMatch) {
        port = parseInt(portMatch[1])
      }
    }

    // Get Node.js version
    let nodeVersion = ''
    try {
      const { stdout } = await execAsync('node --version')
      nodeVersion = stdout.trim()
    } catch (error) {
      nodeVersion = 'Ukendt'
    }

    // Get Next.js version from package.json
    const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next || 'Ukendt'

    return NextResponse.json({
      success: true,
      settings: {
        hostname,
        port,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion,
        nextVersion,
      },
    })
  } catch (error) {
    console.error('Error fetching server settings:', error)
    return NextResponse.json(
      { success: false, error: 'Fejl ved indlæsning af indstillinger' },
      { status: 500 }
    )
  }
}

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
    const { hostname, port } = body

    if (!hostname || !port) {
      return NextResponse.json(
        { success: false, error: 'Hostname og port er påkrævet' },
        { status: 400 }
      )
    }

    // Read package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageJsonContent)

    // Update dev script
    if (packageJson.scripts?.dev) {
      // Remove existing -H and -p flags
      let devScript = packageJson.scripts.dev.replace(/-H\s+\S+/g, '').replace(/-p\s+\d+/g, '').trim()
      
      // Add new flags
      devScript = `next dev -H ${hostname} -p ${port}`
      
      packageJson.scripts.dev = devScript
    } else {
      packageJson.scripts = packageJson.scripts || {}
      packageJson.scripts.dev = `next dev -H ${hostname} -p ${port}`
    }

    // Write updated package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'Indstillinger gemt succesfuldt',
    })
  } catch (error) {
    console.error('Error saving server settings:', error)
    return NextResponse.json(
      { success: false, error: 'Fejl ved gemning af indstillinger' },
      { status: 500 }
    )
  }
}
