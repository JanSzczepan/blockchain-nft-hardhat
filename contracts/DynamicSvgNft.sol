// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import 'base64-sol/base64.sol';

error ERC721Metadata__URI_QueryFor_NonExistentToken();

contract DynamicSvgNft is ERC721 {
   uint256 private s_tokenCounter;
   string private s_lowImageURI;
   string private s_highImageURI;
   AggregatorV3Interface internal immutable i_priceFeed;

   mapping(uint256 => int256) private s_tokenIdToHighValues;

   event CreatedNft(uint256 indexed tokenId, int256 highValue);

   constructor(
      address priceFeedAddress,
      string memory lowSvg,
      string memory highSvg
   ) ERC721('Dynamic SVG NFT', 'DSN') {
      i_priceFeed = AggregatorV3Interface(priceFeedAddress);
      s_lowImageURI = svgToImageURI(lowSvg);
      s_highImageURI = svgToImageURI(highSvg);
   }

   function mintNft(int256 highValue) public {
      uint256 tokenCounter = s_tokenCounter;
      s_tokenIdToHighValues[tokenCounter] = highValue;
      _safeMint(msg.sender, tokenCounter);
      s_tokenCounter++;
      emit CreatedNft(tokenCounter, highValue);
   }

   function svgToImageURI(
      string memory svg
   ) public pure returns (string memory) {
      string memory baseURL = 'data:image/svg+xml;base64,';
      string memory svgBase64Encoded = Base64.encode(
         bytes(string(abi.encodePacked(svg)))
      );
      return string(abi.encodePacked(baseURL, svgBase64Encoded));
   }

   function _baseURI() internal pure override returns (string memory) {
      return 'data:application/json;base64,';
   }

   function tokenURI(
      uint256 tokenId
   ) public view virtual override returns (string memory) {
      if (!_exists(tokenId)) {
         revert ERC721Metadata__URI_QueryFor_NonExistentToken();
      }

      (, int price, , , ) = i_priceFeed.latestRoundData();

      string memory imageURI = s_lowImageURI;
      if (price >= s_tokenIdToHighValues[tokenId]) {
         imageURI = s_highImageURI;
      }

      return
         string(
            abi.encodePacked(
               _baseURI(),
               Base64.encode(
                  bytes(
                     abi.encodePacked(
                        '{"name":"',
                        name(),
                        '", "description":"An NFT that changes based on the Chainlink Feed", ',
                        '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                        imageURI,
                        '"}'
                     )
                  )
               )
            )
         );
   }

   function getLowSVG() public view returns (string memory) {
      return s_lowImageURI;
   }

   function getHighSVG() public view returns (string memory) {
      return s_highImageURI;
   }

   function getPriceFeed() public view returns (AggregatorV3Interface) {
      return i_priceFeed;
   }

   function getTokenCounter() public view returns (uint256) {
      return s_tokenCounter;
   }

   function getHighValue(uint256 tokenId) public view returns (int256) {
      return s_tokenIdToHighValues[tokenId];
   }
}
