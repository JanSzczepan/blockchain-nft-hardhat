import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChains } from '../helper-hardhat-config'

const BASE_FEE = '250000000000000000'
const GAS_PRICE_LINK = 1e9
const DECIMALS = '18'
const INITIAL_PRICE = '200000000000000000000'

const deployMocks: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
   const { network, deployments, getNamedAccounts } = hre
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()

   if (developmentChains.includes(network.name)) {
      log('Local network detected! Deploying mocks...')

      await deploy('VRFCoordinatorV2Mock', {
         from: deployer,
         args: [BASE_FEE, GAS_PRICE_LINK],
         log: true,
         waitConfirmations: 1,
      })

      await deploy('MockV3Aggregator', {
         from: deployer,
         args: [DECIMALS, INITIAL_PRICE],
         log: true,
         waitConfirmations: 1,
      })

      log('Mocks deployed!')
   }
}

deployMocks.tags = ['all', 'mocks', 'main']
export default deployMocks
