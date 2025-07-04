import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'
import font2base64 from 'node-font2base64'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let pantonRust: string | string[] | null = null
let lfe: string | string[] | null = null

let namecard: Buffer | null = null
let namecardDataURI: string | null = null

let listing: Buffer | null = null
let listingDataURI: string | null = null

let tagProject: Buffer | null = null
let tagProjectDataURI: string | null = null

let tagBounty: Buffer | null = null
let tagBountyDataURI: string | null = null

let bobHead: Buffer | null = null
let bobHeadDataURI: string | null = null

export const preload = async () => {
  console.log('Preloading assets...')
  console.log(path.join(__dirname))
  console.log(path.join(__dirname, '..', 'assets', 'fonts', 'panton-rust.ttf'))
  console.log(path.join(__dirname, '..', 'assets', 'fonts', 'lfe.otf'))
  console.log(path.join(__dirname, '..', 'assets', 'templates', 'namecard.png'))
  console.log(path.join(__dirname, '..', 'assets', 'templates', 'listing.png'))
  console.log(path.join(__dirname, '..', 'assets', 'elements', 'tag-project.png'))
  console.log(path.join(__dirname, '..', 'assets', 'elements', 'tag-bounty.png'))
  console.log(path.join(__dirname, '..', 'assets', 'elements', 'bob-head.png'))

  pantonRust = await font2base64.encodeToDataUrl(path.join(__dirname, '..', 'assets', 'fonts', 'panton-rust.ttf'))
  lfe = await font2base64.encodeToDataUrl(path.join(__dirname, '..', 'assets', 'fonts', 'lfe.otf'))

  namecard = fs.readFileSync(path.join(__dirname, '..', 'assets', 'templates', 'namecard.png'))
  const base64Namecard = Buffer.from(namecard).toString('base64')
  namecardDataURI = 'data:image/jpeg;base64,' + base64Namecard

  listing = fs.readFileSync(path.join(__dirname, '..', 'assets', 'templates', 'listing.png'))
  const base64Listing = Buffer.from(listing).toString('base64')
  listingDataURI = 'data:image/jpeg;base64,' + base64Listing

  tagProject = fs.readFileSync(path.join(__dirname, '..', 'assets', 'elements', 'tag-project.png'))
  const base64TagProject = Buffer.from(tagProject).toString('base64')
  tagProjectDataURI = 'data:image/jpeg;base64,' + base64TagProject

  tagBounty = fs.readFileSync(path.join(__dirname, '..', 'assets', 'elements', 'tag-bounty.png'))
  const base64TagBounty = Buffer.from(tagBounty).toString('base64')
  tagBountyDataURI = 'data:image/jpeg;base64,' + base64TagBounty

  bobHead = fs.readFileSync(path.join(__dirname, '..', 'assets', 'elements', 'bob-head.png'))
  const base64BobHead = Buffer.from(bobHead).toString('base64')
  bobHeadDataURI = 'data:image/jpeg;base64,' + base64BobHead
}

export {
  pantonRust,
  namecard,
  namecardDataURI,
  listing,
  listingDataURI,
  lfe,
  tagProject,
  tagProjectDataURI,
  tagBounty,
  tagBountyDataURI,
  bobHead,
  bobHeadDataURI,
}
