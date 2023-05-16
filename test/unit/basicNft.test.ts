import { deployments, ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BasicNft } from '../../typechain-types'

developmentChains.includes(network.name) &&
   describe('BasicNft Unit Tests', function () {
      let basicNft: BasicNft
      let deployer: SignerWithAddress

      beforeEach(async function () {
         const accounts = await ethers.getSigners()
         deployer = accounts[0]
         await deployments.fixture(['mocks', 'basicnft'])
         basicNft = await ethers.getContract('BasicNft', deployer)
      })

      describe('constructor', function () {
         it('assignes values correctly', async function () {
            const tokenCounter = await basicNft.getTokenCounter()
            expect(tokenCounter.toString()).to.equal('0')
         })
      })

      describe('mintNft', function () {
         it('assignes nft id to signer correctly', async function () {
            const id = await basicNft.getTokenCounter()
            await basicNft.mintNft()
            const owner = await basicNft.ownerOf(id)
            expect(owner.toString()).to.equal(deployer.address)
         })

         it('increments tokenCounter', async function () {
            await basicNft.mintNft()
            const id = await basicNft.getTokenCounter()
            expect(id.toString()).to.equal('1')
         })
      })

      describe('tokenUri', function () {
         it('returns correct tokenUri', async function () {
            const expectedTokenUri = await basicNft.TOKEN_URI()
            const tokenUri = await basicNft.tokenURI(0)
            expect(tokenUri).to.equal(expectedTokenUri)
         })
      })
   })
