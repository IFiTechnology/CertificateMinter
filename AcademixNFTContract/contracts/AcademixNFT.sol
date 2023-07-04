// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Importing 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

contract AcademixNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

// Constructor 
    constructor() ERC721("AcademixNFT", "AXT") {}
    console.log("Academix NFT contract!!!");

// Minting Function: Once this fuction is called it mints the NFT and sends it to the recipient wallet address.
    function mintNFT(
        address recipient,
        string memory tokenURI
    ) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        console.log(tokenURI);
        return newItemId;
    }
}
