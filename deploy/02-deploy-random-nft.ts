import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChains, networkConfig } from '../helper-hardhat-config'
import { VRFCoordinatorV2Mock } from '../typechain-types'
import { ethers } from 'hardhat'
import { storeImages, stroreTokenUriMetadata } from '../utils/uploadToPinata'
import verify from '../utils/verify'

type Attribute = {
   trait_type: string
   value: number
}

export type Metadata = {
   name: string
   description: string
   image: string
   attributes?: Attribute[]
}

const FUND_AMOUNT = '1000000000000000000000'
const IMAGES_LOCATION = './images/randomNft/'
let tokenUris: string[] = []

const deployRandomNft: DeployFunction = async function (
   hre: HardhatRuntimeEnvironment
) {
   const { deployments, getNamedAccounts, network } = hre
   const { deploy } = deployments
   const { deployer } = await getNamedAccounts()
   const chainId = network.config.chainId!

   let vrfCoordinatorV2Address: string | undefined
   let subscriptionId: string | undefined

   if (process.env.UPLOAD_TO_PINATA) {
      tokenUris = await handleTokenUris()
   }

   if (developmentChains.includes(network.name)) {
      const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock =
         await ethers.getContract('VRFCoordinatorV2Mock')
      vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address

      const transactionResponse =
         await vrfCoordinatorV2Mock.createSubscription()
      const transactionReceipt = await transactionResponse.wait(1)
      subscriptionId = transactionReceipt.events![0].args?.subId as
         | string
         | undefined

      await vrfCoordinatorV2Mock.fundSubscription(subscriptionId!, FUND_AMOUNT)
   } else {
      vrfCoordinatorV2Address = networkConfig[chainId!].vrfCoordinatorV2Address
      subscriptionId = networkConfig[chainId!].subscriptionId
   }

   const args: any[] = [
      vrfCoordinatorV2Address,
      subscriptionId,
      networkConfig[chainId]['gasLane'],
      networkConfig[chainId]['requestConfirmations'],
      networkConfig[chainId]['callbackGasLimit'],
      networkConfig[chainId]['mintFee'],
      tokenUris,
   ]

   const randomNft = await deploy('RandomNft', {
      from: deployer,
      args,
      log: true,
      waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
   })

   if (
      !developmentChains.includes(network.name) &&
      process.env.ETHERSCAN_API_KEY
   ) {
      await verify(randomNft.address, args)
   }
}

async function handleTokenUris() {
   const tokenUrisArr: string[] = []
   const { responses: imageUploadResponses, images } = await storeImages(
      IMAGES_LOCATION
   )

   for (const imageUploadResponseIndex in imageUploadResponses) {
      const name = images[imageUploadResponseIndex].replace('.png', '')
      const tokenUriMetadata: Metadata = {
         name,
         description: `An adorable ${name} pup!`,
         image: `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`,
      }
      const metadataUploadResponse = await stroreTokenUriMetadata(
         tokenUriMetadata
      )
      tokenUrisArr.push(`ipfs://${metadataUploadResponse?.IpfsHash}`)
   }

   console.log('Token URIs uploaded! They are:')
   console.log(tokenUrisArr)
   return tokenUrisArr
}

deployRandomNft.tags = ['all', 'randomipfs', 'main']
export default deployRandomNft
