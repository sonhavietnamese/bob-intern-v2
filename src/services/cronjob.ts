import { Bot } from 'grammy'
import { SUPERTEAM_EARN_SKILL_MAPPING } from '../config'
import { dbService } from '../database/services'
import { getImageUrl } from '../lib/url'
import { generateListingThumbnail } from '../lib/utils'
import type { DatabaseContext } from '../onboarding/types'
import { TIMING_CONFIG } from '../config'

interface ListingItem {
  id: string
  rewardAmount: number | null
  deadline: string
  type: 'bounty' | 'project'
  title: string
  token: string
  winnersAnnouncedAt: string | null
  slug: string
  isWinnersAnnounced: boolean
  isFeatured: boolean
  compensationType: 'fixed' | 'range'
  minRewardAsk: number | null
  maxRewardAsk: number | null
  status: string
  _count: {
    Comments: number
    Submission: number
  }
  sponsor: {
    name: string
    slug: string
    logo: string
    isVerified: boolean
    st: boolean
  }
}

interface DetailedListingData {
  id: string
  title: string
  slug: string
  deadline: string
  token: string
  usdValue: number
  skills: Array<{
    skills: string
    subskills: string[]
  }>
  type: 'bounty' | 'project'
  compensationType: 'fixed' | 'range'
  sponsor: {
    name: string
    logo: string
    entityName: string
    isVerified: boolean
    isCaution: boolean
  }
}

interface DetailedListingResponse {
  pageProps: {
    bounty: DetailedListingData
  }
  __N_SSP: boolean
}

export class CronjobService {
  private bot: Bot<DatabaseContext>
  private messageQueue: any

  constructor(bot: Bot<DatabaseContext>, messageQueue: any) {
    this.bot = bot
    this.messageQueue = messageQueue
  }

  async fetchBounties(): Promise<ListingItem[]> {
    try {
      console.log('🔄 Fetching bounties from Superteam API...')
      const response = await fetch('https://earn.superteam.fun/api/listings?context=all&tab=bounties&category=All&status=open&sortBy=Date&order=asc')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const bounties = (await response.json()) as ListingItem[]
      console.log(`📋 Found ${bounties.length} bounties:`)

      bounties.forEach((bounty, index) => {
        const reward = bounty.rewardAmount
          ? `${bounty.rewardAmount} ${bounty.token}`
          : bounty.minRewardAsk && bounty.maxRewardAsk
          ? `${bounty.minRewardAsk}-${bounty.maxRewardAsk} ${bounty.token}`
          : 'No reward specified'

        console.log(`  ${index + 1}. "${bounty.title}" by ${bounty.sponsor.name} - ${reward}`)
        console.log(`     Deadline: ${new Date(bounty.deadline).toLocaleDateString()}, Submissions: ${bounty._count.Submission}`)
      })

      return bounties
    } catch (error) {
      console.error('❌ Error fetching bounties:', error)
      return []
    }
  }

  async fetchProjects(): Promise<ListingItem[]> {
    try {
      console.log('🔄 Fetching projects from Superteam API...')
      const response = await fetch('https://earn.superteam.fun/api/listings?context=all&tab=projects&category=All&status=open&sortBy=Date&order=asc')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const projects = (await response.json()) as ListingItem[]
      console.log(`📋 Found ${projects.length} projects:`)

      projects.forEach((project, index) => {
        const reward = project.rewardAmount
          ? `${project.rewardAmount} ${project.token}`
          : project.minRewardAsk && project.maxRewardAsk
          ? `${project.minRewardAsk}-${project.maxRewardAsk} ${project.token}`
          : 'No reward specified'

        // console.log(`  ${index + 1}. "${project.title}" by ${project.sponsor.name} - ${reward}`)
        // console.log(`     Deadline: ${new Date(project.deadline).toLocaleDateString()}, Submissions: ${project._count.Submission}`)
      })

      return projects
    } catch (error) {
      console.error('❌ Error fetching projects:', error)
      return []
    }
  }

