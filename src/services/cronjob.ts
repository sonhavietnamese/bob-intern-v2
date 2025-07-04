import { Bot } from 'grammy'
import type { DatabaseContext } from '../onboarding/types'
import { dbService } from '../database/services'
import { generateListingThumbnail } from '../lib/utils'
import { getImageUrl } from '../lib/url'
import { createMessageQueue } from '../lib/message-queue'
import { SUPERTEAM_EARN_SKILL_MAPPING } from '../config'

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

        console.log(`  ${index + 1}. "${project.title}" by ${project.sponsor.name} - ${reward}`)
        console.log(`     Deadline: ${new Date(project.deadline).toLocaleDateString()}, Submissions: ${project._count.Submission}`)
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
    const batchSize = 10
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize)

      const batchPromises = batch.map((listing) => this.fetchListingDetails(listing.slug))
      const batchResults = await Promise.all(batchPromises)

      // Filter out null results and add to detailed listings
      const validResults = batchResults.filter((result): result is DetailedListingData => result !== null)
      detailedListings.push(...validResults)

      // Small delay between batches to be respectful to the API
      if (i + batchSize < listings.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
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
      console.log(`   ID: ${listing.id}`)
      console.log(`   Slug: ${listing.slug}`)
      console.log(`   Type: ${listing.type}`)
      console.log(`   Deadline: ${new Date(listing.deadline).toLocaleDateString()}`)
      console.log(`   Token: ${listing.token}`)
      console.log(`   USD Value: $${listing.usdValue}`)
      console.log(`   Compensation: ${listing.compensationType}`)
      console.log(`   Skills: ${skillsText || 'None specified'}`)
      console.log(`   Mapped Skills: ${mappedSkills.length > 0 ? mappedSkills.join(', ') : 'None mapped'}`)
      console.log(`   Sponsor: ${listing.sponsor.name} (${listing.sponsor.isVerified ? 'Verified' : 'Not verified'})`)
      console.log('   ' + '-'.repeat(50))
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

      // Generate thumbnail for the test message
      const imageUrl = await generateListingThumbnail('Build your App with AI on Solana: AImpact Beta Challenge')

      // Prepare message data
      const messageOptions = {
        caption: `**Kumeka Team** is sponsoring this listing!

Build no-code Solana apps with AImpact for a chance to win up to $2000 USDC and shape the future of AI-powered development.`,
        parse_mode: 'Markdown' as const,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Remind me every 12 hours',
                callback_data: 'remind_me',
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
