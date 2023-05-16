export interface networkConfigItem {
   name: string
   blockConfirmations?: number
}

export interface networkConfigInfo {
   [key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
   31337: {
      name: 'localhost',
   },
}

export const developmentChains = ['hardhat', 'localhost']