  async fetchListingDetails(slug: string): Promise<DetailedListingData | null> {
    try {
      console.log(`🔍 Fetching details for: ${slug}`)
      const response = await fetch(`https://earn.superteam.fun/_next/data/tk8ooPatDrYLChDJ6Am_l/listing/${slug}.json?slug=${slug}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = (await response.json()) as DetailedListingResponse
      return data.pageProps.bounty
    } catch (error) {
      console.error(`❌ Error fetching details for ${slug}:`, error)
      return null
    }
  }

  async scanBountiesAndProjects() {
    try {
      console.log('🔄 Starting cronjob: scanning bounties and projects...')

      // Fetch both bounties and projects
      const [bounties, projects] = await Promise.all([this.fetchBounties(), this.fetchProjects()])

      console.log(`📊 Scan completed: ${bounties.length} bounties, ${projects.length} projects`)

      // Fetch detailed information for each bounty
      if (bounties.length > 0) {
        console.log('\n🔍 Fetching detailed bounty information...')
        const detailedBounties = await this.fetchAllDetails(bounties)
        console.log(`✅ Fetched details for ${detailedBounties.length}/${bounties.length} bounties`)
        this.logDetailedListings(detailedBounties, 'BOUNTIES')

        // Save bounties to database
        await this.saveListingsToDatabase(detailedBounties)
      }

      // Fetch detailed information for each project
      if (projects.length > 0) {
        console.log('\n🔍 Fetching detailed project information...')
        const detailedProjects = await this.fetchAllDetails(projects)
        console.log(`✅ Fetched details for ${detailedProjects.length}/${projects.length} projects`)
        this.logDetailedListings(detailedProjects, 'PROJECTS')

        // Save projects to database
        await this.saveListingsToDatabase(detailedProjects)
      }

      // TODO: Add logic to compare with existing data and determine which ones to send
      // For now, we'll just log the results
    } catch (error) {
      console.error('❌ Cronjob error:', error)
    }
  }

  async fetchAllDetails(listings: ListingItem[]): Promise<DetailedListingData[]> {
    const detailedListings: DetailedListingData[] = []

    // Process in batches to avoid overwhelming the API
    const batchSize = TIMING_CONFIG.API.LISTING_BATCH_SIZE
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize)

      const batchPromises = batch.map((listing) => this.fetchListingDetails(listing.slug))
      const batchResults = await Promise.all(batchPromises)

      // Filter out null results and add to detailed listings
      const validResults = batchResults.filter((result): result is DetailedListingData => result !== null)
      detailedListings.push(...validResults)

      // Small delay between batches to be respectful to the API
      if (i + batchSize < listings.length) {
        await new Promise((resolve) => setTimeout(resolve, TIMING_CONFIG.API.BATCH_DELAY_MS))
      }
    }

    return detailedListings
  }

  mapSkillsToSuperteamCategories(skills: Array<{ skills: string; subskills: string[] }>): string[] {
    const mappedSkills: string[] = []

    // Flatten all skills from the listing
    const allSkills: string[] = []

    for (const skillGroup of skills) {
      allSkills.push(skillGroup.skills.toUpperCase().trim())
      allSkills.push(...skillGroup.subskills.map((s) => s.toUpperCase().trim()))
    }

    // Check each SUPERTEAM_EARN_SKILL_MAPPING category
    for (const [category, categorySkills] of Object.entries(SUPERTEAM_EARN_SKILL_MAPPING)) {
      // Check if any listing skill matches any skill in this category
      const hasMatch = allSkills.some((listingSkill) =>
        categorySkills.some(
          (categorySkill) => listingSkill.includes(categorySkill.toUpperCase()) || categorySkill.toUpperCase().includes(listingSkill),
        ),
      )

      if (hasMatch) {
        mappedSkills.push(category)
      }
    }

    // Return unique mapped skills (category keys)
    return [...new Set(mappedSkills)]
  }

  logDetailedListings(listings: DetailedListingData[], category: string) {
    console.log(`\n📋 DETAILED ${category} INFORMATION:`)
    console.log('='.repeat(60))

    listings.forEach((listing, index) => {
      const skillsText = listing.skills.map((skill) => `${skill.skills} (${skill.subskills.join(', ')})`).join('; ')
      const mappedSkills = this.mapSkillsToSuperteamCategories(listing.skills)

      console.log(`${index + 1}. ${listing.title}`)
      // console.log(`   ID: ${listing.id}`)
      // console.log(`   Slug: ${listing.slug}`)
      // console.log(`   Type: ${listing.type}`)
      // console.log(`   Deadline: ${new Date(listing.deadline).toLocaleDateString()}`)
      // console.log(`   Token: ${listing.token}`)
      // console.log(`   USD Value: $${listing.usdValue}`)
      // console.log(`   Compensation: ${listing.compensationType}`)
      // console.log(`   Skills: ${skillsText || 'None specified'}`)
      // console.log(`   Mapped Skills: ${mappedSkills.length > 0 ? mappedSkills.join(', ') : 'None mapped'}`)
      // console.log(`   Sponsor: ${listing.sponsor.name} (${listing.sponsor.isVerified ? 'Verified' : 'Not verified'})`)
      // console.log('   ' + '-'.repeat(50))
    })
  }

  async saveListingsToDatabase(listings: DetailedListingData[]) {
    try {
      console.log(`\n💾 Saving ${listings.length} listings to database...`)

      const savePromises = listings.map((listing) => {
        const mappedSkills = this.mapSkillsToSuperteamCategories(listing.skills)
        return dbService.createOrUpdateListing({
          id: listing.id,
          title: listing.title,
          slug: listing.slug,
          deadline: listing.deadline,
          token: listing.token,
          usdValue: listing.usdValue,
          type: listing.type,
          compensationType: listing.compensationType,
          sponsor: listing.sponsor,
          skills: listing.skills,
          mappedSkill: mappedSkills,
        })
      })

      const results = await Promise.allSettled(savePromises)

      const successCount = results.filter((result) => result.status === 'fulfilled' && result.value !== null).length
      const errorCount = results.filter((result) => result.status === 'rejected').length

      console.log(`✅ Successfully saved ${successCount}/${listings.length} listings`)
      if (errorCount > 0) {
        console.log(`❌ Failed to save ${errorCount} listings`)
      }

      // Log database statistics
      const stats = await dbService.getListingStats()
      console.log(
        `📊 Database Stats: ${stats.totalListings} total (${stats.activeListings} active), ${stats.bounties} bounties, ${stats.projects} projects`,
      )
    } catch (error) {
      console.error('❌ Error saving listings to database:', error)
    }
  }

  // Skill matching and notification functionality
  async matchUsersWithListings() {
    try {
      console.log('🔄 Starting skill matching process...')

      // Get all users with skills
      const users = await dbService.getUsersForSkillMatching()
      if (users.length === 0) {
        console.log('📭 No users with skills found')
        return
      }

      // Get all active listings with mapped skills
      const listings = await dbService.getActiveListings()
      const listingsWithMappedSkills = listings.filter((listing) => listing.mappedSkill)

      if (listingsWithMappedSkills.length === 0) {
        console.log('📭 No listings with mapped skills found')
        return
      }

      console.log(`👥 Found ${users.length} users and ${listingsWithMappedSkills.length} listings to match`)

      let totalMatches = 0
      let newMatches = 0

      for (const user of users) {
        if (!user.expertise) continue

        const userSkills = JSON.parse(user.expertise) as string[]

        for (const listing of listingsWithMappedSkills) {
          const listingMappedSkills = JSON.parse(listing.mappedSkill) as string[]

          // Check if there's a skill match
          const matchingExpertise = this.findMatchingSkills(userSkills, listingMappedSkills)

          if (matchingExpertise.length > 0) {
            totalMatches++

            // Check if this match already exists
            const existingMatch = await dbService.checkUserListingMatchExists(user.id, listing.id)

            if (!existingMatch) {
              // Create new match
              const match = await dbService.createUserListingMatch(user.id, listing.id, matchingExpertise.length)
              if (match) {
                newMatches++
                console.log(`✅ New match: ${user.userName} <-> ${listing.title} (${matchingExpertise.join(', ')})`)
              }
            }
          }
        }
      }

      console.log(`🎯 Matching completed: ${totalMatches} total matches, ${newMatches} new matches created`)
    } catch (error) {
      console.error('❌ Error in skill matching:', error)
    }
  }

  findMatchingSkills(userExpertise: string[], listingMappedSkills: string[]): string[] {
    return userExpertise.filter((expertise) => listingMappedSkills.some((listingSkill) => expertise.toUpperCase() === listingSkill.toUpperCase()))
  }

  async sendSkillMatchNotifications() {
    try {
      console.log('📨 Starting skill match notification process...')

      // Get all active matches that haven't been notified yet
      const matches = await dbService.getActiveUserListingMatches()

      if (matches.length === 0) {
        console.log('📭 No active matches found')
        return
      }

      // Filter out matches that have already been notified
      const unnotifiedMatches = []
      for (const match of matches) {
        const alreadyNotified = await dbService.hasNotificationBeenSentForListing(match.userId, match.listingId)
        if (!alreadyNotified) {
          unnotifiedMatches.push(match)
        }
      }

      if (unnotifiedMatches.length === 0) {
        console.log('✅ All matches have been notified already')
        return
      }

      console.log(`🎯 Found ${unnotifiedMatches.length} unnotified matches out of ${matches.length} total`)

      // ONLY send 1 notification per cronjob run (to spread them out over time)
      const matchToNotify = unnotifiedMatches[0]

      console.log(`📤 Sending notification ${matches.length - unnotifiedMatches.length + 1}/${matches.length}`)

      // Use message queue to send the notification
      const messageData = await this.prepareSkillMatchNotificationData(matchToNotify)
      if (messageData) {
        this.messageQueue.addBulkMessages([messageData])

        // Record the notification in database
        await dbService.createUserNotification(matchToNotify.userId, matchToNotify.listingId, 'skill_match')

        console.log(`📤 Queued notification for ${matchToNotify.user.userName} for ${matchToNotify.listing.title}`)
        console.log(`⏰ Next notification will be sent in next cronjob run (${TIMING_CONFIG.ENVIRONMENT_DIFFERENCES.NOTIFICATION_FREQUENCY})`)
        console.log(`📊 Remaining unnotified: ${unnotifiedMatches.length - 1}`)
      }
    } catch (error) {
      console.error('❌ Error sending skill match notifications:', error)
    }
  }

  async sendSkillMatchNotification(match: any): Promise<boolean> {
    try {
      // Generate thumbnail for the listing
      const imageUrl = await generateListingThumbnail(match.listing)

      const sponsor = JSON.parse(match.listing.sponsor)
      const listingSkills = JSON.parse(match.listing.skills)
      const mappedSkills = JSON.parse(match.listing.mappedSkill)

      const skillsText = listingSkills.map((skill: any) => `${skill.skills} (${skill.subskills.join(', ')})`).join('; ')

      const messageOptions = {
        caption: `🎯 **Skill Match Found!**

**${match.listing.title}**
💰 Reward: $${match.listing.usdValue} ${match.listing.token}
🏢 Sponsor: ${sponsor.name}
⏰ Deadline: ${new Date(match.listing.deadline).toLocaleDateString()}
🛠 Skills: ${skillsText}
📊 Type: ${match.listing.type}

This listing matches your expertise: **${mappedSkills.join(', ')}**`,
        parse_mode: 'Markdown' as const,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Apply Now',
                url: `https://earn.superteam.fun/listing/${match.listing.slug}/?utm_source=telegrambot`,
              },
              {
                text: '🔕 Stop Notifications',
                callback_data: 'stop_notifications',
              },
            ],
          ],
        },
      }

      // Send notification via message queue (one by one)
      this.messageQueue.addBulkMessages([
        {
          userId: match.userId.toString(),
          telegramId: match.user.telegramId,
          messageData: {
            type: 'photo' as const,
            content: getImageUrl(imageUrl),
            options: messageOptions,
          },
          maxRetries: 3,
          scheduledAt: new Date(),
        },
      ])

      return true
    } catch (error) {
      console.error('❌ Error sending skill match notification:', error)
      return false
    }
  }

  async prepareSkillMatchNotificationData(match: any): Promise<any | null> {
    try {
      // Generate thumbnail for the listing
      const imageUrl = await generateListingThumbnail(match.listing)

      const sponsor = JSON.parse(match.listing.sponsor)
      const listingSkills = JSON.parse(match.listing.skills)
      const mappedSkills = JSON.parse(match.listing.mappedSkill)

      const skillsText = listingSkills.map((skill: any) => `${skill.skills} (${skill.subskills.join(', ')})`).join('; ')

      const messageOptions = {
        caption: `🎯 **Skill Match Found!**

**${match.listing.title}**
💰 Reward: $${match.listing.usdValue} ${match.listing.token}
🏢 Sponsor: ${sponsor.name}
⏰ Deadline: ${new Date(match.listing.deadline).toLocaleDateString()}
🛠 Skills: ${skillsText}
📊 Type: ${match.listing.type}

This listing matches your expertise: **${mappedSkills.join(', ')}**`,
        parse_mode: 'Markdown' as const,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Apply Now',
                url: `https://earn.superteam.fun/listing/${match.listing.slug}/?utm_source=telegrambot`,
              },
              {
                text: `🔔 Remind me every ${TIMING_CONFIG.REMINDERS.DEFAULT_INTERVAL_HOURS} hours`,
                callback_data: `remind_me_${match.listing.id}`,
              },
            ],
          ],
        },
      }

      // Return message data for queue
      return {
        userId: match.userId.toString(),
        telegramId: match.user.telegramId,
        messageData: {
          type: 'photo' as const,
          content: getImageUrl(imageUrl),
          options: messageOptions,
        },
        maxRetries: 3,
        scheduledAt: new Date(),
      }
    } catch (error) {
      console.error('❌ Error preparing skill match notification:', error)
      return null
    }
  }

  async processSkillMatchingCronjob() {
    try {
      console.log('🔄 Starting skill matching cronjob...')

      // Step 0: Clean up any duplicate matches from previous runs
      await dbService.removeDuplicateMatches()

      // Step 1: Match users with listings
      await this.matchUsersWithListings()

      // Step 2: Send notifications for matches (one by one to prevent duplicates)
      await this.sendSkillMatchNotifications()

      // Step 3: Send reminders (one by one to spread them out)
      await this.sendReminders()

      // Step 4: Log statistics
      const stats = await dbService.getMatchingStats()
      const reminderStats = await dbService.getReminderStats()
      console.log(
        `📊 Matching Stats: ${stats.totalMatches} total matches, ${stats.activeMatches} active, ${stats.notificationsSentToday} notifications today, ${stats.usersWithMatches} users with matches`,
      )
      console.log(
        `🔔 Reminder Stats: ${reminderStats.totalReminders} total, ${reminderStats.activeReminders} active, ${reminderStats.remindersReadyToSend} ready to send, ${reminderStats.usersWithReminders} users with reminders`,
      )
    } catch (error) {
      console.error('❌ Skill matching cronjob error:', error)
    }
  }

  // Reminder functionality
  async sendReminders() {
    try {
      console.log('🔔 Starting reminder process...')

      // Clean up expired reminders first
      await dbService.deactivateExpiredReminders()

      // Get reminders that are ready to be sent
      const readyReminders = await dbService.getRemindersReadyToSend()

      if (readyReminders.length === 0) {
        console.log('📭 No reminders ready to send')
        return
      }

      console.log(`🎯 Found ${readyReminders.length} reminders ready to send`)

      // ONLY send 1 reminder per cronjob run (to spread them out over time)
      const reminderToSend = readyReminders[0]

      console.log(`📤 Sending reminder 1/${readyReminders.length}`)

      // Use message queue to send the reminder
      const messageData = await this.prepareReminderMessageData(reminderToSend)
      if (messageData) {
        this.messageQueue.addBulkMessages([messageData])

        // Update the last reminded timestamp
        await dbService.updateReminderLastSent(reminderToSend.userId, reminderToSend.listingId)

        console.log(`📤 Queued reminder for ${reminderToSend.user.userName} for ${reminderToSend.listing.title}`)
        console.log(`⏰ Next reminder will be sent in next cronjob run (${TIMING_CONFIG.ENVIRONMENT_DIFFERENCES.NOTIFICATION_FREQUENCY})`)
        console.log(`📊 Remaining reminders: ${readyReminders.length - 1}`)
      }
    } catch (error) {
      console.error('❌ Error sending reminders:', error)
    }
  }

  async prepareReminderMessageData(reminder: any): Promise<any | null> {
    try {
      // Generate thumbnail for the listing
      const imageUrl = await generateListingThumbnail(reminder.listing)

      const sponsor = JSON.parse(reminder.listing.sponsor)
      const listingSkills = JSON.parse(reminder.listing.skills)
      const mappedSkills = reminder.listing.mappedSkill ? JSON.parse(reminder.listing.mappedSkill) : []

      const skillsText = listingSkills.map((skill: any) => `${skill.skills} (${skill.subskills.join(', ')})`).join('; ')

      // Calculate time until deadline
      const deadline = new Date(reminder.listing.deadline)
      const now = new Date()
      const timeUntilDeadline = deadline.getTime() - now.getTime()
      const daysUntilDeadline = Math.ceil(timeUntilDeadline / (1000 * 60 * 60 * 24))

      const deadlineText = daysUntilDeadline > 0 ? `⏰ ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''} left` : '🚨 Deadline soon!'

      const messageOptions = {
        caption: `🔔 **Reminder: Don't miss this opportunity!**

**${reminder.listing.title}**
💰 Reward: $${reminder.listing.usdValue} ${reminder.listing.token}
🏢 Sponsor: ${sponsor.name}
${deadlineText}
🛠 Skills: ${skillsText}
📊 Type: ${reminder.listing.type}${mappedSkills.length > 0 ? `\n\n📌 Matches your expertise: **${mappedSkills.join(', ')}**` : ''}`,
        parse_mode: 'Markdown' as const,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Apply Now',
                url: `https://earn.superteam.fun/listing/${reminder.listing.slug}/?utm_source=telegrambot`,
              },
              {
                text: '🔕 Stop Reminders',
                callback_data: `stop_reminder_${reminder.listing.id}`,
              },
            ],
          ],
        },
      }

      // Return message data for queue
      return {
        userId: reminder.userId.toString(),
        telegramId: reminder.user.telegramId,
        messageData: {
          type: 'photo' as const,
          content: getImageUrl(imageUrl),
          options: messageOptions,
        },
        maxRetries: 3,
        scheduledAt: new Date(),
      }
    } catch (error) {
      console.error('❌ Error preparing reminder message:', error)
      return null
    }
  }

  // Keep the existing test message functionality
  async sendTestMessageToAllUsers() {
    try {
      console.log('🔄 Starting cronjob: sending test message to all users...')

      // Get all users from database
      const users = await dbService.getAllUsers()

      if (users.length === 0) {
        console.log('📭 No users found in database')
        return
      }

      console.log(`📨 Found ${users.length} users, adding to message queue...`)

      // Generate thumbnail for the test message - create a mock listing object
      const mockListing = {
        id: 'test-aimpact-beta-challenge', // Add mock ID for testing
        title: 'Build your App with AI on Solana: AImpact Beta Challenge',
        slug: 'aimpact-beta-challenge',
        deadline: '17 JUN 2025 00:00 UTC',
        usdValue: 2000,
        token: 'USDC',
        type: 'bounty',
        sponsor: JSON.stringify({
          name: 'Kumeka Team',
          isVerified: true,
        }),
      }
      const imageUrl = await generateListingThumbnail(mockListing)

      // Prepare message data
      const messageOptions = {
        caption: `**Kumeka Team** is sponsoring this listing!

Build no-code Solana apps with AImpact for a chance to win up to $2000 USDC and shape the future of AI-powered development.`,
        parse_mode: 'Markdown' as const,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Remind me every ${TIMING_CONFIG.REMINDERS.TEST_MESSAGE_INTERVAL_HOURS} hours`,
                callback_data: `remind_me_${mockListing.id}`,
              },
              {
                text: 'Join',
                url: 'https://earn.superteam.fun/listing/aimpact-beta-challenge/?utm_source=telegrambot',
              },
            ],
          ],
        },
      }

      // Add all messages to the queue
      const queuedMessages = users.map((user) => ({
        userId: user.id.toString(),
        telegramId: user.telegramId,
        messageData: {
          type: 'photo' as const,
          content: getImageUrl(imageUrl),
          options: messageOptions,
        },
        maxRetries: 3,
        scheduledAt: new Date(), // Send immediately
      }))

      this.messageQueue.addBulkMessages(queuedMessages)

      const queueStatus = this.messageQueue.getQueueStatus()
      console.log(`✅ Added ${users.length} messages to queue. Queue size: ${queueStatus.queueSize}`)
    } catch (error) {
      console.error('❌ Cronjob error:', error)
    }
  }
}
