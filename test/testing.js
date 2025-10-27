const VLToken = artifacts.require("VLToken");
const MoneyMarket = artifacts.require("MoneyMarket");
const StableToken = artifacts.require("StableToken");
const MockPriceOracle = artifacts.require("MockPriceOracle");


contract("MoneyMarket", (accounts) => {

    let moneyMarket;
    let vlToken;
    let sbToken;
    let priceOracle;
    const owner = accounts[0];
    const BN = web3.utils.BN;

    beforeEach(async () => {
        vlToken = await VLToken.deployed();
        sbToken = await StableToken.deployed();
        priceOracle = await MockPriceOracle.deployed();
        moneyMarket = await MoneyMarket.deployed();
    });

    async function get_general_user() {
        return accounts[Math.floor(Math.random() * 10) + 1];
    }

    async function get_liquidator() {
        return accounts[Math.floor(Math.random() * 5) + 11];
    }

   


    it("Simulating 100 random transactions", async () => {
    for (let i = 0; i < 100; i++) {
        
        //contract owner = 0
        //general_user = 1-10
        //liquidator = 11-15
        console.log(`\n--- Transaction ${i + 1} ---`);
        // Choose one uniformly at random
        const randomIndex = Math.floor(Math.random() * 5);

        // console.log(`Chosen operation index: ${randomIndex}`);
        // Call the chosen function
        switch (randomIndex) 
        {
            case 0:
                {
                    const user = await get_general_user();
                    try{
                        console.log(`Deposit Event`);
                        const balance = await vlToken.balanceOf(user); 
                        const fraction = Math.floor((Math.random() * (0.5 - 0.1) + 0.1) * 10000);
                        const amount = balance.mul(new BN(fraction)).div(new BN(10000)); 
                        if (amount.isZero()) continue; 
                        await vlToken.approve(moneyMarket.address, amount, { from: user });
                        await moneyMarket.deposit(amount, { from: user });
                        // console.log(`User ${user} deposited ${amount.toString()}`);
                        
                    }
                    catch (error) {
                        console.log(`Deposit Event failed : ${error.message}`);
                    }
                }
                break;
            case 1:
                {
                    const user = await get_general_user();
                    try{
                        console.log(`Borrow Event`);
                        const collateral = await moneyMarket.getBorrowingPowerUSD(user);
                        const debt = await moneyMarket.getDebtValue(user);
                        if (collateral.lte(debt)) continue;
                        const max_borrow = collateral.sub(debt);
                        const fraction = Math.floor((Math.random() * (1 - 0.2) + 0.2) * 10000);
                        const amount = max_borrow.mul(new BN(fraction)).div(new BN(10000));
                        if (amount.isZero()) continue; // skip iteration if amount is zero
                        await sbToken.approve(moneyMarket.address, amount, { from: user });
                        await moneyMarket.borrow(amount, { from: user });
                        // console.log(`User ${user} borrowed ${amount.toString()}`);
                        
                    }
                    catch (error) {
                        console.log(`Borrow Event failed : ${error.message}`);
                        // console.log(`Borrow failed for user ${user}: ${error.message}`);
                    }
                }
                break;
            case 2:
                {
                    const user = await get_general_user(); 
                    try{
                        console.log(`Repay Event`);
                        const debt = await moneyMarket.getDebtValue(user);
                        const fraction = Math.floor((Math.random() * (1 - 0.2) + 0.2) * 10000);
                        const amount = debt.mul(new BN(fraction)).div(new BN(10000)); 
                        if (amount.isZero()) continue; // skip iteration if amount is zero
                        await moneyMarket.repay(amount, { from: user });
                        // console.log(`User ${user} repaid ${amount.toString()}`);
                        
                    }
                    catch (error) {
                        console.log(`Repay Event failed : ${error.message}`);
                        // console.log(`Deposit failed for user ${user}: ${error.message}`);
                    }
                }
                break;
            case 3:
                {
                    const liquidator = await get_liquidator();
                    try{
                         for (let j = 1; j <= 10; j++) {
                            const user = accounts[j];
                            const H = await moneyMarket.getHealthFactor(user);
                            if (H.lt(new BN(10000))) {
                                const amount = await sbToken.balanceOf(liquidator);
                                if (amount.isZero()) continue; // skip iteration if amount is zero
                                await sbToken.approve(moneyMarket.address, amount, { from: liquidator });
                                await moneyMarket.liquidate(user,amount, { from: liquidator });
                                break;
                            }
                        }
                        console.log(`Liquidation Event`);
                        // console.log(`Liquidator ${liquidator} performed liquidations`);
                    }
                    catch (error) {
                        console.log(`Liquidation Event failed : ${error.message}`);
                        // console.log(`Deposit failed for liquidator ${liquidator}: ${error.message}`);
                    }
                }
                break;
            case 4:
                {
                    try{
                        const currentPrice = await priceOracle.getAssetPrice(vlToken.address);
                        // console.log(`Current VLToken price: ${currentPrice.toString()}`);
                        const market_crash = Math.floor(Math.random() * 2);
                        if (market_crash) {
                            const fraction = Math.floor((Math.random() * (0.7 - 0.4) + 0.4) * 10000);
                            const new_price = currentPrice.mul(new BN(fraction)).div(new BN(10000));
                            await priceOracle.setAssetPrice(vlToken.address, new_price, { from: accounts[0] });
                            // console.log(`Market crash! New VLToken price: ${new_price.toString()}`);
                            console.log(`Market Crash Event`);
                        }
                        else {
                            const fraction = Math.floor((Math.random() * (0.5 - 0.1) + 0.1) * 10000);
                            const new_price = currentPrice.mul(new BN(fraction)).div(new BN(10000));
                            await priceOracle.setAssetPrice(vlToken.address, new_price, { from: accounts[0] });
                            // console.log(`Market Gain! New VLToken price: ${new_price.toString()}`);
                            console.log(`Market Gain Event`);
                        }
                    }
                    catch (error) {
                        console.log(`Market update was failed: ${error.message}`);
                    }
                }
                break;
        }
        }
    });
});
