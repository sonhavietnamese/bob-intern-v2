import 'dotenv/config'

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3501,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_SECRET_TOKEN:
    process.env.TELEGRAM_SECRET_TOKEN ||
    String(process.env.TELEGRAM_BOT_TOKEN || '')
      .split(':')
      .pop() ||
    '',
  NGROK_AUTHTOKEN: process.env.NGROK_AUTHTOKEN,
  RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
  RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
  RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID,
  PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
} as const

export const IS_DEVELOPMENT = ENV.NODE_ENV === 'development'
export const IS_PRODUCTION = ENV.NODE_ENV === 'production'

export const CDN_URLS = {
  BASE: 'https://bob-intern-cdn.vercel.app',
  IMAGES: {
    WELCOME: 'https://bob-intern-cdn.vercel.app/welcome.png',
    EXPERTISE: 'https://bob-intern-cdn.vercel.app/expertise.png',
    SKILLS: 'https://bob-intern-cdn.vercel.app/skills.png',
    LISTING: 'https://bob-intern-cdn.vercel.app/listing.png',
    RANGE: 'https://bob-intern-cdn.vercel.app/range.png',
  },
} as const

export const APP_CONFIG = {
  PUPPETEER_ARGS: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  } as any,
} as const

export const TIMING_CONFIG = {
  CRONJOBS: {
    // Scan Superteam listings for new bounties/projects
    LISTINGS_SCAN: IS_DEVELOPMENT ? '*/2 * * * *' : '0 */2 * * *', // Every 2 minutes (dev) vs every 2 hours (prod)

    // Process skill matching and send notifications/reminders
    NOTIFICATIONS: IS_DEVELOPMENT ? '*/1 * * * *' : '6 * * * *', // Every 1 minute (dev) vs every 6 hours (prod)
  },

  // Reminder intervals
  REMINDERS: {
    // Default reminder interval when user clicks "Remind me"
    DEFAULT_INTERVAL_HOURS: 6,

    // Test message reminder interval
    TEST_MESSAGE_INTERVAL_HOURS: 12,

    // How long to look back for recent notifications to prevent duplicates
    RECENT_NOTIFICATION_CUTOFF_MS: IS_PRODUCTION ? 6 * 60 * 60 * 1000 : 30 * 1000, // 6 hours (prod) vs 30 seconds (dev)
  },

  // Message queue and rate limiting
  MESSAGE_QUEUE: {
    // Telegram API rate limits
    RATE_LIMIT_PER_SECOND: 30,
    BATCH_SIZE: 25, // Slightly less than rate limit for safety

    // Retry configuration
    RETRY_DELAY_MS: 5000, // 5 seconds
    MAX_RETRIES: 3,

    // Delay between processing batches
    BATCH_PROCESSING_DELAY_MS: 1000, // 1 second

    // Rate limiting calculation for UI estimates
    ESTIMATED_MESSAGES_PER_SECOND: 25,
  },

  // API and network delays
  API: {
    // Delay between API batches when fetching listing details
    BATCH_DELAY_MS: 1000, // 1 second

    // Superteam API batch size for fetching details
    LISTING_BATCH_SIZE: 10,
  },

  // Webhook and startup timing
  WEBHOOK: {
    // Retry configuration for webhook setup
    RETRY_DELAY_MS: 10000, // 10 seconds
    MAX_RETRIES: 3,

    // Wait time for Railway service to be accessible
    PRODUCTION_STARTUP_DELAY_MS: 5000, // 5 seconds
  },

  // Image and file cleanup
  CLEANUP: {
    // Maximum age for generated images before cleanup
    IMAGE_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Development vs Production differences summary
  ENVIRONMENT_DIFFERENCES: {
    NOTIFICATION_FREQUENCY: IS_DEVELOPMENT ? 'Every 1 minute' : 'Every 1 hour',
    NOTIFICATION_CUTOFF: IS_DEVELOPMENT ? '30 seconds' : '1 hour',
  },
} as const

export const EXPERTISE_GROUPS = {
  DEVELOPMENT: 'DEVELOPMENT',
  DESIGN: 'DESIGN',
  CONTENT: 'CONTENT',
  GROWTH: 'GROWTH',
  COMMUNITY: 'COMMUNITY',
} as const

export const SKILLS: Record<keyof typeof EXPERTISE_GROUPS, string[]> = {
  DEVELOPMENT: ['FRONTEND', 'BACKEND', 'BLOCKCHAIN', 'MOBILE'],
  DESIGN: ['UI/UX', 'GRAPHIC', 'GAME'],
  CONTENT: ['RESEARCH', 'SOCIAL'],
  GROWTH: ['BUSINESS_DEVELOPMENT', 'MARKETING'],
  COMMUNITY: ['COMMUNITY_MANAGER', 'SOCIAL_MODERATOR'],
} as const

export const SUPERTEAM_EARN_SKILL_MAPPING = {
  DEVELOPMENT: ['FRONTEND', 'BACKEND', 'BLOCKCHAIN', 'MOBILE'],
  DESIGN: ['DESIGN', 'UI/UX', 'GRAPHIC', 'GAME'],
  CONTENT: ['CONTENT', 'RESEARCH', 'SOCIAL'],
  GROWTH: ['GROWTH', 'BUSINESS_DEVELOPMENT', 'MARKETING'],
  COMMUNITY: ['COMMUNITY', 'COMMUNITY_MANAGER', 'SOCIAL_MODERATOR'],
} as const

export const LISTINGS = ['Bounties', 'Projects'] as const

export const USD_RANGES = [
  {
    label: 'Pennies Collector',
    value: {
      min: 0,
      max: 250,
    },
  },
  {
    label: 'Side Hustler',
    value: {
      min: 250,
      max: 1000,
    },
  },
  {
    label: 'Total All-In',
    value: {
      min: 1000,
      max: 10000,
    },
  },
] as const

export function validateConfig(): void {
  if (!ENV.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not set')
    console.log('Available environment variables:', Object.keys(process.env).length)
    process.exit(1)
  }
}

export function logEnvironmentInfo(): void {
  console.log('✅ Environment variables loaded successfully')
  console.log(`🔧 Running in ${IS_DEVELOPMENT ? 'DEVELOPMENT' : IS_PRODUCTION ? 'PRODUCTION' : 'UNKNOWN'} mode`)
}
