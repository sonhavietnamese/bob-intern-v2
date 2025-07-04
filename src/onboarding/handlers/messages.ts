import type { OnboardingContext } from '@/onboarding/types'
import expertise from '@/onboarding/commands/expertise'
import { generateNameCard } from '@/lib/utils'
import { getImageUrl } from '@/lib/url'
import { dbService } from '@/database/services'

export async function handleTextMessage(ctx: OnboardingContext) {
  if (ctx.session.waitingForName) {
    const userName = ctx.message?.text

    if (!userName) {
      return
    }

    const telegramId = ctx.message.from.id.toString()

    // Create or update user in database
    let user = await dbService.getUserByTelegramId(telegramId)

    if (!user) {
      // Create new user
      user = await dbService.createUser({
        telegramId,
        userName,
        firstName: ctx.message.from.first_name || '',
        lastName: ctx.message.from.last_name || '',
        username: ctx.message.from.username || '',
      })
    } else {
      // Update existing user
      user = await dbService.updateUser(telegramId, {
        userName,
        firstName: ctx.message.from.first_name || '',
        lastName: ctx.message.from.last_name || '',
        username: ctx.message.from.username || '',
      })
    }

    if (!user) {
      await ctx.reply('Sorry, there was an error saving your information. Please try again.')
      return
    }

    ctx.session.waitingForName = false
    ctx.session.userName = userName

    await ctx.reply('Awesome, I am creating your name card... Hold on!')

    await ctx.api.setMessageReaction(ctx.message.chat.id, ctx.message.message_id, [{ type: 'emoji', emoji: '🎉' }])
    const image = await generateNameCard(userName, telegramId)

    // Name card image is saved to file system and displayed directly

    await ctx.replyWithPhoto(getImageUrl(image), {
      caption: `Here's your builder gear, ${userName}!`,
    })

    // Continue to expertise selection using the existing command
    await expertise(ctx as any)
  }
}
