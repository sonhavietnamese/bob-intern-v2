import { CommandContext } from 'grammy'
import type { DatabaseContext } from '@/onboarding/types'
import { getMissingOnboardingSteps, startOnboardingFlow, checkPrerequisites } from '@/onboarding/utils/helpers'
import { SKILLS } from '@/constants'

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

async function showSkillsSelection(ctx: DatabaseContext) {
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
