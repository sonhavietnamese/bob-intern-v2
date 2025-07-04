let serverUrl: string | null = null

export function setServerUrl(url: string) {
  serverUrl = url
}

export function getServerUrl(): string | null {
  return serverUrl
}

export function getImageUrl(imagePath: string): string {
  const url = getBaseUrl()
  if (!url) {
    throw new Error('Server URL not available. Make sure the server has started.')
  }
  return `${url}${imagePath}`
}

export function getBaseUrl(): string | null {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN

    if (railwayUrl) {
      return railwayUrl.startsWith('http') ? railwayUrl : `https://${railwayUrl}`
    }

    const railwayProjectId = process.env.RAILWAY_PROJECT_ID
    const railwayServiceId = process.env.RAILWAY_SERVICE_ID
    if (railwayProjectId && railwayServiceId) {
      return `https://${railwayServiceId}-${railwayProjectId}.railway.app`
    }

    console.warn('⚠️ Railway URL not found, falling back to ngrok URL')
  }

  return serverUrl
}
