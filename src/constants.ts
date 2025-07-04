export const EXPERTISE_GROUPS = {
  DEV: 'DEV',
  DESIGN: 'DESIGN',
  CONTENT: 'CONTENT',
  GROWTH: 'GROWTH',
  COMMUNITY: 'COMMUNITY',
} as const

export const SKILLS: Record<keyof typeof EXPERTISE_GROUPS, string[]> = {
  DEV: ['FRONTEND', 'BACKEND', 'BLOCKCHAIN', 'MOBILE'],
  DESIGN: ['UI/UX', 'GRAPHIC', 'GAME'],
  CONTENT: ['RESEARCH', 'SOCIAL'],
  GROWTH: ['BUSINESS_DEVELOPMENT', 'MARKETING'],
  COMMUNITY: ['COMMUNITY_MANAGER', 'SOCIAL_MODERATOR'],
} as const

export const LISTINGS = ['Bounties', 'Projects']

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
      max: 3000,
    },
  },
  {
    label: 'All-in',
    value: {
      min: 3000,
      max: 10000,
    },
  },
]
