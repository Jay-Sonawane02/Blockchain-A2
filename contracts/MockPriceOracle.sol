pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockPriceOracle is Ownable{
    //token to price mapping
    mapping(address => uint256) public prices;

    event PriceUpdated(address indexed token, uint256 price);

    //set USD price for token
    function setAssetPrice(address token, uint256 price) external onlyOwner{
        prices[token] = price;
        emit PriceUpdated(token,price);
    }

    //get USD price of a token
    function getAssetPrice(address token) external view returns (uint256) {
        return prices[token];
    }
}