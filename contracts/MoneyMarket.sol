pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockPriceOracle.sol";
import "./StableToken.sol";

contract MoneyMarket is Ownable{

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant PRICE_SCALE = 1e18;

    IERC20 public immutable vlToken;
    StableToken public immutable sbToken;
    MockPriceOracle public immutable priceOracle;

    uint256 public collateralFactor;
    uint256 public liquidationThreshold;
    uint256 public liquidationBonus;
    uint256 public closeFactor;

    mapping(address => uint256) public collateralBalance;
    mapping(address => uint256) public debtBalance;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Liquidated(address indexed liquidator, address indexed borrower, uint256 repayAmountSB, uint256 seizedVL);

    constructor(
        address _vlToken,
        address _sbToken,
        address _priceOracle
    ) {
        require(_vlToken != address(0) && _sbToken != address(0) && _priceOracle != address(0), "zero address");
        vlToken = IERC20(_vlToken);
        sbToken = StableToken(_sbToken);
        priceOracle = MockPriceOracle(_priceOracle);
    }
    
    //setters
    function setCollateralFactor(uint256 bps) external onlyOwner{
        require(bps <= BASIS_POINTS, "invalid bps");
        collateralFactor = bps;
    }

    function setLiquidationThreshold(uint256 bps) external onlyOwner{
        require(bps <= 2000, "bonus too high"); // <= 20%
        liquidationBonus = bps;
    }

    function setCloseFactor(uint256 bps) external onlyOwner{
        require(bps <= BASIS_POINTS, "invalid bps");
        closeFactor = bps;
    }

    //read functions
    function getCollateralValue(address user) public view returns(uint256){
        uint256 coll = collateralBalance[user];
        if(coll == 0) return 0;

        uint256 priceVL = priceOracle.getAssetPrice(address(vlToken));
        return (coll * priceVL) / PRICE_SCALE;
    }

    function getDebtValue(address user) public view returns (uint256){
        uint256 debt = debtBalance[user];
        if(debt==0) return 0;

        uint256 priceSB = priceOracle.getAssetPrice(address(sbToken));
        return (debt * priceSB) / PRICE_SCALE;
    }


    function getHealthFactor(address user) public view returns (uint256){
        uint256 debtValue = getDebtValue(user);

        if(debtValue == 0){
            return type(uint256).max;
        }

        uint256 collateralValue = getCollateralValue((user));
        uint256 numerator = (collateralValue * liquidationThreshold)/ BASIS_POINTS;

        if(numerator==0){
            return 0;
        }

        return (numerator * BASIS_POINTS)/debtValue;
    }

    function getBorrowingPowerUSD(address user) public view returns (uint256){
        uint256 collUSD = getCollateralValue(user);

        return (collUSD * collateralFactor)/BASIS_POINTS;
    }

    //users functions

    function deposit(uint256 amount) external{
        require(amount>0 , "zero amount");
        require(vlToken.transferFrom(msg.sender, address(this), amount),"transferFrom failed");
        collateralBalance[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external{
        require(amount>0 , "zero amount");
        uint256 userColl = collateralBalance[msg.sender];
        require(userColl >= amount,"not enough collateral");

        uint256 newColl = userColl-amount;

        uint256 priceVL = priceOracle.getAssetPrice(address(vlToken));
        uint256 collUSD = (newColl * priceVL) / PRICE_SCALE;
        uint256 debtUSD = getDebtValue(msg.sender);

        //check health factor
        require(collUSD * liquidationThreshold >= debtUSD * BASIS_POINTS, "withdraw would make HF<1");

        //update
        collateralBalance[msg.sender] = newColl;
        require(vlToken.transfer(msg.sender, amount),"transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function borrow(uint256 amount) external{
        require(amount>0, "zero amount");

        uint256 borrowPowerUSD = getBorrowingPowerUSD(msg.sender);
        uint256 currentDebtUSD = getDebtValue(msg.sender);
        uint256 priceSB = priceOracle.getAssetPrice(address(sbToken));
        uint256 addedDebtUSD = (amount * priceSB) / PRICE_SCALE;

        require(currentDebtUSD + addedDebtUSD <= borrowPowerUSD,"exceeds borrow power");

        //update
        debtBalance[msg.sender] += amount;
        sbToken.mint(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external{
        require(amount > 0, "zero amount");
        uint256 debt = debtBalance[msg.sender];
        require(debt>0, "no debt");
        require(amount<= debt, "repay > debt");

        //transfer SBToken to the contract
        require(IERC20(address(sbToken)).transferFrom(msg.sender,address(this),amount),"transfer failed");
        sbToken.burn(address(this),amount);

        debtBalance[msg.sender] = debt-amount;
        emit Repaid(msg.sender, amount);
    }

    //Liquidation

    


}