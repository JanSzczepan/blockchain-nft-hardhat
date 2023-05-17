import fs from 'fs-extra'
import path from 'path'
import pinataSDK, { PinataPinOptions, PinataPinResponse } from '@pinata/sdk'
import { Metadata } from '../deploy/02-deploy-random-nft'

const PINATA_API_KEY = process.env.PINATA_API_KEY || ''
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY || ''
const pinata = pinataSDK(PINATA_API_KEY, PINATA_SECRET_API_KEY)

export async function storeImages(imagesPath: string): Promise<{
   responses: PinataPinResponse[]
   images: string[]
}> {
   console.log('Uploading images to pinata...')

   const fullImagesPath = path.resolve(imagesPath)
   const images: string[] = fs.readdirSync(fullImagesPath)
   let responses: PinataPinResponse[] = []

   for (const imageIndex in images) {
      console.log(`Uploading ${images[imageIndex]}...`)

      const readableImageStream = fs.createReadStream(
         `${fullImagesPath}/${images[imageIndex]}`
      )
      try {
         const options: PinataPinOptions = {
            pinataMetadata: {
               name: images[imageIndex].replace('.png', ''),
            },
         }
         const response = await pinata.pinFileToIPFS(
            readableImageStream,
            options
         )
         responses.push(response)
      } catch (error) {
         console.log(error)
      }
   }

   console.log('Images uploaded!')
   return { responses, images }
}

export async function storeeImages(imagesFilePath: string) {
   const fullImagesPath = path.resolve(imagesFilePath)
   const files = fs.readdirSync(fullImagesPath)
   let responses = []
   for (const fileIndex in files) {
      const readableStreamForFile = fs.createReadStream(
         `${fullImagesPath}/${files[fileIndex]}`
      )
      try {
         const response = await pinata.pinFileToIPFS(readableStreamForFile)
         responses.push(response)
      } catch (error) {
         console.log(error)
      }
   }
   return { responses, files }
}

export async function stroreTokenUriMetadata(
   metadata: Metadata
): Promise<PinataPinResponse | undefined> {
   console.log(`Uploading metadata for ${metadata.name}...`)

   try {
      const options: PinataPinOptions = {
         pinataMetadata: {
            name: `Metadata for ${metadata.name}`,
         },
      }
      const response = await pinata.pinJSONToIPFS(metadata, options)

      console.log('Uploaded!')
      return response
   } catch (error) {
      console.log(error)
   }

   return undefined
}
