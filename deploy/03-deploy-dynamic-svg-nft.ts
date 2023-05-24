import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChains } from '../helper-hardhat-config'
import { ethers } from 'hardhat'
import { networkConfig } from '../helper-hardhat-config'
import fs from 'fs-extra'
import verify from '../utils/verify'

const deployDynamicSvgNft: DeployFunction = async function (
   hre: HardhatRuntimeEnvironment
) {
   const { deployments, getNamedAccounts, network } = hre
   const { deploy } = deployments
   const { deployer } = await getNamedAccounts()
   const chainId = network.config.chainId!

   let priceFeedAddress: string

   if (developmentChains.includes(network.name)) {
      const aggregatorV3Interface = await ethers.getContract(
         'MockV3Aggregator',
         deployer
      )
      priceFeedAddress = aggregatorV3Interface.address
   } else {
      priceFeedAddress = networkConfig[chainId].ethUsdPriceFeed!
   }

   const lowSVG = fs.readFileSync('./images/dynamicNft/frown.svg', {
      encoding: 'utf8',
   })
   const highSVG = fs.readFileSync('./images/dynamicNft/happy.svg', {
      encoding: 'utf8',
   })

   const args = [priceFeedAddress, lowSVG, highSVG]
   const dynamicSvgNft = await deploy('DynamicSvgNft', {
      from: deployer,
      args,
      log: true,
      waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
   })

   if (
      !developmentChains.includes(network.name) &&
      process.env.ETHERSCAN_API_KEY
   ) {
      await verify(dynamicSvgNft.address, args)
   }
}

deployDynamicSvgNft.tags = ['all', 'dynamicsvg', 'main']
export default deployDynamicSvgNft
