import { EXPERTISE_GROUPS, SKILLS, USD_RANGES } from '@/constants'
import { getImageUrl } from '@/lib/url'
import type { DatabaseContext } from '@/onboarding/types'
import { ensureUserExists } from '@/database/middleware'

/**
 * Database-backed helper functions that work with DatabaseContext
 * These replace the session-based helpers
 */

// Helper function to check what onboarding steps are missing based on database data
export function getMissingOnboardingSteps(ctx: DatabaseContext): string[] {
  const missing: string[] = []

  if (!ctx.userData.user || !ctx.userData.user.userName) {
    missing.push('name')
  }

  if (!ctx.userData.expertise || ctx.userData.expertise.length === 0) {
    missing.push('expertise')
  }

  if (!ctx.userData.skills || ctx.userData.skills.length === 0) {
    missing.push('skills')
  }

  if (!ctx.userData.listings || ctx.userData.listings.length === 0) {
    missing.push('listing')
  }

  if (!ctx.userData.priceRange) {
    missing.push('range')
  }

  return missing
}

// Helper function to start onboarding flow
export async function startOnboardingFlow(ctx: DatabaseContext, startFrom?: string) {
  ctx.session.isOnboarding = true
  const missing = getMissingOnboardingSteps(ctx)

  if (startFrom) {
    const startIndex = missing.indexOf(startFrom)
    if (startIndex !== -1 && missing[startIndex]) {
      await proceedToStep(ctx, missing[startIndex])
      return
    }
  }

  if (missing.length > 0 && missing[0]) {
    await proceedToStep(ctx, missing[0])
  } else {
    await ctx.reply('🎉 Great! Your onboarding is complete!')
    ctx.session.isOnboarding = false
  }
}

// Helper function to proceed to next onboarding step
export async function proceedToNextOnboardingStep(ctx: DatabaseContext) {
  if (!ctx.session.isOnboarding) return

  const missing = getMissingOnboardingSteps(ctx)

  if (missing.length > 0 && missing[0]) {
    await proceedToStep(ctx, missing[0])
  } else {
    await ctx.reply('🎉 Congratulations! Your onboarding is complete!')
    ctx.session.isOnboarding = false
  }
}

// Helper function to proceed to a specific step
async function proceedToStep(ctx: DatabaseContext, step: string) {
  switch (step) {
    case 'name':
      await askForName(ctx)
      break
    case 'expertise':
      await showExpertiseSelection(ctx)
      break
    case 'skills':
      await showSkillsSelection(ctx)
      break
    case 'listing':
      await showListingSelection(ctx)
      break
    case 'range':
      await showUSDRangeSelection(ctx)
      break
    default:
      await ctx.reply('Unknown step in onboarding flow')
  }
}

// Helper function to ask for user's name
export async function askForName(ctx: DatabaseContext) {
  ctx.session.waitingForName = true

  try {
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/bob-intro.png'), {
      caption: 'Welcome! I am Bob, your personal assistant. How can I call you?',
    })
  } catch (error) {
    // Fallback to text message if image fails
    console.error('Failed to send welcome image:', error)
    await ctx.reply('Welcome! I am Bob, your personal assistant. How can I call you?')
  }
}

// Helper function to handle name input
export async function handleNameInput(ctx: DatabaseContext, name: string) {
  const telegramId = ctx.from?.id?.toString()

  if (!telegramId) return

  // Ensure user exists in database
  await ensureUserExists(ctx)

  // Update user name in database
  await ctx.updateUserData({
    user: {
      ...ctx.userData.user!,
      userName: name.trim(),
    },
  })

  ctx.session.waitingForName = false

  await ctx.reply(`Nice to meet you, ${name.trim()}! 👋`)

  // If in onboarding flow, proceed to next step
  if (ctx.session.isOnboarding) {
    await proceedToNextOnboardingStep(ctx)
  }
}

