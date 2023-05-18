import { deployments, ethers, network } from 'hardhat'
import { developmentChains, networkConfig } from '../../helper-hardhat-config'
import { RandomNft, VRFCoordinatorV2Mock } from '../../typechain-types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'

developmentChains.includes(network.name) &&
   describe('RandomNft Unit Tests', function () {
      let randomNft: RandomNft
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
      let deployer: SignerWithAddress
      const chainId = network.config.chainId!

      beforeEach(async function () {
         const accounts = await ethers.getSigners()
         deployer = accounts[0]
         await deployments.fixture(['mocks', 'randomnft'])
         randomNft = await ethers.getContract('RandomNft', deployer)
         vrfCoordinatorV2Mock = await ethers.getContract(
            'VRFCoordinatorV2Mock',
            deployer
         )
      })

      describe('constructor', function () {
         it('initializes with correct tokenCounter', async function () {
            const tokenCounter = await randomNft.getTokenCounter()
            expect(tokenCounter.toString()).to.equal('0')
         })

         it('initializes with correct mintFee', async function () {
            const mintFee = await randomNft.getMintFee()
            expect(mintFee.toString()).to.equal(networkConfig[chainId].mintFee)
         })

         it('initializes with correct dogTokenUris', async function () {
            const dogTokenUri1 = await randomNft.getDogTokenUri(0)
            const dogTokenUri2 = await randomNft.getDogTokenUri(1)
            const dogTokenUri3 = await randomNft.getDogTokenUri(2)

            expect(dogTokenUri1).to.include('ipfs://')
            expect(dogTokenUri2).to.include('ipfs://')
            expect(dogTokenUri3).to.include('ipfs://')
         })
      })

      describe('requestNft', function () {
         it('reverts if not enough ETH was sent', async function () {
            await expect(randomNft.requestNft()).to.be.revertedWithCustomError(
               randomNft,
               'RandomNft__NeedMoreETHSent'
            )
         })

         it('adds sender to mapping', async function () {
            const tx = await randomNft.requestNft({
               value: networkConfig[chainId].mintFee,
            })
            const txReceipt = await tx.wait(1)
            const requestId = txReceipt.events![1].args?.requestId
            const sender = await randomNft.getRequestIdSender(requestId)
            expect(sender).to.equal(deployer.address)
         })

         it('emits NftRequested event', async function () {
            await expect(
               randomNft.requestNft({
                  value: networkConfig[chainId].mintFee,
               })
            ).to.be.emit(randomNft, 'NftRequested')
         })
      })

      describe('getRandomBreed', function () {
         it('reverts if range is out of bounds', async function () {
            await expect(
               randomNft.getRandomBreed(100)
            ).to.be.revertedWithCustomError(
               randomNft,
               'RandomNft__RangeOutOfBounds'
            )
         })

         it('gets correct breed', async function () {
            const arr = [
               [0, 5, 9],
               [10, 20, 29],
               [30, 35, 99],
            ]

            for (const index in arr) {
               for (const i in arr[index]) {
                  const breed = await randomNft.getRandomBreed(arr[index][i])
                  expect(breed.toString()).to.equal(index)
               }
            }
         })
      })

      describe('fulfillRandomWords', function () {
         it('mints NFT', async function () {
            const tokenCounter = await randomNft.getTokenCounter()

            await new Promise<void>(async (resolve, reject) => {
               randomNft.once('NftMinted', async () => {
                  try {
                     const newTokenCounter = await randomNft.getTokenCounter()
                     const owner = await randomNft.ownerOf(tokenCounter)
                     const tokenUri = await randomNft.tokenURI(tokenCounter)

                     expect(newTokenCounter.toNumber()).to.be.greaterThan(0)
                     expect(owner).to.equal(deployer.address)
                     expect(tokenUri).to.include('ipfs://')
                     resolve()
                  } catch (error) {
                     console.log(error)
                     reject(error)
                  }
               })

               try {
                  const fee = await randomNft.getMintFee()
                  const txResponse = await randomNft.requestNft({
                     value: fee.toString(),
                  })
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt.events![1].args?.requestId
                  await vrfCoordinatorV2Mock.fulfillRandomWords(
                     requestId,
                     randomNft.address
                  )
               } catch (error) {
                  console.log(error)
                  reject(error)
               }
            })
         })
      })

      describe('withdraw', function () {
         it('reverts if not owner calls function', async function () {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const randomNftConnectedToAttacker = randomNft.connect(attacker)
            await expect(
               randomNftConnectedToAttacker.withdraw()
            ).to.be.revertedWith('Ownable: caller is not the owner')
         })

         it('sends all ETH to the owner', async function () {
            const fee = await randomNft.getMintFee()
            await randomNft.requestNft({ value: fee.toString() })
            const startingOwnerBalance = await deployer.getBalance()
            const startingContractBalance = await randomNft.provider.getBalance(
               randomNft.address
            )

            const txResponse = await randomNft.withdraw()
            const txReceipt = await txResponse.wait(1)
            const { effectiveGasPrice, gasUsed } = txReceipt
            const gasCost = effectiveGasPrice.mul(gasUsed)

            const endingOwnerBalance = await deployer.getBalance()
            const endingContractBalance = await randomNft.provider.getBalance(
               randomNft.address
            )

            expect(endingContractBalance.toString()).to.equal('0')
            expect(endingOwnerBalance.toString()).to.equal(
               startingOwnerBalance
                  .add(startingContractBalance)
                  .sub(gasCost)
                  .toString()
            )
         })
      })
   })
