import { USD_RANGES } from '@/constants'
import type { OnboardingContext } from '@/onboarding/types'
import {
  proceedToNextOnboardingStep,
  removeExpertiseIfNoSkills,
  updateExpertiseMessage,
  updateListingMessage,
  updateSkillBasedOnExpertise,
  updateSkillsMessage,
} from '@/onboarding/utils/helpers'
import { dbService } from '@/database/services'
import expertiseCommand from '@/onboarding/commands/expertise'
import skillsCommand from '@/onboarding/commands/skills'
import listingCommand from '@/onboarding/commands/listing'
import rangeCommand from '@/onboarding/commands/range'
import { getImageUrl } from '@/lib/url'

export async function handleCallbackQuery(ctx: OnboardingContext) {
  if (!ctx.callbackQuery?.data) {
    return
  }

  const data = ctx.callbackQuery.data

  if (!ctx.session.selectedExpertise) {
    ctx.session.selectedExpertise = []
  }

  if (!ctx.session.selectedSkills) {
    ctx.session.selectedSkills = []
  }

  if (!ctx.session.selectedListings) {
    ctx.session.selectedListings = []
  }

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
  }

  await ctx.answerCallbackQuery()
}

async function handleListingToggle(ctx: OnboardingContext, data: string) {
  const listing = data.replace('toggle_listing_', '')
  const listingName = listing === 'bounties' ? 'Bounties' : 'Projects'

  if (ctx.session.selectedListings!.includes(listingName)) {
    ctx.session.selectedListings = ctx.session.selectedListings!.filter((l) => l !== listingName)
  } else {
    ctx.session.selectedListings!.push(listingName)
  }

  // Update the message
  await updateListingMessage(ctx)
}

async function handleSkillToggle(ctx: OnboardingContext, data: string) {
  const skill = data.replace('toggle_skill_', '')

  if (ctx.session.selectedSkills!.includes(skill)) {
    ctx.session.selectedSkills = ctx.session.selectedSkills!.filter((s) => s !== skill)
  } else {
    ctx.session.selectedSkills!.push(skill)
  }

  await updateSkillsMessage(ctx)
}

async function handleExpertiseToggle(ctx: OnboardingContext, data: string) {
  const expertise = data.replace('toggle_', '')

  if (ctx.session.selectedExpertise!.includes(expertise)) {
    // Remove from selected expertise
    ctx.session.selectedExpertise = ctx.session.selectedExpertise!.filter((e) => e !== expertise)
  } else {
    // Add to selected expertise
    ctx.session.selectedExpertise!.push(expertise)
  }

  // Update skills based on current expertise selection (both add and remove cases)
  updateSkillBasedOnExpertise(ctx, expertise)

  // Update the message
  await updateExpertiseMessage(ctx)
}

