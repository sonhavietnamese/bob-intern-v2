import { Composer, session } from 'grammy'
import { createDatabaseMiddleware } from '@/database/middleware'

import databaseStart from './commands/start'
import databaseExpertise from './commands/expertise'
import databaseProfile from './commands/profile'
import databaseListing from './commands/listing'
import databaseSkills from './commands/skills'
import databaseRange from './commands/range'

import { handleDatabaseCallbackQuery } from './handlers/callbacks'
import { handleDatabaseTextMessage } from './handlers/messages'

import type { DatabaseContext, MinimalSessionData } from './types'

export const databaseComposer = new Composer<DatabaseContext>()

// Minimal session middleware for UI state only
const minimalSessionMiddleware = session({
  initial(): MinimalSessionData {
    return {
      waitingForName: false,
      isOnboarding: false,
    }
  },
})

// Database middleware to load user data
const databaseMiddleware = createDatabaseMiddleware()

// Apply middlewares
databaseComposer.use(minimalSessionMiddleware)
databaseComposer.use(databaseMiddleware)

// Commands
databaseComposer.command('start', databaseStart)
databaseComposer.command('expertise', databaseExpertise)
databaseComposer.command('profile', databaseProfile)
databaseComposer.command('listing', databaseListing)
databaseComposer.command('skills', databaseSkills)
databaseComposer.command('range', databaseRange)

// Handlers
databaseComposer.on('callback_query', handleDatabaseCallbackQuery)
databaseComposer.on('message:text', handleDatabaseTextMessage)

export const databaseCommands = [
  { command: 'start', description: 'Start the onboarding flow' },
  { command: 'listing', description: 'Setup your listing preferences' },
  { command: 'expertise', description: 'Setup your expertise' },
  { command: 'skills', description: 'Setup your skills' },
  { command: 'range', description: 'Setup your USD range' },
  { command: 'profile', description: 'View your profile' },
]
