pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Volatile token contract, used as collateral in MoneyMarket

contract VLToken is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply) ERC20(name_,symbol_){
        //initialSupply must be multiplied by 10 ** decimals before passing it (token units)
        _mint(msg.sender,initialSupply);
    }
}