// Helper function to show expertise selection
export async function showExpertiseSelection(ctx: DatabaseContext) {
  const allExpertise = Object.keys(EXPERTISE_GROUPS)
  const userExpertise = ctx.userData.expertise || []

  const inlineKeyboard = [
    ...allExpertise.map((expertise) => {
      const isSelected = userExpertise.includes(expertise)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: expertise, callback_data: `toggle_${expertise}` },
        { text: checkbox, callback_data: `toggle_${expertise}` },
      ]
    }),
    [{ text: 'Done', callback_data: 'expertise_done' }],
  ]

  await ctx.replyWithPhoto(getImageUrl('/thumbnails/expertise.png'), {
    caption: 'Select your expertise areas:',
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  })
}

// Helper function to show listing selection
export async function showListingSelection(ctx: DatabaseContext) {
  const listings = ['Bounties', 'Projects']
  const userListings = ctx.userData.listings || []

  const inlineKeyboard = [
    ...listings.map((listing) => {
      const isSelected = userListings.includes(listing)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: `${listing}`, callback_data: `toggle_listing_${listing.toLowerCase()}` },
        { text: `${checkbox}`, callback_data: `toggle_listing_${listing.toLowerCase()}` },
      ]
    }),
    [{ text: 'Done', callback_data: 'listing_done' }],
  ]

  const caption = `Superteam Earn comes with Bounties and Projects,
- *Bounties*: A list of tasks that you can complete to earn rewards.
- *Projects*: Best fit if you are a freelance developer.

Which one do you prefer?`

  await ctx.replyWithPhoto(getImageUrl('/thumbnails/listing.png'), {
    caption,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  })
}

// Helper function to show USD range selection
export async function showUSDRangeSelection(ctx: DatabaseContext) {
  const inlineKeyboard = USD_RANGES.map((range) => [
    {
      text: `${range.label} ($${range.value.min} - $${range.value.max})`,
      callback_data: `select_range_${range.value.min}_${range.value.max}`,
    },
  ])

  await ctx.replyWithPhoto(getImageUrl('/thumbnails/range.png'), {
    caption: 'Select your preferred USD range for bounties and projects:',
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  })
}

// Helper function to show skills selection
export async function showSkillsSelection(ctx: DatabaseContext) {
  const userExpertise = ctx.userData.expertise || []
  const userSkills = ctx.userData.skills || []

  // Get all skills from selected expertise areas
  const allAvailableSkills: string[] = []
  userExpertise.forEach((expertise) => {
    const skillsForExpertise = SKILLS[expertise as keyof typeof SKILLS]
    if (skillsForExpertise) {
      allAvailableSkills.push(...skillsForExpertise)
    }
  })

  // Remove duplicates
  const uniqueSkills = [...new Set(allAvailableSkills)]

  if (uniqueSkills.length === 0) {
    await ctx.reply('No skills available for your selected expertise areas.')
    return
  }

  const inlineKeyboard = [
    ...uniqueSkills.map((skill) => {
      const isSelected = userSkills.includes(skill)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: skill, callback_data: `toggle_skill_${skill}` },
        { text: checkbox, callback_data: `toggle_skill_${skill}` },
      ]
    }),
    [{ text: 'Done', callback_data: 'skills_done' }],
  ]

  await ctx.replyWithPhoto('https://bob-intern-cdn.vercel.app/skill.png', {
    caption: 'Select your specific skills',
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  })
}

