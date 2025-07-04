import { type Context, type SessionFlavor } from 'grammy'
import type { User } from '@prisma/client'

// User data loaded from database
export interface UserData {
  user: User | null
  expertise: string[]
  skills: string[]
  listings: string[]
  priceRange: { minAmount: number; maxAmount: number; rangeLabel: string } | null
}

// Minimal session data for UI state only
export interface MinimalSessionData {
  waitingForName?: boolean
  isOnboarding?: boolean
  // Temporary UI state that doesn't need to persist
  lastMessageId?: number
}

// Database-backed context interface
export interface DatabaseBackedContext {
  userData: UserData
  // Helper methods to update database and reload user data
  reloadUserData: () => Promise<void>
  updateUserData: (updates: Partial<UserData>) => Promise<void>
}

// Legacy session data interface (for backward compatibility during migration)
export interface OnboardingSessionData {
  waitingForName?: boolean
  userName?: string
  selectedExpertise?: string[]
  selectedSkills?: string[]
  selectedListings?: string[]
  selectedRange?: {
    min: number
    max: number
  }
  isOnboarding?: boolean
}

// New database-backed context type
export type DatabaseContext = Context & SessionFlavor<MinimalSessionData> & DatabaseBackedContext

// Legacy context type (for backward compatibility)
export type OnboardingContext = Context & SessionFlavor<OnboardingSessionData>
