import type { OnboardingContext } from '@/onboarding/types'
import { handleNameInput } from '@/onboarding/utils/helpers'

export async function handleTextMessage(ctx: OnboardingContext) {
  if (ctx.session.waitingForName && ctx.message?.text) {
    await handleNameInput(ctx, ctx.message.text)
    return
  }
}
