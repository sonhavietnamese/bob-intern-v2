import { CommandContext } from 'grammy'
import type { DatabaseContext } from '@/onboarding/types'
import { getImageUrl } from '@/lib/url'

export default async function databaseProfile(ctx: CommandContext<DatabaseContext>) {
  // Reload user data to get the latest information
  await ctx.reloadUserData()

  const { user, expertise, skills, listings, priceRange } = ctx.userData

  if (!user) {
    await ctx.reply('You need to start the bot first. Use /start to begin!')
    return
  }

  let profileText = `👤 **${user.userName}**\n\n`

  if (expertise && expertise.length > 0) {
    profileText += `🎯 **Expertise**: ${expertise.join(', ')}\n`
  }

  if (skills && skills.length > 0) {
    profileText += `🛠️ **Skills**: ${skills.join(', ')}\n`
  }

  if (listings && listings.length > 0) {
    profileText += `📋 **Interested in**: ${listings.join(', ')}\n`
  }

  if (priceRange) {
    profileText += `💰 **Price Range**: ${priceRange.rangeLabel} ($${priceRange.minAmount} - $${priceRange.maxAmount})\n`
  }

  profileText += `\n⏰ **Joined**: ${user.createdAt.toLocaleDateString()}`

  // Show update buttons
  const inlineKeyboard = [
    [
      { text: '🎯 Update Expertise', callback_data: 'update_expertise' },
      { text: '🛠️ Update Skills', callback_data: 'update_skills' },
    ],
    [
      { text: '📋 Update Listings', callback_data: 'update_listings' },
      { text: '💰 Update Range', callback_data: 'update_range' },
    ],
  ]

  try {
    await ctx.replyWithPhoto(getImageUrl('/thumbnails/expertise.png'), {
      caption: profileText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    // Fallback to text message if photo fails
    await ctx.reply(profileText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  }
}
