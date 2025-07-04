import { getImageUrl } from '@/lib/url'
import type { DatabaseContext } from '@/onboarding/types'
import { CommandContext } from 'grammy'
import { getMissingOnboardingSteps } from '@/onboarding/utils/helpers'

export default async function databaseStart(ctx: CommandContext<DatabaseContext>) {
  // Check if user already exists in database
  if (ctx.userData.user) {
    // User exists, check if they have completed their profile
    const missingSteps = getMissingOnboardingSteps(ctx)

    if (missingSteps.length === 0) {
      // User has completed their profile, direct them to use /profile
      await ctx.reply(
        `Hello ${ctx.userData.user.userName}! 👋\n\n` +
          `You already have a complete profile with Bob. Use /profile to view or update your information.\n\n` +
          `📋 Your current preferences:\n` +
          `🎯 Expertise: ${ctx.userData.expertise?.join(', ') || 'None'}\n` +
          `🛠️ Skills: ${ctx.userData.skills?.join(', ') || 'None'}\n` +
          `📈 Interested in: ${ctx.userData.listings?.join(', ') || 'None'}\n` +
          `💰 Price Range: ${ctx.userData.priceRange?.rangeLabel || 'Not set'}`,
      )
      return
    } else {
      // User exists but hasn't completed profile, let them continue with onboarding
      await ctx.reply(
        `Welcome back ${ctx.userData.user.userName}! 👋\n\n` +
          `I see you started but didn't complete your profile setup. Let's continue where you left off!`,
      )
    }
  }

  // For new users or users with incomplete profiles, proceed with normal onboarding
  await ctx.replyWithPhoto(getImageUrl('/thumbnails/bob-intro.png'), {
    caption: `GM! I am Bob, freshly Superteam Earn Buddy who will ping you every earnning opportunity. 

Sir, What would you like me to call you?`,
  })

  ctx.session.waitingForName = true
  ctx.session.isOnboarding = true
}
