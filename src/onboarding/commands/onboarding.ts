import { CommandContext } from 'grammy'
import type { OnboardingContext } from '@/onboarding/types'
import { startOnboardingFlow } from '@/onboarding/utils/helpers'

export default async function onboarding(ctx: CommandContext<OnboardingContext>) {
  await ctx.reply("Welcome to the onboarding process! Let's get you set up step by step.")
  await startOnboardingFlow(ctx)
}
