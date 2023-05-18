import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'
import 'dotenv/config'

const config: HardhatUserConfig = {
   defaultNetwork: 'hardhat',
   networks: {
      hardhat: {
         chainId: 31337,
      },
   },
   solidity: '0.8.18',
   namedAccounts: {
      deployer: {
         default: 0,
         1: 0,
      },
   },
   mocha: {
      timeout: 200000,
   },
}

export default config
