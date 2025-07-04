import { PrismaClient } from '@prisma/client'
import fs from 'fs-extra'
import path from 'path'

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data')
fs.ensureDirSync(dataDir)

// Create Prisma Client instance
export const db = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./data/bot.db',
    },
  },
})

// Initialize database and run migrations
export async function initDatabase() {
  try {
    console.log('🔄 Initializing database...')

    // Connect to database
    await db.$connect()

    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Close database connection
export async function closeDatabase() {
  await db.$disconnect()
}

// Types will be available after running 'prisma generate'