async function handleExpertiseDone(ctx: OnboardingContext) {
  const selectedExpertiseText =
    ctx.session.selectedExpertise!.length > 0
      ? `Great! You've selected these expertise: ${ctx.session.selectedExpertise!.join(', ')}
      you can tell me more about your specific skills later using /skills command`
      : 'No expertise selected.'

  // Save expertise to database
  const telegramId = ctx.from?.id.toString()
  if (telegramId) {
    await dbService.setUserExpertise(telegramId, ctx.session.selectedExpertise || [])
    // Also save the auto-selected skills to database
    await dbService.setUserSkills(telegramId, ctx.session.selectedSkills || [])
  }

  try {
    await ctx.editMessageCaption({ reply_markup: { inline_keyboard: [] } })
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/expertise-response-001.png'), {
      caption: `Nice! You've selected these expertise: ${ctx.session.selectedExpertise!.join(', ')}`,
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
      caption: `Nice! You've selected these expertise: ${ctx.session.selectedExpertise!.join(', ')}`,
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

async function handleSkillsDone(ctx: OnboardingContext) {
  // Clean up expertise that have no selected skills
  removeExpertiseIfNoSkills(ctx)

  const selectedSkillsText =
    ctx.session.selectedSkills!.length > 0 ? `Great! You've selected these skills: ${ctx.session.selectedSkills!.join(', ')}` : 'No skills selected.'

  // Save skills to database
  const telegramId = ctx.from?.id.toString()
  if (telegramId) {
    await dbService.setUserSkills(telegramId, ctx.session.selectedSkills || [])
  }

  try {
    // await ctx.editMessageCaption({
    //   caption: selectedSkillsText,
    //   reply_markup: { inline_keyboard: [] },
    // })
    await ctx.replyWithPhoto('https://bob-intern-cdn.vercel.app/skills.png', {
      caption: `Great! You've selected these skills: ${ctx.session.selectedSkills!.join(', ')}`,
      reply_markup: {
        inline_keyboard: [],
      },
    })
  } catch (error) {
    // Fallback to editing text if caption fails
    // await ctx.editMessageText(selectedSkillsText, {
    //   reply_markup: { inline_keyboard: [] },
    // })
    await ctx.replyWithPhoto('https://bob-intern-cdn.vercel.app/skills.png', {
      caption: `Great! You've selected these skills: ${ctx.session.selectedSkills!.join(', ')}`,
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

async function handleListingDone(ctx: OnboardingContext) {
  console.log('handleListingDone', ctx.session.selectedListings)
  const selectedListingsText =
    ctx.session.selectedListings!.length > 0 ? `Great! You prefer: ${ctx.session.selectedListings!.join(', ')}` : 'No preference selected.'

  // Save listings to database
  const telegramId = ctx.from?.id.toString()
  if (telegramId) {
    await dbService.setUserListings(telegramId, ctx.session.selectedListings || [])
  }

  try {
    await ctx.editMessageCaption({ reply_markup: { inline_keyboard: [] } })
    await ctx.replyWithPhoto('https://bob-intern-cdn.vercel.app/listing.png', {
      caption: `Great! You prefer: ${ctx.session.selectedListings!.join(', ')}`,
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
      caption: `Great! You prefer: ${ctx.session.selectedListings!.join(', ')}`,
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

async function handleRangeSelection(ctx: OnboardingContext, data: string) {
  const rangeIndex = parseInt(data.replace('select_range_', ''))
  const selectedRange = USD_RANGES[rangeIndex]

  if (selectedRange) {
    ctx.session.selectedRange = selectedRange.value

    // Save price range to database
    const telegramId = ctx.from?.id.toString()
    if (telegramId) {
      await dbService.setUserPriceRange(telegramId, {
        minAmount: selectedRange.value.min,
        maxAmount: selectedRange.value.max,
        rangeLabel: selectedRange.label,
      })
    }

    const selectedRangeText = `Perfect! You've selected "${selectedRange.label}" with a range of $${selectedRange.value.min} - $${selectedRange.value.max}`

    try {
      // await ctx.editMessageCaption({
      //   caption: selectedRangeText,
      //   reply_markup: { inline_keyboard: [] },
      // })
      await ctx.replyWithPhoto('https://bob-intern-cdn.vercel.app/range.png', {
        caption: `Perfect! You've selected "${selectedRange.label}" with a range of $${selectedRange.value.min} - $${selectedRange.value.max}`,
        reply_markup: {
          inline_keyboard: [],
        },
      })
    } catch (error) {
      // Fallback to editing text if caption fails
      // await ctx.editMessageText(selectedRangeText, {
      //   reply_markup: { inline_keyboard: [] },
      // })
      await ctx.replyWithPhoto('https://bob-intern-cdn.vercel.app/range.png', {
        caption: `Perfect! You've selected "${selectedRange.label}" with a range of $${selectedRange.value.min} - $${selectedRange.value.max}`,
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
}

async function handleProfileUpdate(ctx: OnboardingContext, data: string) {
  const updateType = data.replace('update_', '')

  switch (updateType) {
    case 'expertise':
      await expertiseCommand(ctx as any)
      break
    case 'skills':
      await skillsCommand(ctx as any)
      break
    case 'listings':
      await listingCommand(ctx as any)
      break
    case 'range':
      await rangeCommand(ctx as any)
      break
    default:
      await ctx.reply('❌ Unknown update type')
  }
}
