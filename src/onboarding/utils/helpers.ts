import { EXPERTISE_GROUPS, SKILLS, USD_RANGES } from '@/constants'
import { getImageUrl } from '@/lib/url'
import type { OnboardingContext } from '@/onboarding/types'

// Helper function to update the skills message
export async function updateExpertiseMessage(ctx: OnboardingContext) {
  const inlineKeyboard = [
    ...Object.values(EXPERTISE_GROUPS).map((expertise) => {
      const isSelected = ctx.session.selectedExpertise!.includes(expertise)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: `${expertise}`, callback_data: `toggle_${expertise}` },
        {
          text: `${checkbox}`,
          callback_data: `toggle_${expertise}`,
        },
      ]
    }),
    [{ text: 'Done', callback_data: 'expertise_done' }],
  ]

  try {
    await ctx.editMessageCaption({
      caption: `I am an expert on Remind People to Earn, so some people call me Bob the Honkor.

How about you?`,
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    // If editing caption fails (might be a text message), try editing text instead
    try {
      await ctx.editMessageText(
        `I am an expert on Remind People to Earn, so some people call me Bob the Honkor.

How about you?`,
        {
          reply_markup: {
            inline_keyboard: inlineKeyboard,
          },
        },
      )
    } catch (editError) {
      console.error('Failed to update expertise message:', editError)
    }
  }
}

// Helper function to update the listing message
export async function updateListingMessage(ctx: OnboardingContext) {
  const listings = ['Bounties', 'Projects']

  const inlineKeyboard = [
    ...listings.map((listing) => {
      const isSelected = ctx.session.selectedListings!.includes(listing)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: `${listing}`, callback_data: `toggle_listing_${listing.toLowerCase()}` },
        { text: `${checkbox}`, callback_data: `toggle_listing_${listing.toLowerCase()}` },
      ]
    }),
    [{ text: 'Done', callback_data: 'listing_done' }],
  ]

  try {
    await ctx.editMessageCaption({
      caption: `Superteam Earn comes with Bounties and Projects,
- Bounties: A list of tasks that you can complete to earn rewards.
- Projects: Best fit if you are a freelance developer.

Which one do you prefer?`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    // If editing caption fails, try editing text instead
    try {
      await ctx.editMessageText(
        `Superteam Earn comes with Bounties and Projects,
- Bounties: A list of tasks that you can complete to earn rewards.
- Projects: Best fit if you are a freelance developer.

Which one do you prefer?`,
        {
          reply_markup: {
            inline_keyboard: inlineKeyboard,
          },
          parse_mode: 'Markdown',
        },
      )
    } catch (editError) {
      console.error('Failed to update listing message:', editError)
    }
  }
}

// Helper function to show USD range selection
export async function showUSDRangeSelection(ctx: OnboardingContext) {
  const inlineKeyboard = USD_RANGES.map((range, index) => [
    {
      text: `${range.label} ($${range.value.min.toLocaleString()} - $${range.value.max.toLocaleString()})`,
      callback_data: `select_range_${index}`,
    },
  ])

  const caption = `Choose your best title, I will filter and notify you when there's a listing that matches your range.`

  try {
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/range.png'), {
      caption,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    // Fallback to text message if image fails
    console.error('Failed to send USD range image:', error)
    await ctx.reply(caption, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  }
}

export function updateSkillBasedOnExpertise(ctx: OnboardingContext, expertise: string) {
  // Rebuild the entire skills list based on all selected expertise
  const allSkills: string[] = []

  ctx.session.selectedExpertise!.forEach((selectedExpertise) => {
    const skills = SKILLS[selectedExpertise as keyof typeof SKILLS]
    if (skills) {
      allSkills.push(...skills)
    }
  })

  // Remove duplicates and update the session
  ctx.session.selectedSkills = [...new Set(allSkills)]
}

// Helper function to update the skills message
export async function updateSkillsMessage(ctx: OnboardingContext) {
  // Get all skills from selected expertise areas
  const allAvailableSkills: string[] = []
  if (ctx.session.selectedExpertise) {
    ctx.session.selectedExpertise.forEach((expertise) => {
      const skillsForExpertise = SKILLS[expertise as keyof typeof SKILLS]
      if (skillsForExpertise) {
        allAvailableSkills.push(...skillsForExpertise)
      }
    })
  }

  // Remove duplicates
  const uniqueSkills = [...new Set(allAvailableSkills)]

  const inlineKeyboard = [
    ...uniqueSkills.map((skill) => {
      const isSelected = ctx.session.selectedSkills!.includes(skill)
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
      caption: `Select your specific skills`,
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    // If editing caption fails, try editing text instead
    try {
      await ctx.editMessageText(`Select your specific skills`, {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      })
    } catch (editError) {
      console.error('Failed to update skills message:', editError)
    }
  }
}

// Helper function to remove expertise if all its skills are unselected
export function removeExpertiseIfNoSkills(ctx: OnboardingContext) {
  // Check each expertise and remove if no skills from that expertise are selected
  const expertiseToRemove: string[] = []

  ctx.session.selectedExpertise!.forEach((expertise) => {
    const expertiseSkills = SKILLS[expertise as keyof typeof SKILLS]
    const hasSelectedSkills = expertiseSkills.some((skill) => ctx.session.selectedSkills!.includes(skill))

    if (!hasSelectedSkills) {
      expertiseToRemove.push(expertise)
    }
  })

  // Remove expertise that have no selected skills
  expertiseToRemove.forEach((expertise) => {
    ctx.session.selectedExpertise = ctx.session.selectedExpertise!.filter((e) => e !== expertise)
  })
}

// Helper function to show listing selection
export async function showListingSelection(ctx: OnboardingContext) {
  // Initialize selected listings if not exists
  if (!ctx.session.selectedListings) {
    ctx.session.selectedListings = []
  }

  const listings = ['Bounties', 'Projects']

  const inlineKeyboard = [
    ...listings.map((listing) => {
      const isSelected = ctx.session.selectedListings!.includes(listing)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: `${listing}`, callback_data: `toggle_listing_${listing.toLowerCase()}` },
        { text: `${checkbox}`, callback_data: `toggle_listing_${listing.toLowerCase()}` },
      ]
    }),
    [{ text: 'Done', callback_data: 'listing_done' }],
  ]

  try {
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/listing.png'), {
      caption: `Superteam Earn comes with Bounties and Projects,
- Bounties: A list of tasks that you can complete to earn rewards.
- Projects: Best fit if you are a freelance developer.

Which one do you prefer?`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    // Fallback to text message if image fails
    console.error('Failed to send listing image:', error)
    await ctx.reply(`Superteam Earn comes with Bounties and Projects, which you most prefer?`, {
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  }
}

// Helper function to check what onboarding steps are missing
export function getMissingOnboardingSteps(ctx: OnboardingContext): string[] {
  const missing: string[] = []

  if (!ctx.session.userName) {
    missing.push('name')
  }

  if (!ctx.session.selectedExpertise || ctx.session.selectedExpertise.length === 0) {
    missing.push('expertise')
  }

  if (!ctx.session.selectedListings || ctx.session.selectedListings.length === 0) {
    missing.push('listing')
  }

  if (!ctx.session.selectedRange) {
    missing.push('range')
  }

  return missing
}

// Helper function to check prerequisites for a specific step
export function checkPrerequisites(ctx: OnboardingContext, step: string): string[] {
  const allSteps = ['name', 'expertise', 'listing', 'range']
  const stepIndex = allSteps.indexOf(step)

  if (stepIndex === -1) return []

  const prerequisites = allSteps.slice(0, stepIndex)
  const missing = getMissingOnboardingSteps(ctx)

  return prerequisites.filter((prereq) => missing.includes(prereq))
}

// Helper function to start onboarding flow
export async function startOnboardingFlow(ctx: OnboardingContext, startFrom?: string) {
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
export async function proceedToNextOnboardingStep(ctx: OnboardingContext) {
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
async function proceedToStep(ctx: OnboardingContext, step: string) {
  switch (step) {
    case 'name':
      await askForName(ctx)
      break
    case 'expertise':
      await showExpertiseSelection(ctx)
      break
    case 'listing':
      await showListingSelection(ctx)
      break
    case 'range':
      await showUSDRangeSelection(ctx)
      break
  }
}

// Helper function to show expertise selection
export async function showExpertiseSelection(ctx: OnboardingContext) {
  // Initialize selected expertise if not exists
  if (!ctx.session.selectedExpertise) {
    ctx.session.selectedExpertise = []
  }

  // Initialize selected skills if not exists
  if (!ctx.session.selectedSkills) {
    ctx.session.selectedSkills = []
  }

  const inlineKeyboard = [
    ...Object.values(EXPERTISE_GROUPS).map((expertise) => {
      const isSelected = ctx.session.selectedExpertise!.includes(expertise)
      const checkbox = isSelected ? '✅' : '☐'
      return [
        { text: `${expertise}`, callback_data: `toggle_${expertise}` },
        {
          text: `${checkbox}`,
          callback_data: `toggle_${expertise}`,
        },
      ]
    }),
    [{ text: 'Done', callback_data: 'expertise_done' }],
  ]

  try {
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/expertise.png'), {
      caption: `I am an expert on Remind People to Earn, so some people call me Bob the Honkor.

How about you?`,
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    // Fallback to text message if image fails
    console.error('Failed to send expertise image:', error)
    await ctx.reply(
      `I am an expert on Remind People to Earn, so some people call me Bob the Honkor.

How about you?`,
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      },
    )
  }
}

// Helper function to ask for user's name
export async function askForName(ctx: OnboardingContext) {
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
export async function handleNameInput(ctx: OnboardingContext, name: string) {
  ctx.session.userName = name.trim()
  ctx.session.waitingForName = false

  await ctx.reply(`Nice to meet you, ${ctx.session.userName}! 👋`)

  // If in onboarding flow, proceed to next step
  if (ctx.session.isOnboarding) {
    await proceedToNextOnboardingStep(ctx)
  }
}
