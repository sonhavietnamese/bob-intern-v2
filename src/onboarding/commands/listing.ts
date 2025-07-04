import { CommandContext } from 'grammy'
import type { OnboardingContext } from '@/onboarding/types'
import { getMissingOnboardingSteps, startOnboardingFlow, showListingSelection, checkPrerequisites } from '@/onboarding/utils/helpers'

export default async function listing(ctx: CommandContext<OnboardingContext>) {
  // Check if prerequisites are missing
  const missingPrerequisites = checkPrerequisites(ctx, 'listing')

  if (missingPrerequisites.length > 0) {
    await ctx.reply(`You need to complete these steps first: ${missingPrerequisites.join(', ')}. Starting onboarding flow...`)
    await startOnboardingFlow(ctx)
    return
  }

  const missing = getMissingOnboardingSteps(ctx)

  // If multiple steps are missing, start onboarding flow from listing
  if (missing.length > 1 && missing.includes('listing')) {
    await startOnboardingFlow(ctx, 'listing')
  } else {
    // Just show listing selection (individual command mode)
    ctx.session.isOnboarding = false
    await showListingSelection(ctx)
  }
}
