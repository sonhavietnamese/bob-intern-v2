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

  let profileText = `👤 <b>${user.userName}</b>\n\n`

  if (expertise && expertise.length > 0) {
    profileText += `🎯 <b>Expertise</b>: ${expertise.join(', ')}\n`
  }

  if (skills && skills.length > 0) {
    profileText += `🛠️ <b>Skills</b>: ${skills.join(', ')}\n`
  }

  if (listings && listings.length > 0) {
    profileText += `📋 <b>Interested in</b>: ${listings.join(', ')}\n`
  }

  if (priceRange) {
    profileText += `💰 <b>Price Range</b>: ${priceRange.rangeLabel} ($${priceRange.minAmount} - $${priceRange.maxAmount})\n`
  }

  profileText += `\n⏰ <b>Joined</b>: ${user.createdAt.toLocaleDateString()}`

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
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  } catch (error) {
    // Fallback to text message if photo fails
    await ctx.reply(profileText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    })
  }
}
