import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChains } from '../helper-hardhat-config'

const BASE_FEE = '250000000000000000'
const GAS_PRICE_LINK = 1e9

const deployMocks: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
   const { network, deployments, getNamedAccounts } = hre
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()

   if (developmentChains.includes(network.name)) {
      log('Local network detected! Deploying mocks...')

      const args = [BASE_FEE, GAS_PRICE_LINK]

      await deploy('VRFCoordinatorV2Mock', {
         from: deployer,
         args,
         log: true,
         waitConfirmations: 1,
      })

      log('Mocks deployed!')
   }
}

deployMocks.tags = ['all', 'mocks']
export default deployMocks
