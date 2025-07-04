import { getImageUrl } from '@/lib/url'
import type { OnboardingContext } from '@/onboarding/types'
import { CommandContext } from 'grammy'

export default async function start(ctx: CommandContext<OnboardingContext>) {
  await ctx.replyWithPhoto(getImageUrl('/thumbnails/bob-intro.png'), {
    caption: `GM! I am Bob, freshly Superteam Earn Buddy who will ping you every earnning opportunity. 

Sir, What would you like me to call you?`,
  })

  ctx.session.waitingForName = true
}
