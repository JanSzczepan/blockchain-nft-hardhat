// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

error RandomNft__NeedMoreETHSent();
error RandomNft__RangeOutOfBounds();
error RandomNft__TransferFailed();

contract RandomNft is ERC721URIStorage, VRFConsumerBaseV2, Ownable {
   enum Breed {
      PUG,
      SHIBA_INU,
      ST_BERNARD
   }

   VRFCoordinatorV2Interface private immutable i_vrfCoordinatorV2;
   uint64 private immutable i_subscriptionId;
   bytes32 private immutable i_gasLane;
   uint16 private immutable i_requestConfirmations;
   uint32 private immutable i_callbackGasLimit;
   uint32 private constant NUM_WORDS = 1;

   mapping(uint256 => address) private s_requestIdToSender;

   uint256 private immutable i_mintFee;
   string[3] internal s_dogTokenUris;
   uint256 private s_tokenCounter;
   uint256 internal constant MIN_CHANCE_VALUE = 10;
   uint256 internal constant MID_CHANCE_VALUE = 30;
   uint256 internal constant MAX_CHANCE_VALUE = 100;

   event NftRequested(uint256 indexed requestId, address requester);
   event NftMinted(Breed breed, address minter);

   constructor(
      address vrfCoordinatorV2Address,
      uint64 subscriptionId,
      bytes32 gasLane,
      uint16 requestConfirmations,
      uint32 callbackGasLimit,
      uint256 mintFee,
      string[3] memory dogTokenUris
   ) ERC721('RandomDoggie', 'RDOG') VRFConsumerBaseV2(vrfCoordinatorV2Address) {
      i_vrfCoordinatorV2 = VRFCoordinatorV2Interface(vrfCoordinatorV2Address);
      i_subscriptionId = subscriptionId;
      i_gasLane = gasLane;
      i_requestConfirmations = requestConfirmations;
      i_callbackGasLimit = callbackGasLimit;
      i_mintFee = mintFee;
      s_dogTokenUris = dogTokenUris;
   }

   function requestNft() public payable returns (uint256 requestId) {
      if (msg.value < i_mintFee) {
         revert RandomNft__NeedMoreETHSent();
      }

      requestId = i_vrfCoordinatorV2.requestRandomWords(
         i_gasLane,
         i_subscriptionId,
         i_requestConfirmations,
         i_callbackGasLimit,
         NUM_WORDS
      );

      s_requestIdToSender[requestId] = msg.sender;
      emit NftRequested(requestId, msg.sender);

      return requestId;
   }

   function fulfillRandomWords(
      uint256 requestId,
      uint256[] memory randomWords
   ) internal override {
      address dogOwner = s_requestIdToSender[requestId];
      uint256 newItemId = s_tokenCounter;
      s_tokenCounter++;
      uint256 randomNumber = randomWords[0] % MAX_CHANCE_VALUE;
      Breed breed = getRandomBreed(randomNumber);

      _safeMint(dogOwner, newItemId);
      _setTokenURI(newItemId, s_dogTokenUris[uint256(breed)]);
      emit NftMinted(breed, dogOwner);
   }

   function withdraw() public onlyOwner {
      uint256 amount = address(this).balance;
      (bool success, ) = payable(msg.sender).call{value: amount}('');
      if (!success) {
         revert RandomNft__TransferFailed();
      }
   }

   function getRandomBreed(uint256 randomNumber) public pure returns (Breed) {
      uint256[3] memory chanceArray = getChanceArray();
      uint256 currentMinChance = 0;

      for (uint256 i = 0; i < chanceArray.length; i++) {
         if (
            randomNumber >= currentMinChance && randomNumber < chanceArray[i]
         ) {
            return Breed(i);
         }
         currentMinChance = chanceArray[i];
      }

      revert RandomNft__RangeOutOfBounds();
   }

   function getChanceArray() public pure returns (uint256[3] memory) {
      return [MIN_CHANCE_VALUE, MID_CHANCE_VALUE, MAX_CHANCE_VALUE];
   }

   function getMintFee() public view returns (uint256) {
      return i_mintFee;
   }

   function getDogTokenUris(uint256 index) public view returns (string memory) {
      return s_dogTokenUris[index];
   }

   function getTokenCounter() public view returns (uint256) {
      return s_tokenCounter;
   }

   function getRequestIdSender(
      uint256 requestId
   ) public view returns (address) {
      return s_requestIdToSender[requestId];
   }
}
