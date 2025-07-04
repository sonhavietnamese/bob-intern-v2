import { CommandContext } from 'grammy'
import type { DatabaseContext } from '@/onboarding/types'
import { getMissingOnboardingSteps, startOnboardingFlow, showSkillsSelection, checkPrerequisites } from '@/onboarding/utils/helpers'

export default async function databaseSkills(ctx: CommandContext<DatabaseContext>) {
  // Check if prerequisites are missing (name and expertise are required for skills)
  const missingPrerequisites = checkPrerequisites(ctx, 'skills')

  if (missingPrerequisites.length > 0) {
    await ctx.reply(`You need to complete these steps first: ${missingPrerequisites.join(', ')}. Starting onboarding flow...`)
    await startOnboardingFlow(ctx)
    return
  }

  // Check if user has selected expertise
  if (!ctx.userData.expertise || ctx.userData.expertise.length === 0) {
    await ctx.reply('Please select your expertise first using /expertise command before choosing specific skills.')
    return
  }

  const missing = getMissingOnboardingSteps(ctx)

  // If multiple steps are missing, start onboarding flow from skills
  if (missing.length > 1 && missing.includes('skills')) {
    await startOnboardingFlow(ctx, 'skills')
  } else {
    // Just show skills selection (individual command mode)
    ctx.session.isOnboarding = false
    await showSkillsSelection(ctx)
  }
}
