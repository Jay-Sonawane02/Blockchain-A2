pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StableToken is ERC20, Ownable{
    constructor(string memory name_, string memory symbol_,address initialOwner) 
        ERC20(name_, symbol_)
        Ownable(initialOwner)
    {
        // no intial supply only money market will mint as needed
    }

    //Only owner(MoneyMarket) can call
    function mint(address to, uint256 amount) external onlyOwner{
        _mint(to,amount);
    }

    //Only owner(MoneyMarket) can call
    function burn(address from, uint256 amount) external onlyOwner{
        _burn(from,amount);
    }
}
