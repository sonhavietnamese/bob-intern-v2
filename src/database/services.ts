import { db } from './connection'
import type { User } from '@prisma/client'

export class DatabaseService {
  // User operations
  async createUser(
    userData: Pick<User, 'telegramId' | 'userName'> & Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'telegramId' | 'userName'>>,
  ): Promise<User | null> {
    try {
      const result = await db.user.create({
        data: userData,
      })
      return result
    } catch (error) {
      console.error('Error creating user:', error)
      return null
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    try {
      const result = await db.user.findUnique({
        where: { telegramId },
      })
      return result
    } catch (error) {
      console.error('Error fetching user by telegram ID:', error)
      return null
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db.user.findMany()
      return result
    } catch (error) {
      console.error('Error fetching all users:', error)
      return []
    }
  }

  async updateUser(telegramId: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'telegramId'>>): Promise<User | null> {
    try {
      const result = await db.user.update({
        where: { telegramId },
        data: userData,
      })
      return result
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }

  // Expertise operations
  async setUserExpertise(telegramId: string, expertiseList: string[]): Promise<boolean> {
    try {
      await db.user.update({
        where: { telegramId },
        data: {
          expertise: JSON.stringify(expertiseList),
        },
      })
      return true
    } catch (error) {
      console.error('Error setting user expertise:', error)
      return false
    }
  }

  async getUserExpertise(telegramId: string): Promise<string[]> {
    try {
      const result = await db.user.findUnique({
        where: { telegramId },
        select: { expertise: true },
      })
      if (!result || !result.expertise) return []

      return JSON.parse(result.expertise)
    } catch (error) {
      console.error('Error fetching user expertise:', error)
      return []
    }
  }

  // Skills operations
  async setUserSkills(telegramId: string, skillsList: string[]): Promise<boolean> {
    try {
      await db.user.update({
        where: { telegramId },
        data: {
          skills: JSON.stringify(skillsList),
        },
      })
      return true
    } catch (error) {
      console.error('Error setting user skills:', error)
      return false
    }
  }

  async getUserSkills(telegramId: string): Promise<string[]> {
    try {
      const result = await db.user.findUnique({
        where: { telegramId },
        select: { skills: true },
      })
      if (!result || !result.skills) return []

      return JSON.parse(result.skills)
    } catch (error) {
      console.error('Error fetching user skills:', error)
      return []
    }
  }

  // Listings operations
  async setUserListings(telegramId: string, listingsList: string[]): Promise<boolean> {
    try {
      await db.user.update({
        where: { telegramId },
        data: {
          listings: JSON.stringify(listingsList),
        },
      })
      return true
    } catch (error) {
      console.error('Error setting user listings:', error)
      return false
    }
  }

  async getUserListings(telegramId: string): Promise<string[]> {
    try {
      const result = await db.user.findUnique({
        where: { telegramId },
        select: { listings: true },
      })
      if (!result || !result.listings) return []

      return JSON.parse(result.listings)
    } catch (error) {
      console.error('Error fetching user listings:', error)
      return []
    }
  }

  // Price range operations
  async setUserPriceRange(telegramId: string, priceRangeData: { minAmount: number; maxAmount: number; rangeLabel: string }): Promise<boolean> {
    try {
      await db.user.update({
        where: { telegramId },
        data: {
          priceRange: JSON.stringify(priceRangeData),
        },
      })
      return true
    } catch (error) {
      console.error('Error setting user price range:', error)
      return false
    }
  }

  async getUserPriceRange(telegramId: string): Promise<{ minAmount: number; maxAmount: number; rangeLabel: string } | null> {
    try {
      const result = await db.user.findUnique({
        where: { telegramId },
        select: { priceRange: true },
      })
      if (!result || !result.priceRange) return null

      return JSON.parse(result.priceRange)
    } catch (error) {
      console.error('Error fetching user price range:', error)
      return null
    }
  }

  // Complete user profile
  async getUserProfile(telegramId: string) {
    try {
      const user = await this.getUserByTelegramId(telegramId)
      if (!user) return null

      // Parse JSON fields
      const expertise = user.expertise ? JSON.parse(user.expertise) : []
      const skills = user.skills ? JSON.parse(user.skills) : []
      const listings = user.listings ? JSON.parse(user.listings) : []
      const priceRange = user.priceRange ? JSON.parse(user.priceRange) : null

      return {
        user,
        expertise,
        skills,
        listings,
        priceRange,
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }
}

// Export singleton instance
export const dbService = new DatabaseService()
