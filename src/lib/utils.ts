import path from 'path'
import fs from 'fs-extra'
import nodeHtmlToImage from 'node-html-to-image'
import { getBaseUrl } from './url'
import { pantonRust, namecardDataURI, listingDataURI, lfe, tagBountyDataURI, bobHeadDataURI, tagProjectDataURI } from './preload'
import { APP_CONFIG, IS_PRODUCTION } from '@/config'
import { TIMING_CONFIG } from '@/config'

export const leftAlignTextTelegram = (text: string, maxLength: number) => {
  const textLength = text.length
  const remainingLength = maxLength - textLength
  const padding = ' '.repeat(remainingLength)
  return text + padding
}

export interface ImageGenerationOptions {
  title: string
  subtitle?: string
  width?: number
  height?: number
  backgroundColor?: string
  textColor?: string
  titleColor?: string
}

export const generateImage = async (options: ImageGenerationOptions): Promise<string> => {
  const { title, subtitle, width = 1200, height = 630, backgroundColor = '#ffffff', textColor = '#333333', titleColor = '#000000' } = options

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            width: ${width}px;
            height: ${height}px;
            background-color: ${backgroundColor};
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            box-sizing: border-box;
            padding: 40px;
          }
          
          .title {
            font-size: 72px;
            font-weight: 900;
            color: ${titleColor};
            line-height: 1.2;
            margin: 0;
            margin-bottom: ${subtitle ? '20px' : '0'};
            max-width: 100%;
            word-wrap: break-word;
          }
          
          .subtitle {
            font-size: 36px;
            font-weight: 400;
            color: ${textColor};
            opacity: 0.8;
            line-height: 1.4;
            margin: 0;
            max-width: 100%;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <h1 class="title">${title}</h1>
        ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      </body>
    </html>
  `

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const filename = `image-${timestamp}.png`
    const filePath = path.join(process.cwd(), 'public', 'images', filename)

    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath))

    // Generate image
    const image = (await nodeHtmlToImage({
      html,
      quality: 100,
      type: 'png',
      puppeteerArgs: {
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
      },
    })) as Buffer

    // Save image file
    await fs.writeFile(filePath, image)

    console.log(`✅ Generated image: ${filename}`)

    // Return the public URL path
    return `/images/${filename}`
  } catch (error) {
    console.error('❌ Failed to generate image:', error)
    throw error
  }
}

export const cleanupOldImages = async (maxAge: number = TIMING_CONFIG.CLEANUP.IMAGE_MAX_AGE_MS) => {
  try {
    const imagesDir = path.join(process.cwd(), 'public', 'images')
    const files = await fs.readdir(imagesDir)
    const now = Date.now()

    for (const file of files) {
      const filePath = path.join(imagesDir, file)
      const stats = await fs.stat(filePath)

      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath)
        console.log(`🗑️ Cleaned up old image: ${file}`)
      }
    }
  } catch (error) {
    console.error('❌ Failed to cleanup old images:', error)
  }
}

export const computeImageUrl = (imagePath: string) => {
  const baseUrl = getBaseUrl()
  return baseUrl ? `${baseUrl}${imagePath}` : `http://localhost:3501${imagePath}`
}

