import { CommandContext } from 'grammy'
import type { OnboardingContext } from '@/onboarding/types'
import { getMissingOnboardingSteps, startOnboardingFlow, showExpertiseSelection, checkPrerequisites } from '@/onboarding/utils/helpers'

export default async function expertise(ctx: CommandContext<OnboardingContext>) {
  // Check if prerequisites are missing
  const missingPrerequisites = checkPrerequisites(ctx, 'expertise')

  if (missingPrerequisites.length > 0) {
    await ctx.reply(`You need to complete these steps first: ${missingPrerequisites.join(', ')}. Starting onboarding flow...`)
    await startOnboardingFlow(ctx)
    return
  }

  const missing = getMissingOnboardingSteps(ctx)

  // If multiple steps are missing, start onboarding flow from expertise
  if (missing.length > 1 && missing.includes('expertise')) {
    await startOnboardingFlow(ctx, 'expertise')
  } else {
    // Just show expertise selection (individual command mode)
    ctx.session.isOnboarding = false
    await showExpertiseSelection(ctx)
  }
}
