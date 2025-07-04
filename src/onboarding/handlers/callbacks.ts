import { USD_RANGES } from '@/constants'
import type { DatabaseContext } from '@/onboarding/types'
import {
  proceedToNextOnboardingStep,
  updateExpertiseMessage,
  updateListingMessage,
  updateSkillBasedOnExpertise,
  updateSkillsMessage,
  showExpertiseSelection,
  showSkillsSelection,
  showListingSelection,
  showUSDRangeSelection,
} from '@/onboarding/utils/helpers'
import { getImageUrl } from '@/lib/url'
import { dbService } from '@/database/services'
import { TIMING_CONFIG } from '@/config'

export async function handleDatabaseCallbackQuery(ctx: DatabaseContext) {
  if (!ctx.callbackQuery?.data) {
    return
  }

  const data = ctx.callbackQuery.data

  if (data.startsWith('toggle_listing_')) {
    await handleListingToggle(ctx, data)
  } else if (data.startsWith('toggle_skill_')) {
    await handleSkillToggle(ctx, data)
  } else if (data.startsWith('toggle_')) {
    await handleExpertiseToggle(ctx, data)
  } else if (data === 'expertise_done') {
    await handleExpertiseDone(ctx)
  } else if (data === 'skills_done') {
    await handleSkillsDone(ctx)
  } else if (data === 'listing_done') {
    await handleListingDone(ctx)
  } else if (data.startsWith('select_range_')) {
    await handleRangeSelection(ctx, data)
  } else if (data.startsWith('update_')) {
    await handleProfileUpdate(ctx, data)
  } else if (data.startsWith('remind_me_')) {
    await handleRemindMe(ctx, data)
  } else if (data.startsWith('stop_reminder_')) {
    await handleStopReminder(ctx, data)
  }

  await ctx.answerCallbackQuery()
}

async function handleListingToggle(ctx: DatabaseContext, data: string) {
  const listing = data.replace('toggle_listing_', '')
  const listingName = listing === 'bounties' ? 'Bounties' : 'Projects'

  const currentListings = ctx.userData.listings || []
  let newListings: string[]

  if (currentListings.includes(listingName)) {
    newListings = currentListings.filter((l) => l !== listingName)
  } else {
    newListings = [...currentListings, listingName]
  }

  // Update database
  await ctx.updateUserData({ listings: newListings })

  // Update the message
  await updateListingMessage(ctx)
}

async function handleSkillToggle(ctx: DatabaseContext, data: string) {
  const skill = data.replace('toggle_skill_', '')

  const currentSkills = ctx.userData.skills || []
  let newSkills: string[]

  if (currentSkills.includes(skill)) {
    newSkills = currentSkills.filter((s) => s !== skill)
  } else {
    newSkills = [...currentSkills, skill]
  }

  // Update database
  await ctx.updateUserData({ skills: newSkills })

  // Update the message
  await updateSkillsMessage(ctx)
}

async function handleExpertiseToggle(ctx: DatabaseContext, data: string) {
  const expertise = data.replace('toggle_', '')

  const currentExpertise = ctx.userData.expertise || []
  let newExpertise: string[]

  if (currentExpertise.includes(expertise)) {
    // Remove from selected expertise
    newExpertise = currentExpertise.filter((e) => e !== expertise)
  } else {
    // Add to selected expertise
    newExpertise = [...currentExpertise, expertise]
  }

  // Update database
  await ctx.updateUserData({ expertise: newExpertise })

  // Update skills based on current expertise selection
  await updateSkillBasedOnExpertise(ctx, expertise)

  // Update the message
  await updateExpertiseMessage(ctx)
}

async function handleExpertiseDone(ctx: DatabaseContext) {
  const userExpertise = ctx.userData.expertise || []
  const selectedExpertiseText =
    userExpertise.length > 0 ? `Great! You've selected these expertise: ${userExpertise.join(', ')}` : 'No expertise selected.'

  try {
    await ctx.editMessageCaption({ reply_markup: { inline_keyboard: [] } })
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/expertise-response-001.png'), {
      caption: `Nice! You've selected these expertise: ${userExpertise.join(', ')}`,
      reply_markup: {
        inline_keyboard: [],
      },
    })
  } catch (error) {
    // Fallback to editing text if caption fails
    await ctx.editMessageText(selectedExpertiseText, {
      reply_markup: { inline_keyboard: [] },
    })
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/expertise-response-001.png'), {
      caption: `Nice! You've selected these expertise: ${userExpertise.join(', ')}`,
      reply_markup: {
        inline_keyboard: [],
      },
    })
  }

  // If in onboarding flow, proceed to next step; otherwise just finish
  if (ctx.session.isOnboarding) {
    await proceedToNextOnboardingStep(ctx)
  }
}