// Helper function to update expertise message
export async function updateExpertiseMessage(ctx: DatabaseContext) {
  const allExpertise = Object.keys(EXPERTISE_GROUPS)
  const userExpertise = ctx.userData.expertise || []

  const inlineKeyboard = [
    ...allExpertise.map((expertise) => {
      const isSelected = userExpertise.includes(expertise)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: expertise, callback_data: `toggle_${expertise}` },
        { text: checkbox, callback_data: `toggle_${expertise}` },
      ]
    }),
    [{ text: 'Done', callback_data: 'expertise_done' }],
  ]

  try {
    await ctx.editMessageCaption({
      caption: 'Select your expertise areas:',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    console.error('Failed to update expertise message:', error)
  }
}

// Helper function to update listing message
export async function updateListingMessage(ctx: DatabaseContext) {
  const listings = ['Bounties', 'Projects']
  const userListings = ctx.userData.listings || []

  const inlineKeyboard = [
    ...listings.map((listing) => {
      const isSelected = userListings.includes(listing)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: `${listing}`, callback_data: `toggle_listing_${listing.toLowerCase()}` },
        { text: `${checkbox}`, callback_data: `toggle_listing_${listing.toLowerCase()}` },
      ]
    }),
    [{ text: 'Done', callback_data: 'listing_done' }],
  ]

  const caption = `Superteam Earn comes with Bounties and Projects,
- *Bounties*: A list of tasks that you can complete to earn rewards.
- *Projects*: Best fit if you are a freelance developer.

Which one do you prefer?`

  try {
    await ctx.editMessageCaption({
      caption,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    console.error('Failed to update listing message:', error)
  }
}

// Helper function to update skills message
export async function updateSkillsMessage(ctx: DatabaseContext) {
  const userExpertise = ctx.userData.expertise || []
  const userSkills = ctx.userData.skills || []

  // Get all skills from selected expertise areas
  const allAvailableSkills: string[] = []
  userExpertise.forEach((expertise) => {
    const skillsForExpertise = SKILLS[expertise as keyof typeof SKILLS]
    if (skillsForExpertise) {
      allAvailableSkills.push(...skillsForExpertise)
    }
  })

  const uniqueSkills = [...new Set(allAvailableSkills)]

  const inlineKeyboard = [
    ...uniqueSkills.map((skill) => {
      const isSelected = userSkills.includes(skill)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: skill, callback_data: `toggle_skill_${skill}` },
        { text: checkbox, callback_data: `toggle_skill_${skill}` },
      ]
    }),
    [{ text: 'Done', callback_data: 'skills_done' }],
  ]

  try {
    await ctx.editMessageCaption({
      caption: 'Select your specific skills:',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    console.error('Failed to update skills message:', error)
  }
}

// Helper function to update skills based on expertise selection
export async function updateSkillBasedOnExpertise(ctx: DatabaseContext, expertise: string) {
  const userExpertise = ctx.userData.expertise || []

  // Rebuild the entire skills list based on all selected expertise
  const allSkills: string[] = []

  userExpertise.forEach((selectedExpertise) => {
    const skills = SKILLS[selectedExpertise as keyof typeof SKILLS]
    if (skills) {
      allSkills.push(...skills)
    }
  })

  // Remove duplicates and update the database
  const uniqueSkills = [...new Set(allSkills)]
  await ctx.updateUserData({ skills: uniqueSkills })
}

// Helper function to check prerequisites for a command
export function checkPrerequisites(ctx: DatabaseContext, command: string): string[] {
  const missing: string[] = []

  switch (command) {
    case 'expertise':
      if (!ctx.userData.user || !ctx.userData.user.userName) {
        missing.push('name')
      }
      break
    case 'skills':
      if (!ctx.userData.user || !ctx.userData.user.userName) {
        missing.push('name')
      }
      if (!ctx.userData.expertise || ctx.userData.expertise.length === 0) {
        missing.push('expertise')
      }
      break
    case 'listing':
      if (!ctx.userData.user || !ctx.userData.user.userName) {
        missing.push('name')
      }
      if (!ctx.userData.expertise || ctx.userData.expertise.length === 0) {
        missing.push('expertise')
      }
      break
    case 'range':
      if (!ctx.userData.user || !ctx.userData.user.userName) {
        missing.push('name')
      }
      if (!ctx.userData.expertise || ctx.userData.expertise.length === 0) {
        missing.push('expertise')
      }
      if (!ctx.userData.listings || ctx.userData.listings.length === 0) {
        missing.push('listing')
      }
      break
  }

  return missing
}
