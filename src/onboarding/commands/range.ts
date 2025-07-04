import { CommandContext } from 'grammy'
import type { OnboardingContext } from '@/onboarding/types'
import { getMissingOnboardingSteps, startOnboardingFlow, showUSDRangeSelection, checkPrerequisites } from '@/onboarding/utils/helpers'

export default async function range(ctx: CommandContext<OnboardingContext>) {
  // Check if prerequisites are missing
  const missingPrerequisites = checkPrerequisites(ctx, 'range')

  if (missingPrerequisites.length > 0) {
    await ctx.reply(`You need to complete these steps first: ${missingPrerequisites.join(', ')}. Starting onboarding flow...`)
    await startOnboardingFlow(ctx)
    return
  }

  const missing = getMissingOnboardingSteps(ctx)

  // If multiple steps are missing, start onboarding flow from range
  if (missing.length > 1 && missing.includes('range')) {
    await startOnboardingFlow(ctx, 'range')
  } else {
    // Just show range selection (individual command mode)
    ctx.session.isOnboarding = false
    await showUSDRangeSelection(ctx)
  }
}
