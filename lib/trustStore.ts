/**
 * Shared trust data store with file-based persistence
 */

import fs from 'fs'
import path from 'path'

export interface TrustData {
  trustScore: number
  warnings: Warning[]
}

export interface Warning {
  id: string
  reason: string
  note?: string
  severity: 'low' | 'medium' | 'high'
  issuedAt: string
  issuedBy: string
  removedAt?: string
  removedBy?: string
  removalReason?: string
}

// File path for storing trust data
const DATA_DIR = path.join(process.cwd(), 'data')
const TRUST_DATA_FILE = path.join(DATA_DIR, 'trust-data.json')

// In-memory cache
let trustDataStore: Record<string, TrustData> = {}
let isInitialized = false

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Load data from file
function loadData(): void {
  try {
    ensureDataDir()
    if (fs.existsSync(TRUST_DATA_FILE)) {
      const fileContent = fs.readFileSync(TRUST_DATA_FILE, 'utf-8')
      trustDataStore = JSON.parse(fileContent)
    } else {
      trustDataStore = {}
      saveData() // Create empty file
    }
  } catch (error) {
    console.error('Error loading trust data:', error)
    trustDataStore = {}
  }
  isInitialized = true
}

// Save data to file
function saveData(): void {
  try {
    ensureDataDir()
    fs.writeFileSync(TRUST_DATA_FILE, JSON.stringify(trustDataStore, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving trust data:', error)
  }
}

// Initialize on first use
function initialize() {
  if (!isInitialized) {
    loadData()
  }
}

export function getOrCreateUserData(userId: string): TrustData {
  initialize()
  if (!trustDataStore[userId]) {
    trustDataStore[userId] = {
      trustScore: 100,
      warnings: [],
    }
    saveData() // Save new user data
  }
  return trustDataStore[userId]
}

export function getUserData(userId: string): TrustData | null {
  initialize()
  return trustDataStore[userId] || null
}

export function setUserData(userId: string, data: TrustData): void {
  initialize()
  trustDataStore[userId] = data
  saveData() // Persist changes
}

export function getAllUsers(): Array<{ userId: string; data: TrustData }> {
  initialize()
  return Object.entries(trustDataStore).map(([userId, data]) => ({
    userId,
    data,
  }))
}

// Export function to manually save (for explicit saves after mutations)
export function persistData(): void {
  initialize()
  saveData()
}
