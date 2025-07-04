import type { DatabaseContext } from '@/onboarding/types'
import { handleNameInput, showExpertiseSelection } from '@/onboarding/utils/helpers'
import { generateNameCard } from '@/lib/utils'
import { getImageUrl } from '@/lib/url'
import { ensureUserExists } from '@/database/middleware'

export async function handleDatabaseTextMessage(ctx: DatabaseContext) {
  if (ctx.session.waitingForName) {
    const userName = ctx.message?.text

    if (!userName) {
      return
    }

    const telegramId = ctx.message.from.id.toString()

    // Ensure user exists in database
    await ensureUserExists(ctx)

    // Update user name in database
    await ctx.updateUserData({
      user: {
        ...ctx.userData.user!,
        userName: userName.trim(),
        firstName: ctx.message.from.first_name || '',
        lastName: ctx.message.from.last_name || '',
        username: ctx.message.from.username || '',
      },
    })

    ctx.session.waitingForName = false

    await ctx.reply('Awesome, I am creating your name card... Hold on!')

    await ctx.api.setMessageReaction(ctx.message.chat.id, ctx.message.message_id, [{ type: 'emoji', emoji: '🎉' }])
    const image = await generateNameCard(userName, telegramId)

    // Name card image is saved to file system and displayed directly
    await ctx.replyWithPhoto(getImageUrl(image), {
      caption: `Here's your builder gear, ${userName}!`,
    })

    // Continue to next step if in onboarding flow
    if (ctx.session.isOnboarding) {
      // Show expertise selection directly
      await showExpertiseSelection(ctx)
    }
  }
}
