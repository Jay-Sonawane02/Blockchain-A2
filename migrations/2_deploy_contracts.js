const VLToken = artifacts.require("VLToken");
const StableToken = artifacts.require("StableToken");
const MockPriceOracle = artifacts.require("MockPriceOracle");
const MoneyMarket = artifacts.require("MoneyMarket");

const toWei = (amount) => web3.utils.toBN(amount).mul(web3.utils.toBN("1000000000000000000"))

module.exports = async function(deployer,network,accounts){
   const deployerAddress = accounts[0];

   //VLToken deployment
   const initialSupply = toWei(1000000); //1 million VLT
   await deployer.deploy(VLToken,"Volatile Token", "VLT", initialSupply.toString(),deployerAddress);
   const vlToken = await VLToken.deployed();
   console.log(`VLToken deployed at: ${vlToken.address}`);

   //StableToken deployment
   await deployer.deploy(StableToken,"Stable Token","SB",deployerAddress);
   const sbToken = await StableToken.deployed();
   console.log(`StableToken deployed at: ${sbToken.address}`);

   //MockPriceOracle deployment
   await deployer.deploy(MockPriceOracle, deployerAddress);
   const priceOracle = await MockPriceOracle.deployed();
   console.log(`MockPriceOracle deployed at: ${priceOracle.address}`);

   //MoneyMarket deployment
   await deployer.deploy(
      MoneyMarket,
      vlToken.address,
      sbToken.address,
      priceOracle.address,
      deployerAddress
   );

   const moneyMarket = await MoneyMarket.deployed();
   console.log(`MoneyMarket deployed at: ${moneyMarket.address}`);

   //Ownership transfer
   await sbToken.transferOwnership(moneyMarket.address);
   console.log("StableToken ownership transferred to MoneyMarket");

   //set initial prices
   await priceOracle.setAssetPrice(vlToken.address, toWei(100));
   await priceOracle.setAssetPrice(sbToken.address,toWei(1));

   //setting money market parameters
   const CF = 7000; //70% (Collateral Factor)
   const LT = 8000; //80% (Liquidation threshold)
   const LB = 500; //5% (Liquidation Bonus)
   const CLF = 5000; //50% (Close Factor)

   await moneyMarket.setCollateralFactor(CF);
   await moneyMarket.setLiquidationThreshold(LT);
   await moneyMarket.setLiquidationBonus(LB);
   await moneyMarket.setCloseFactor(CLF);
   console.log("MoneyMarket parameters set");

   //initial funding
   for(let i=1;i<=9 && i<accounts.length;i++){
      const amt = toWei(100); //100 VLT to each
      await vlToken.transfer(accounts[i],amt,{from:deployerAddress});
   }

   console.log("100 VLT distributed to all accounts");
   console.log("Deployment and setup finished");
};  