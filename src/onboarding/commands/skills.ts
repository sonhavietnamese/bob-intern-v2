import { SKILLS } from '@/constants'
import type { OnboardingContext } from '@/onboarding/types'
import { checkPrerequisites, startOnboardingFlow } from '@/onboarding/utils/helpers'
import { CommandContext } from 'grammy'

export default async function skills(ctx: CommandContext<OnboardingContext>) {
  // Check if prerequisites are missing (name and expertise are required for skills)
  const missingPrerequisites = checkPrerequisites(ctx, 'expertise') // Skills require expertise

  if (missingPrerequisites.length > 0) {
    await ctx.reply(`You need to complete these steps first: ${missingPrerequisites.join(', ')}. Starting onboarding flow...`)
    await startOnboardingFlow(ctx)
    return
  }

  // Initialize selectedSkills if it doesn't exist
  if (!ctx.session.selectedSkills) {
    ctx.session.selectedSkills = []
  }

  // Check if user has selected expertise
  if (!ctx.session.selectedExpertise || ctx.session.selectedExpertise.length === 0) {
    await ctx.reply('Please select your expertise first using /expertise command before choosing specific skills.')
    return
  }

  // Set to individual command mode
  ctx.session.isOnboarding = false

  // Get all skills from selected expertise areas
  const allAvailableSkills: string[] = []
  ctx.session.selectedExpertise.forEach((expertise) => {
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
      const isSelected = ctx.session.selectedSkills!.includes(skill)
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
