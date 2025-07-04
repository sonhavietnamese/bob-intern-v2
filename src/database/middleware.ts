import { Context, MiddlewareFn } from 'grammy'
import { dbService } from './services'
import type { DatabaseContext, UserData, MinimalSessionData } from '../onboarding/types'

/**
 * Database middleware that loads user data from database for each request
 * and provides helper methods to update the database
 */
export function createDatabaseMiddleware(): MiddlewareFn<DatabaseContext> {
  return async (ctx, next) => {
    const telegramId = ctx.from?.id?.toString()

    // Helper function to load user data from database
    const loadUserData = async (): Promise<UserData> => {
      if (!telegramId) {
        return {
          user: null,
          expertise: [],
          skills: [],
          listings: [],
          priceRange: null,
        }
      }

      const profile = await dbService.getUserProfile(telegramId)

      if (!profile) {
        return {
          user: null,
          expertise: [],
          skills: [],
          listings: [],
          priceRange: null,
        }
      }

      return {
        user: profile.user,
        expertise: profile.expertise || [],
        skills: profile.skills || [],
        listings: profile.listings || [],
        priceRange: profile.priceRange || null,
      }
    }

    // Load initial user data
    const userData = await loadUserData()

    // Helper function to reload user data
    const reloadUserData = async (): Promise<void> => {
      const newUserData = await loadUserData()
      ctx.userData = newUserData
    }

    // Helper function to update user data in database and reload
    const updateUserData = async (updates: Partial<UserData>): Promise<void> => {
      if (!telegramId) return

      // Update database based on provided updates
      if (updates.expertise !== undefined) {
        await dbService.setUserExpertise(telegramId, updates.expertise)
      }

      if (updates.skills !== undefined) {
        await dbService.setUserSkills(telegramId, updates.skills)
      }

      if (updates.listings !== undefined) {
        await dbService.setUserListings(telegramId, updates.listings)
      }

      if (updates.priceRange !== undefined) {
        if (updates.priceRange) {
          await dbService.setUserPriceRange(telegramId, updates.priceRange)
        }
      }

      // If user object updates are provided, update the user
      if (updates.user) {
        await dbService.updateUser(telegramId, {
          userName: updates.user.userName,
          firstName: updates.user.firstName,
          lastName: updates.user.lastName,
          username: updates.user.username,
        })
      }

      // Reload user data after updates
      await reloadUserData()
    }

    // Attach user data and helper methods to context
    ctx.userData = userData
    ctx.reloadUserData = reloadUserData
    ctx.updateUserData = updateUserData

    // Continue to next middleware
    await next()
  }
}

/**
 * Helper function to ensure user exists in database
 * Creates a new user if one doesn't exist
 */
export async function ensureUserExists(ctx: Context): Promise<boolean> {
  const telegramId = ctx.from?.id?.toString()

  if (!telegramId) return false

  let user = await dbService.getUserByTelegramId(telegramId)

  if (!user) {
    // Create new user with minimal data
    user = await dbService.createUser({
      telegramId,
      userName: ctx.from?.first_name || 'Unknown',
      firstName: ctx.from?.first_name || '',
      lastName: ctx.from?.last_name || '',
      username: ctx.from?.username || '',
    })
  }

  return user !== null
}
