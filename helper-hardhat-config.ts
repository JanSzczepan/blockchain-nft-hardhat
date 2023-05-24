export interface networkConfigItem {
   name: string
   vrfCoordinatorV2Address?: string
   subscriptionId?: string
   callbackGasLimit?: string
   gasLane?: string
   requestConfirmations?: string
   mintFee?: string
   blockConfirmations?: number
   ethUsdPriceFeed?: string
}

export interface networkConfigInfo {
   [key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
   31337: {
      name: 'localhost',
      gasLane:
         '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc', // 30 gwei
      mintFee: '10000000000000000',
      callbackGasLimit: '500000',
      requestConfirmations: '3',
   },
}

export const developmentChains = ['hardhat', 'localhost']