async function handleSkillsDone(ctx: DatabaseContext) {
  const userSkills = ctx.userData.skills || []
  const selectedSkillsText = userSkills.length > 0 ? `Great! You've selected these skills: ${userSkills.join(', ')}` : 'No skills selected.'

  try {
    await ctx.editMessageCaption({ reply_markup: { inline_keyboard: [] } })
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/expertise-response-001.png'), {
      caption: `Nice! You've selected these skills: ${userSkills.join(', ')}`,
      reply_markup: {
        inline_keyboard: [],
      },
    })
  } catch (error) {
    // Fallback to editing text if caption fails
    await ctx.editMessageText(selectedSkillsText, {
      reply_markup: { inline_keyboard: [] },
    })
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/expertise-response-001.png'), {
      caption: `Nice! You've selected these skills: ${userSkills.join(', ')}`,
      reply_markup: {
        inline_keyboard: [],
      },
    })
  }

  // If in onboarding flow, proceed to next step; otherwise just finish
  if (ctx.session.isOnboarding) {
    await proceedToNextOnboardingStep(ctx)
  }
}

async function handleListingDone(ctx: DatabaseContext) {
  const userListings = ctx.userData.listings || []
  const selectedListingsText = userListings.length > 0 ? `Great! You prefer: ${userListings.join(', ')}` : 'No preference selected.'

  try {
    await ctx.editMessageCaption({ reply_markup: { inline_keyboard: [] } })
    await ctx.replyWithPhoto('https://bob-intern-cdn.vercel.app/listing.png', {
      caption: `Great! You prefer: ${userListings.join(', ')}`,
      reply_markup: {
        inline_keyboard: [],
      },
    })
  } catch (error) {
    // Fallback to editing text if caption fails
    await ctx.editMessageText(selectedListingsText, {
      reply_markup: { inline_keyboard: [] },
    })
    await ctx.replyWithPhoto('https://bob-intern-cdn.vercel.app/listing.png', {
      caption: `Great! You prefer: ${userListings.join(', ')}`,
      reply_markup: {
        inline_keyboard: [],
      },
    })
  }

  // If in onboarding flow, proceed to next step; otherwise just finish
  if (ctx.session.isOnboarding) {
    await proceedToNextOnboardingStep(ctx)
  }
}

async function handleRangeSelection(ctx: DatabaseContext, data: string) {
  const parts = data.replace('select_range_', '').split('_')

  if (parts.length < 2 || !parts[0] || !parts[1]) {
    await ctx.reply('Invalid range selection format')
    return
  }

  const minAmount = parseInt(parts[0], 10)
  const maxAmount = parseInt(parts[1], 10)

  // Find the range object
  const range = USD_RANGES.find((r) => r.value.min === minAmount && r.value.max === maxAmount)

  if (!range) {
    await ctx.reply('Invalid range selection')
    return
  }

  const priceRange = {
    minAmount,
    maxAmount,
    rangeLabel: range.label,
  }

  // Update database
  await ctx.updateUserData({ priceRange })

  try {
    await ctx.editMessageCaption({ reply_markup: { inline_keyboard: [] } })
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/range.png'), {
      caption: `Perfect! You've selected ${range.label} ($${minAmount} - $${maxAmount})`,
      reply_markup: {
        inline_keyboard: [],
      },
    })
  } catch (error) {
    // Fallback to editing text if caption fails
    await ctx.editMessageText(`Perfect! You've selected ${range.label} ($${minAmount} - $${maxAmount})`, {
      reply_markup: { inline_keyboard: [] },
    })
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/range.png'), {
      caption: `Perfect! You've selected ${range.label} ($${minAmount} - $${maxAmount})`,
      reply_markup: {
        inline_keyboard: [],
      },
    })
  }

  // If in onboarding flow, proceed to next step; otherwise just finish
  if (ctx.session.isOnboarding) {
    await proceedToNextOnboardingStep(ctx)
  }
}

