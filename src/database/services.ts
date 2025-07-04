// @ts-nocheck
import { TIMING_CONFIG } from '@/config'
import type { User } from '@prisma/client'
import { db } from './connection'

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

  // Listing operations
  async createOrUpdateListing(listingData: {
    id: string
    title: string
    slug: string
    deadline: string
    token: string
    usdValue: number
    type: string
    compensationType: string
    sponsor: object
    skills: Array<{ skills: string; subskills: string[] }>
    mappedSkill?: string[]
  }): Promise<any | null> {
    try {
      const result = await db.listing.upsert({
        where: { id: listingData.id },
        update: {
          title: listingData.title,
          slug: listingData.slug,
          deadline: new Date(listingData.deadline),
          token: listingData.token,
          usdValue: listingData.usdValue,
          type: listingData.type,
          compensationType: listingData.compensationType,
          sponsor: JSON.stringify(listingData.sponsor),
          skills: JSON.stringify(listingData.skills),
          mappedSkill: listingData.mappedSkill ? JSON.stringify(listingData.mappedSkill) : null,
          lastFetched: new Date(),
        },
        create: {
          id: listingData.id,
          title: listingData.title,
          slug: listingData.slug,
          deadline: new Date(listingData.deadline),
          token: listingData.token,
          usdValue: listingData.usdValue,
          type: listingData.type,
          compensationType: listingData.compensationType,
          sponsor: JSON.stringify(listingData.sponsor),
          skills: JSON.stringify(listingData.skills),
          mappedSkill: listingData.mappedSkill ? JSON.stringify(listingData.mappedSkill) : null,
        },
      })
      return result
    } catch (error) {
      console.error('Error creating/updating listing:', error)
      return null
    }
  }

  async getListingById(id: string): Promise<any | null> {
    try {
      const result = await db.listing.findUnique({
        where: { id },
      })
      return result
    } catch (error) {
      console.error('Error fetching listing by ID:', error)
      return null
    }
  }

  async getListingBySlug(slug: string): Promise<any | null> {
    try {
      const result = await db.listing.findUnique({
        where: { slug },
      })
      return result
    } catch (error) {
      console.error('Error fetching listing by slug:', error)
      return null
    }
  }

  async getActiveListings(): Promise<any[]> {
    try {
      const result = await db.listing.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      })
      return result
    } catch (error) {
      console.error('Error fetching active listings:', error)
      return []
    }
  }

  async getListingsByType(type: string): Promise<any[]> {
    try {
      const result = await db.listing.findMany({
        where: {
          type,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return result
    } catch (error) {
      console.error('Error fetching listings by type:', error)
      return []
    }
  }

  async getRecentListings(limit: number = 10): Promise<any[]> {
    try {
      const result = await db.listing.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return result
    } catch (error) {
      console.error('Error fetching recent listings:', error)
      return []
    }
  }

  async markListingInactive(id: string): Promise<boolean> {
    try {
      await db.listing.update({
        where: { id },
        data: { isActive: false },
      })
      return true
    } catch (error) {
      console.error('Error marking listing as inactive:', error)
      return false
    }
  }

  async getListingStats(): Promise<{
    totalListings: number
    activeListings: number
    bounties: number
    projects: number
    averageUsdValue: number
  }> {
    try {
      const [totalListings, activeListings, bounties, projects, averageValue] = await Promise.all([
        db.listing.count(),
        db.listing.count({ where: { isActive: true } }),
        db.listing.count({ where: { type: 'bounty', isActive: true } }),
        db.listing.count({ where: { type: 'project', isActive: true } }),
        db.listing.aggregate({
          where: { isActive: true },
          _avg: { usdValue: true },
        }),
      ])

      return {
        totalListings,
        activeListings,
        bounties,
        projects,
        averageUsdValue: Math.round(averageValue._avg.usdValue || 0),
      }
    } catch (error) {
      console.error('Error fetching listing stats:', error)
      return {
        totalListings: 0,
        activeListings: 0,
        bounties: 0,
        projects: 0,
        averageUsdValue: 0,
      }
    }
  }

  async bulkCreateOrUpdateListings(
    listingsData: Array<{
      id: string
      title: string
      slug: string
      deadline: string
      token: string
      usdValue: number
      type: string
      compensationType: string
      sponsor: object
      skills: Array<{ skills: string; subskills: string[] }>
    }>,
  ): Promise<number> {
    try {
      let successCount = 0

      for (const listingData of listingsData) {
        const result = await this.createOrUpdateListing(listingData)
        if (result) {
          successCount++
        }
      }

      return successCount
    } catch (error) {
      console.error('Error in bulk create/update listings:', error)
      return 0
    }
  }

  // User Listing Match operations
  async createUserListingMatch(userId: number, listingId: string, matchScore: number = 1): Promise<any | null> {
    try {
      const result = await db.userListingMatch.create({
        data: {
          userId,
          listingId,
          matchScore,
        },
      })
      return result
    } catch (error) {
      console.error('Error creating user listing match:', error)
      return null
    }
  }

  async getUserListingMatches(userId: number): Promise<any[]> {
    try {
      const result = await db.userListingMatch.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: {
          listing: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return result
    } catch (error) {
      console.error('Error fetching user listing matches:', error)
      return []
    }
  }

  async getActiveUserListingMatches(): Promise<any[]> {
    try {
      const result = await db.userListingMatch.findMany({
        where: { isActive: true },
        include: {
          user: true,
          listing: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return result
    } catch (error) {
      console.error('Error fetching active user listing matches:', error)
      return []
    }
  }

  async checkUserListingMatchExists(userId: number, listingId: string): Promise<boolean> {
    try {
      const existing = await db.userListingMatch.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      })
      return !!existing
    } catch (error) {
      console.error('Error checking user listing match:', error)
      return false
    }
  }

  // User Notification operations
  async createUserNotification(userId: number, listingId: string, messageType: string = 'skill_match'): Promise<any | null> {
    try {
      const result = await db.userNotification.create({
        data: {
          userId,
          listingId,
          messageType,
        },
      })
      return result
    } catch (error) {
      console.error('Error creating user notification:', error)
      return null
    }
  }

  async getRecentNotifications(userId: number, hoursBack: number = 1): Promise<any[]> {
    try {
      // Use centralized timing configuration
      const cutoffTime = new Date(Date.now() - TIMING_CONFIG.REMINDERS.RECENT_NOTIFICATION_CUTOFF_MS)

      const result = await db.userNotification.findMany({
        where: {
          userId,
          sentAt: {
            gte: cutoffTime,
          },
        },
        orderBy: { sentAt: 'desc' },
      })
      return result
    } catch (error) {
      console.error('Error fetching recent notifications:', error)
      return []
    }
  }

  async canSendNotificationToUser(userId: number, hoursBack: number = 1): Promise<boolean> {
    try {
      const recentNotifications = await this.getRecentNotifications(userId, hoursBack)
      return recentNotifications.length === 0
    } catch (error) {
      console.error('Error checking notification eligibility:', error)
      return false
    }
  }

  async hasNotificationBeenSentForListing(userId: number, listingId: string): Promise<boolean> {
    try {
      const existingNotification = await db.userNotification.findFirst({
        where: {
          userId,
          listingId,
        },
      })
      return !!existingNotification
    } catch (error) {
      console.error('Error checking listing notification:', error)
      return false
    }
  }

  async getUsersForSkillMatching(): Promise<any[]> {
    try {
      const result = await db.user.findMany({
        where: {
          expertise: {
            not: null,
          },
        },
        select: {
          id: true,
          telegramId: true,
          userName: true,
          skills: true,
          expertise: true,
        },
      })
      return result
    } catch (error) {
      console.error('Error fetching users for skill matching:', error)
      return []
    }
  }

  async getMatchingStats(): Promise<{
    totalMatches: number
    activeMatches: number
    notificationsSentToday: number
    usersWithMatches: number
  }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [totalMatches, activeMatches, notificationsSentToday, usersWithMatches] = await Promise.all([
        db.userListingMatch.count(),
        db.userListingMatch.count({ where: { isActive: true } }),
        db.userNotification.count({
          where: {
            sentAt: {
              gte: today,
            },
          },
        }),
        db.userListingMatch
          .findMany({
            where: { isActive: true },
            select: { userId: true },
            distinct: ['userId'],
          })
          .then((results) => results.length),
      ])

      return {
        totalMatches,
        activeMatches,
        notificationsSentToday,
        usersWithMatches,
      }
    } catch (error) {
      console.error('Error fetching matching stats:', error)
      return {
        totalMatches: 0,
        activeMatches: 0,
        notificationsSentToday: 0,
        usersWithMatches: 0,
      }
    }
  }

  async removeDuplicateMatches(): Promise<number> {
    try {
      // Find duplicate matches (same user-listing combination)
      const duplicates = await db.userListingMatch.groupBy({
        by: ['userId', 'listingId'],
        having: {
          id: {
            _count: {
              gt: 1,
            },
          },
        },
        _count: {
          id: true,
        },
      })

      let deletedCount = 0

      for (const duplicate of duplicates) {
        // Keep the most recent match, delete older ones
        const matches = await db.userListingMatch.findMany({
          where: {
            userId: duplicate.userId,
            listingId: duplicate.listingId,
          },
          orderBy: { createdAt: 'desc' },
        })

        // Delete all but the first (most recent) match
        const toDelete = matches.slice(1)

        for (const match of toDelete) {
          await db.userListingMatch.delete({
            where: { id: match.id },
          })
          deletedCount++
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} duplicate matches`)
      }

      return deletedCount
    } catch (error) {
      console.error('Error removing duplicate matches:', error)
      return 0
    }
  }

  async clearAllNotifications(): Promise<number> {
    try {
      const result = await db.userNotification.deleteMany({})
      console.log(`🧹 Cleared ${result.count} notifications for testing`)
      return result.count
    } catch (error) {
      console.error('Error clearing notifications:', error)
      return 0
    }
  }

  // User Reminder operations
  async createUserReminder(
    userId: number,
    listingId: string,
    intervalHours: number = TIMING_CONFIG.REMINDERS.DEFAULT_INTERVAL_HOURS,
  ): Promise<any | null> {
    try {
      const result = await db.userReminder.create({
        data: {
          userId,
          listingId,
          intervalHours,
        },
      })
      return result
    } catch (error) {
      console.error('Error creating user reminder:', error)
      return null
    }
  }

  async getUserReminders(userId: number): Promise<any[]> {
    try {
      const result = await db.userReminder.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: {
          listing: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return result
    } catch (error) {
      console.error('Error fetching user reminders:', error)
      return []
    }
  }

  async getActiveReminders(): Promise<any[]> {
    try {
      const result = await db.userReminder.findMany({
        where: { isActive: true },
        include: {
          user: true,
          listing: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return result
    } catch (error) {
      console.error('Error fetching active reminders:', error)
      return []
    }
  }

  async checkUserReminderExists(userId: number, listingId: string): Promise<boolean> {
    try {
      const existing = await db.userReminder.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      })
      return !!existing
    } catch (error) {
      console.error('Error checking user reminder:', error)
      return false
    }
  }

  async updateReminderLastSent(userId: number, listingId: string): Promise<boolean> {
    try {
      await db.userReminder.update({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
        data: {
          lastRemindedAt: new Date(),
        },
      })
      return true
    } catch (error) {
      console.error('Error updating reminder last sent:', error)
      return false
    }
  }

  async getRemindersReadyToSend(): Promise<any[]> {
    try {
      const now = new Date()

      const result = await db.userReminder.findMany({
        where: {
          isActive: true,
          // Only get reminders where:
          // 1. Never sent before (lastRemindedAt is null)
          // 2. OR last reminded more than intervalHours ago
          OR: [
            { lastRemindedAt: null },
            {
              lastRemindedAt: {
                lte: new Date(now.getTime() - TIMING_CONFIG.REMINDERS.DEFAULT_INTERVAL_HOURS * 60 * 60 * 1000),
              },
            },
          ],
        },
        include: {
          user: true,
          listing: true,
        },
        orderBy: { createdAt: 'asc' }, // Send oldest reminders first
      })

      // Filter by actual interval hours for each reminder
      const readyReminders = result.filter((reminder) => {
        if (!reminder.lastRemindedAt) return true

        const intervalMs = reminder.intervalHours * 60 * 60 * 1000
        const timeSinceLastReminder = now.getTime() - reminder.lastRemindedAt.getTime()

        return timeSinceLastReminder >= intervalMs
      })

      return readyReminders
    } catch (error) {
      console.error('Error fetching reminders ready to send:', error)
      return []
    }
  }

  async deactivateReminder(userId: number, listingId: string): Promise<boolean> {
    try {
      await db.userReminder.update({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
        data: {
          isActive: false,
        },
      })
      return true
    } catch (error) {
      console.error('Error deactivating reminder:', error)
      return false
    }
  }

  async deactivateExpiredReminders(): Promise<number> {
    try {
      // Deactivate reminders for listings that are past deadline or inactive
      const expiredReminders = await db.userReminder.findMany({
        where: {
          isActive: true,
        },
        include: {
          listing: true,
        },
      })

      let deactivatedCount = 0
      const now = new Date()

      for (const reminder of expiredReminders) {
        // Check if listing is inactive or past deadline
        if (!reminder.listing.isActive || reminder.listing.deadline < now) {
          await this.deactivateReminder(reminder.userId, reminder.listingId)
          deactivatedCount++
        }
      }

      if (deactivatedCount > 0) {
        console.log(`🗑️  Deactivated ${deactivatedCount} reminders for expired/inactive listings`)
      }

      return deactivatedCount
    } catch (error) {
      console.error('Error deactivating expired reminders:', error)
      return 0
    }
  }

  async getReminderStats(): Promise<{
    totalReminders: number
    activeReminders: number
    remindersReadyToSend: number
    usersWithReminders: number
  }> {
    try {
      const [totalReminders, activeReminders, remindersReadyToSend, usersWithReminders] = await Promise.all([
        db.userReminder.count(),
        db.userReminder.count({ where: { isActive: true } }),
        this.getRemindersReadyToSend().then((reminders) => reminders.length),
        db.userReminder
          .findMany({
            where: { isActive: true },
            select: { userId: true },
            distinct: ['userId'],
          })
          .then((results) => results.length),
      ])

      return {
        totalReminders,
        activeReminders,
        remindersReadyToSend,
        usersWithReminders,
      }
    } catch (error) {
      console.error('Error fetching reminder stats:', error)
      return {
        totalReminders: 0,
        activeReminders: 0,
        remindersReadyToSend: 0,
        usersWithReminders: 0,
      }
    }
  }
}

// Export singleton instance
export const dbService = new DatabaseService()

// [{"skills":"Content","subskills":["Writing"]}]
