import { getImageUrl } from '@/lib/url'
import type { OnboardingContext } from '@/onboarding/types'
import { CommandContext } from 'grammy'
import { dbService } from '@/database/services'

export default async function profile(ctx: CommandContext<OnboardingContext>) {
  const telegramId = ctx.from?.id.toString()

  if (!telegramId) {
    await ctx.reply('❌ Unable to identify user')
    return
  }

  const userProfile = await dbService.getUserProfile(telegramId)

  if (!userProfile) {
    await ctx.reply('❌ No profile found. Please start the onboarding process with /start')
    return
  }

  const { user, expertise, skills, listings, priceRange } = userProfile

  let profileText = `👤 **Profile: ${user.userName}**\n\n`

  if (expertise.length > 0) {
    profileText += `🎯 **Expertise**: ${expertise.join(', ')}\n`
  }

  if (skills.length > 0) {
    profileText += `⚡ **Skills**: ${skills.join(', ')}\n`
  }

  if (listings.length > 0) {
    profileText += `📋 **Preferred Listings**: ${listings.join(', ')}\n`
  }

  if (priceRange) {
    profileText += `💰 **Price Range**: ${priceRange.label} ($${priceRange.min} - $${priceRange.max})\n`
  }

  profileText += `\n📅 **Member since**: ${new Date(user.createdAt || '').toLocaleDateString()}`

  // Send profile information
  await ctx.reply(profileText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Update Expertise', callback_data: 'update_expertise' },
          { text: '🛠️ Update Skills', callback_data: 'update_skills' },
        ],
        [
          { text: '📋 Update Listings', callback_data: 'update_listings' },
          { text: '💰 Update Range', callback_data: 'update_range' },
        ],
      ],
    },
  })
}