async function handleProfileUpdate(ctx: DatabaseContext, data: string) {
  const updateType = data.replace('update_', '')

  // Ensure we're not in onboarding mode for profile updates
  ctx.session.isOnboarding = false

  // Handle profile updates based on the type
  switch (updateType) {
    case 'expertise':
      await showExpertiseSelection(ctx)
      break
    case 'skills':
      // Check if user has expertise selected before allowing skills update
      if (!ctx.userData.expertise || ctx.userData.expertise.length === 0) {
        await ctx.reply('Please select your expertise first before updating skills.')
        return
      }
      await showSkillsSelection(ctx)
      break
    case 'listings':
      await showListingSelection(ctx)
      break
    case 'range':
      await showUSDRangeSelection(ctx)
      break
    default:
      await ctx.reply('Unknown update type')
  }
}

async function handleRemindMe(ctx: DatabaseContext, data: string) {
  try {
    // Extract listing ID from callback data (format: remind_me_LISTING_ID)
    const listingId = data.replace('remind_me_', '')

    if (!listingId) {
      await ctx.reply('❌ Invalid reminder request')
      return
    }

    // Ensure user exists in database
    const user = ctx.userData.user
    if (!user) {
      await ctx.reply('❌ User not found. Please start the bot first with /start')
      return
    }

    // Check if listing exists in database
    const listing = await dbService.getListingById(listingId)
    if (!listing) {
      await ctx.reply('❌ Listing not found or may have been removed')
      return
    }

    // Check if listing is still active and not past deadline
    const now = new Date()
    if (!listing.isActive || listing.deadline < now) {
      await ctx.reply('❌ This listing is no longer active or has passed its deadline')
      return
    }

    // Check if reminder already exists
    const reminderExists = await dbService.checkUserReminderExists(user.id, listingId)
    if (reminderExists) {
      await ctx.reply('✅ You already have a reminder set for this listing!')
      return
    }

    // Create reminder with default interval from configuration
    const reminder = await dbService.createUserReminder(user.id, listingId, TIMING_CONFIG.REMINDERS.DEFAULT_INTERVAL_HOURS)

    if (reminder) {
      await ctx.reply(
        `🔔 Reminder set! I'll remind you about "${listing.title}" every ${TIMING_CONFIG.REMINDERS.DEFAULT_INTERVAL_HOURS} hours until the deadline.`,
      )
      console.log(`📝 Reminder created: ${user.userName} for listing ${listing.title}`)
    } else {
      await ctx.reply('❌ Failed to create reminder. Please try again later.')
    }
  } catch (error) {
    console.error('Error handling remind me callback:', error)
    await ctx.reply('❌ An error occurred while setting up your reminder. Please try again later.')
  }
}

async function handleStopReminder(ctx: DatabaseContext, data: string) {
  try {
    // Extract listing ID from callback data (format: stop_reminder_LISTING_ID)
    const listingId = data.replace('stop_reminder_', '')

    if (!listingId) {
      await ctx.reply('❌ Invalid reminder stop request')
      return
    }

    // Ensure user exists in database
    const user = ctx.userData.user
    if (!user) {
      await ctx.reply('❌ User not found. Please start the bot first with /start')
      return
    }

    // Check if listing exists in database
    const listing = await dbService.getListingById(listingId)
    if (!listing) {
      await ctx.reply('❌ Listing not found or may have been removed')
      return
    }

    // Check if reminder exists
    const reminderExists = await dbService.checkUserReminderExists(user.id, listingId)
    if (!reminderExists) {
      await ctx.reply('✅ No reminder found for this listing')
      return
    }

    // Deactivate reminder
    const deactivated = await dbService.deactivateReminder(user.id, listingId)

    if (deactivated) {
      await ctx.reply('✅ Reminder deactivated successfully')
      console.log(`📝 Reminder deactivated: ${user.userName} for listing ${listing.title}`)
    } else {
      await ctx.reply('❌ Failed to deactivate reminder. Please try again later.')
    }
  } catch (error) {
    console.error('Error handling stop reminder callback:', error)
    await ctx.reply('❌ An error occurred while stopping your reminder. Please try again later.')
  }
}