export const generateNameCard = async (name: string, userId: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
         @font-face {
            font-family: 'Panton Rust';
            src: url('{{{font}}}') format('truetype');
          }
          body {
            margin: 0;
            padding: 0;
            width: 1920px;
            height: 950px;
            font-family: 'Panton Rust', sans-serif;
            position: relative;
          }
          
          .background {
            position: absolute;
            top: 0;
            left: 0;
            width: 1920px;
            height: 950px;
          }

          .background-image {
            width: 1920px;
            height: 950px;
            object-fit: cover;
          }

          .name {
            position: absolute;
            top: 245px;
            left: 690px;
            width: 495px;
            height: 170px;
          }

          .name-content {
            font-size: 60px;
            color: #000000;
            font-family: 'Panton Rust', sans-serif;
            word-break: break-word;
            overflow-wrap: break-word;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="background">
          <img src="${namecardDataURI}" alt="Name Card" class="background-image" />
        </div>
        <div class="name">
          <span class="name-content">${name.slice(0, 20)}</span>
        </div>
      </body>
    </html>
  `

  try {
    // Generate unique filename
    const filename = `${userId}.png`
    const filePath = path.join(process.cwd(), 'public', 'images', 'namecards', filename)

    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath))

    // Generate image
    const image = (await nodeHtmlToImage({
      html,
      content: {
        font: pantonRust,
      },
      puppeteerArgs: IS_PRODUCTION ? APP_CONFIG.PUPPETEER_ARGS : undefined,

      // puppeteerArgs: {
      //   executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      //   args: [
      //     '--no-sandbox',
      //     '--disable-setuid-sandbox',
      //     '--disable-dev-shm-usage',
      //     '--disable-accelerated-2d-canvas',
      //     '--no-first-run',
      //     '--no-zygote',
      //     '--single-process',
      //     '--disable-gpu',
      //   ],
      // },
    })) as Buffer

    // Save image file
    await fs.writeFile(filePath, image)

    console.log(`✅ Generated image: ${filename}`)

    // Return the public URL path
    return `/images/namecards/${filename}`
  } catch (error) {
    console.error('❌ Failed to generate image:', error)
    throw error
  }
}

export const generateListingThumbnail = async (
  // slug: string,
  // listing: string,
  // deadline: string,
  // amount: string,
  // token: string,
  // sponsor: string,
  // type: string,
  listing: any,
) => {
  // TODO: find the existing listing thumbnail and return the path
  try {
    const thumbnailPath = path.join(process.cwd(), 'public', 'images', 'listings', `${listing.slug}-thumbnail.png`)
    await fs.access(thumbnailPath) // Check if file exists without loading it into memory
    return `/images/listings/${listing.slug}-thumbnail.png`
    throw new Error('Listing thumbnail not found')
  } catch {
    // File doesn't exist, continue to generate new thumbnail

    // const deadline = '17 JUN 2025 00:00 UTC'
    // const amount = '2000'
    // const token = 'USDC'
    // const sponsor = 'Kumeka Team'

    const sponsor = JSON.parse(listing.sponsor)

    const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
          @font-face {
            font-family: 'Panton Rust';
            src: url('{{{pantonRust}}}') format('truetype');
          }

          @font-face {
            font-family: 'LFE';
            src: url('{{{lfe}}}') format('opentype');
          }
        body {
          margin: 0;
          padding: 0;
          width: 1920px;
          height: 1400px;
          font-family: 'Panton Rust', sans-serif;
          position: relative;
        }

        .background {
          position: absolute;
          top: 0;
          left: 0;
          width: 1920px;
          height: 1400px;
        }

        .title {
          position: absolute;
          top: 170px;
          left: 94px;
          width: 1732px;
          height: auto;
          display: flex;
          flex-direction: column;
        }

        .decor {
          position: absolute;
          top: 487px;
          left: 1530px;
          width: 550px;
          height: 540px;
          rotate: -67deg;
        }

        .sponsor {
          font-size: 48px;
          font-family: 'LFE', sans-serif;
          word-break: break-word;
          overflow-wrap: break-word;
          color: #FFFFFF;
          margin-top: 10px;
        }

        .title-content {
          font-size: 100px;
          font-family: 'Panton Rust', sans-serif;
          word-break: break-word;
          overflow-wrap: break-word;
          color: #FFFFFF;
        }

        .deadline {
          position: absolute;
          top: 918px;
          left: 94px;
          width: 1732px;
        }

        .tag {
          position: absolute;
          top: 120px;
          left: 1610px;
          width: 200px;
          height: 100px;
          rotate: 21deg;
          z-index: 10;
        }

        .deadline-content {
          font-size: 85px;
          font-family: 'Panton Rust', sans-serif;
          word-break: break-word;
          overflow-wrap: break-word;
          color: #FFFFFF;
        }

        .amount {
          position: absolute;
          top: 1150px;
          left: 94px;
          width: 1732px;
          font-size: 155px;
          color: #FFFFFF;
        }
      </style>
    </head>   
    <body>
      <div class="background">
        <img src="{{{listingDataURI}}}" alt="Listing" class="background-image" />
      </div>

      <div class="tag">
        <img src="{{{tag}}}" alt="Tag Project" class="tag-image" />
      </div>

      <div class="decor">
        <img src="{{{decor}}}" alt="Decor" class="decor-image" />
      </div>

      <div class="title">
        <span class="title-content">${listing.title}</span>
        <span class="sponsor">By <i class="sponsor-name">${sponsor.name}</i></span>
      </div>

      <div class="deadline">
        <span class="deadline-content">${new Date(listing.deadline)
          .toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
            hour12: false,
          })
          .replace(',', ' ')
          .toUpperCase()} UTC</span>
      </div>
 
      <div class="amount">
        <span class="amount-content">$${listing.usdValue} ${listing.token}</span>
      </div>
   </body>
  </html>
`

    try {
      // Generate unique filename
      // const timestamp = Date.now()
      const filename = `${listing.slug}-thumbnail.png`
      const filePath = path.join(process.cwd(), 'public', 'images', 'listings', filename)

      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath))

      // Generate image
      const image = (await nodeHtmlToImage({
        html,
        content: {
          listingDataURI,
          pantonRust,
          lfe,
          tag: listing.type === 'bounty' ? tagBountyDataURI : tagProjectDataURI,
          decor: bobHeadDataURI,
        },
        // puppeteerArgs: {
        //   executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        //   args: [
        //     '--no-sandbox',
        //     '--disable-setuid-sandbox',
        //     '--disable-dev-shm-usage',
        //     '--disable-accelerated-2d-canvas',
        //     '--no-first-run',
        //     '--no-zygote',
        //     '--single-process',
        //     '--disable-gpu',
        //   ],
        // },
      })) as Buffer

      // Save image file
      await fs.writeFile(filePath, image)

      console.log(`✅ Generated image: ${filename}`)

      // Return the public URL path
      return `/images/listings/${filename}`
    } catch (error) {
      console.error('❌ Failed to generate image:', error)
      throw error
    }
  }
}
