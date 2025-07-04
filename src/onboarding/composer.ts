import { Composer, session } from 'grammy'

import expertiseCommand from './commands/expertise'
import listingCommand from './commands/listing'
import startCommand from './commands/start'
import skillsCommand from './commands/skills'
import rangeCommand from './commands/range'
import profileCommand from './commands/profile'

import { handleCallbackQuery } from './handlers/callbacks'
import { handleTextMessage } from './handlers/messages'

import type { OnboardingContext, OnboardingSessionData } from './types'
import { getImageUrl } from '../lib/url'
import { generateListingThumbnail } from '@/lib/utils'

export const composer = new Composer<OnboardingContext>()

const sessionMiddleware = session({
  initial(): OnboardingSessionData {
    return {
      selectedExpertise: [],
      selectedSkills: [],
      selectedListings: [],
    }
  },
})

export const commands = [
  { command: 'start', description: 'Start the bot' },
  { command: 'listing', description: 'Open listings' },
  { command: 'expertise', description: 'Open expertise' },
  { command: 'skills', description: 'Open skills' },
  { command: 'range', description: 'Open range' },
  { command: 'profile', description: 'View your profile' },
  { command: 'test', description: 'Test image display' },
]

composer.use(sessionMiddleware)

composer.command('start', startCommand)
composer.command('expertise', expertiseCommand)
composer.command('listing', listingCommand)
composer.command('skills', skillsCommand)
composer.command('range', rangeCommand)
composer.command('profile', profileCommand)

composer.command('test', async (ctx) => {
  try {
    const imageUrl = await generateListingThumbnail('Build your App with AI on Solana: AImpact Beta Challenge')
    console.log(imageUrl)
    ctx.replyWithPhoto(getImageUrl(imageUrl), {
      caption: `**Kumeka Team** is sponsoring this listing!

Build no-code Solana apps with AImpact for a chance to win up to $2000 USDC and shape the future of AI-powered development.`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Remind me every 12 hours',
              callback_data: 'remind_me',
            },
            {
              text: 'Join',
              url: 'https://earn.superteam.fun/listing/aimpact-beta-challenge/?utm_source=telegrambot',
            },
          ],
        ],
      },
    })
  } catch (error) {
    ctx.reply('❌ Server is still starting up. Please try again in a moment.')
  }
})

composer.on('callback_query:data', handleCallbackQuery)
composer.on('message:text', handleTextMessage)

export default composer
