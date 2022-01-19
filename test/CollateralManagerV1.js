const DotENV = require('dotenv');

const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers')
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const IFundValueCalculatorRouter = artifacts.require("IFundValueCalculatorRouter");
const IFundValueCalculatorUsdWrapper = artifacts.require("IFundValueCalculatorUsdWrapper");

const EnzymeTokenCalculatorCustom = artifacts.require("EnzymeTokenCalculatorCustom");
const EnzymeTokenCalculatorStandard = artifacts.require("EnzymeTokenCalculatorStandard");

const EnzymeCurrencyCalculatorCustom = artifacts.require("EnzymeCurrencyCalculatorCustom");
const EnzymeCurrencyCalculatorStandard = artifacts.require("EnzymeCurrencyCalculatorStandard");

const CollateralManagerV1 = artifacts.require("CollateralManagerV1");

const dotConfig = DotENV.config();

const tokenValueCalculator = dotConfig.parsed.TOKEN_VALUE_CALCULATOR;
const currencyValueCalculator = dotConfig.parsed.CURRENCY_VALUE_CALCULATOR;

const uniToken = dotConfig.parsed.UNI_TOKEN;

const linkToken = dotConfig.parsed.LINK_TOKEN;
const wethToken = dotConfig.parsed.WETH_TOKEN;

const uniPriceFeed = dotConfig.parsed.UNI_PRICE_FEED;

const linkPriceFeed = dotConfig.parsed.LINK_PRICE_FEED;
const wethPriceFeed = dotConfig.parsed.WETH_PRICE_FEED;

const uniVault = dotConfig.parsed.UNI_VAULT;

const linkVault = dotConfig.parsed.LINK_VAULT;
const wethVault = dotConfig.parsed.WETH_VAULT;

const sharesHolder = dotConfig.parsed.SHARES_HOLDER;

contract("CollateralManagerV1", function (accounts) {

    let collateralManagerInstance;
    let enzymeTokenCalculatorStandardInstance, enzymeTokenCalculatorCustomInstance, enzymeCurrencyCalculatorCustomInstance;

    let enzymeCurrencyCalculatorStandardUNIInstance, enzymeCurrencyCalculatorStandardLINKInstance;

    beforeEach(async () => {

        collateralManagerInstance = await deployProxy(CollateralManagerV1, [accounts[0]]);

        enzymeTokenCalculatorStandardInstance = await EnzymeTokenCalculatorStandard.new();

        enzymeTokenCalculatorCustomInstance = await EnzymeTokenCalculatorCustom.new(tokenValueCalculator, sharesHolder);
        enzymeCurrencyCalculatorCustomInstance = await EnzymeCurrencyCalculatorCustom.new(currencyValueCalculator, sharesHolder);

        enzymeCurrencyCalculatorStandardUNIInstance = await EnzymeCurrencyCalculatorStandard.new(uniPriceFeed);
        enzymeCurrencyCalculatorStandardLINKInstance = await EnzymeCurrencyCalculatorStandard.new(linkPriceFeed);
    });

    it("should add reserve and vault to the reserve with standard token calculator", async function () {

        let transaction;
        transaction = await collateralManagerInstance.createReserve("UNI-R01", "Wrapped token UNI reserve", 001);

        const reserveId = transaction.logs[0].args.reserveId;
        const uniCalculatorAddress = enzymeTokenCalculatorStandardInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, uniVault, uniCalculatorAddress, 1, 1);
        const tokenReserveValue = await collateralManagerInstance.getReserveValue.call(reserveId);

        console.log(` * Denomination value: ${tokenReserveValue.toString(10)}`);

        assert.isFalse(tokenReserveValue.isZero());
    });

    it("should add reserve and vault to the reserve with custom token calculator", async function () {

        let BN = web3.utils.BN;
        const fundValueCalculatorRouterInstance = await IFundValueCalculatorRouter.at(tokenValueCalculator);

        let transaction;
        transaction = await collateralManagerInstance.createReserve("UNI-R01", "Wrapped token UNI reserve", 001);

        const reserveId = transaction.logs[0].args.reserveId;
        const uniCalculatorAddress = enzymeTokenCalculatorCustomInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, uniVault, uniCalculatorAddress, 1, 1);
        const tokenReserveValue = await collateralManagerInstance.getReserveValue.call(reserveId);

        console.log(` * Denomination value: ${tokenReserveValue.toString(10)}`);

        // const result = await fundValueCalculatorRouterInstance.calcGav.call(uniVault);
        const netValue = await fundValueCalculatorRouterInstance.calcNetValueForSharesHolderInAsset.call(uniVault, sharesHolder, uniToken);

        assert.isFalse(tokenReserveValue.isZero());
        assert.isTrue(tokenReserveValue.eq(netValue.mul(new BN(1)).div(new BN(1))));
    });

    it("should add reserve and multiple vaults to the reserve with standard currency calculators", async function () {

        let transaction, vault;
        transaction = await collateralManagerInstance.createReserve("cxUSD-R01", "Stablecoin collateral reserve", 001);

        const reserveId = transaction.logs[0].args.reserveId;
        const uniCalculatorAddress = enzymeCurrencyCalculatorStandardUNIInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, uniVault, uniCalculatorAddress, 3, 4);
        const linkCalculatorAddress = enzymeCurrencyCalculatorStandardLINKInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, linkVault, linkCalculatorAddress, 2, 3);
        const usdReserveValue = await collateralManagerInstance.getReserveValue.call(reserveId);

        console.log(` * USD value: ${usdReserveValue.toString(10)}`);

        assert.isFalse(usdReserveValue.isZero());
    });

    it("should add reserve and multiple vaults to the reserve with custom currency calculator", async function () {

        let BN = web3.utils.BN;
        const fundValueCalculatorUsdWrapperInstance = await IFundValueCalculatorUsdWrapper.at(currencyValueCalculator);

        let transaction, vault;
        transaction = await collateralManagerInstance.createReserve("cxUSD-R01", "Stablecoin collateral reserve", 001);

        const reserveId = transaction.logs[0].args.reserveId;
        const uniCalculatorAddress = enzymeCurrencyCalculatorCustomInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, uniVault, uniCalculatorAddress, 3, 4);
        const linkCalculatorAddress = enzymeCurrencyCalculatorCustomInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, linkVault, linkCalculatorAddress, 2, 3);
        const usdReserveValue = await collateralManagerInstance.getReserveValue.call(reserveId);

        console.log(` * USD value: ${usdReserveValue.toString(10)}`);

        // const uniGav = await fundValueCalculatorUsdWrapperInstance.calcGav.call(uniVault);
        // const linkGav = await fundValueCalculatorUsdWrapperInstance.calcGav.call(linkVault);

        const uniGav = await fundValueCalculatorUsdWrapperInstance.calcNetValueForSharesHolder.call(uniVault, sharesHolder);
        const linkGav = await fundValueCalculatorUsdWrapperInstance.calcNetValueForSharesHolder.call(linkVault, sharesHolder);

        // const decimals = (new BN(10)).pow(new BN(18));
        const uniValue = uniGav.mul(new BN(3)).div(new BN(4));
        const linkValue = linkGav.mul(new BN(2)).div(new BN(3));

        assert.isFalse(usdReserveValue.isZero());
        assert.isTrue(usdReserveValue.eq(uniValue.add(linkValue)));
    });

    it("should fail adding vault without deployed token calculator", async function () {

        let transaction;
        transaction = await collateralManagerInstance.createReserve("UNI-R01", "Wrapped token UNI reserve", 001);

        const reserveId = transaction.logs[0].args.reserveId;
        const invalidCalculatorAddress = '0x0000000000000000000000000000000000000000';

        await expectRevert.unspecified(collateralManagerInstance.addReserveVault(reserveId, uniVault, invalidCalculatorAddress, 1, 1));
    });

    it("should delete a reserve", async function () {

        let transaction, tokenReserveValue;
        transaction = await collateralManagerInstance.createReserve("UNI-R01", "Wrapped token UNI reserve", 001);

        const reserveId = transaction.logs[0].args.reserveId;
        const uniCalculatorAddress = enzymeTokenCalculatorCustomInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, uniVault, uniCalculatorAddress, 1, 1);
        tokenReserveValue = await collateralManagerInstance.getReserveValue.call(reserveId);

        console.log(` * Denomination value: ${tokenReserveValue.toString(10)}`);

        assert.isFalse(tokenReserveValue.isZero());
        await expectRevert(collateralManagerInstance.deleteReserve('0x6910292032fa0f670d6402c9848305796576cb70a1579651576a18e2f0eacf22'), 'no reserve available');

        assert.isFalse('0x0000' === (await collateralManagerInstance.vaultsMap(uniVault)).substr(0, 6), "recorded vault should have been added");

        await collateralManagerInstance.deleteReserve(reserveId);
        tokenReserveValue = await collateralManagerInstance.getReserveValue.call(reserveId);

        console.log(` * Denomination value: ${tokenReserveValue.toString(10)}`);

        assert.isTrue(tokenReserveValue.isZero());
        assert.isTrue('0x0000' === (await collateralManagerInstance.vaultsMap(uniVault)).substr(0, 6), "recorded vault should have been removed");
    });

    it("should fail removing nonexistent reserve", async function () {
        await expectRevert(collateralManagerInstance.deleteReserve('0x6910292032fa0f670d6402c9848305796576cb70a1579651576a18e2f0eacf22'), 'no reserve available');
    });

    it("should remove vault from a reserve", async function () {

        let vault, transaction, usdReserveValue;
        transaction = await collateralManagerInstance.createReserve("cxUSD-R01", "Stablecoin collateral reserve", 001);

        const reserveId = transaction.logs[0].args.reserveId;
        const uniCalculatorAddress = enzymeCurrencyCalculatorStandardUNIInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, uniVault, uniCalculatorAddress, 3, 4);
        const linkCalculatorAddress = enzymeCurrencyCalculatorStandardLINKInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, linkVault, linkCalculatorAddress, 2, 3);
        usdReserveValue = await collateralManagerInstance.getReserveValue.call(reserveId);

        console.log(` * USD value: ${usdReserveValue.toString(10)}`);

        assert.isFalse(usdReserveValue.isZero());

        const fullValue = usdReserveValue;
        await expectRevert(collateralManagerInstance.removeReserveVault(reserveId, 2), 'vault index out of range');

        await collateralManagerInstance.removeReserveVault(reserveId, 0);
        usdReserveValue = await collateralManagerInstance.getReserveValue.call(reserveId);

        console.log(` * USD value: ${usdReserveValue.toString(10)}`);

        assert.isFalse(usdReserveValue.isZero());
        assert.isTrue(usdReserveValue.lt(fullValue), 'total reserve should be less when vault is removed');
    });

    it("should check against empty inputs", async function () {

        let transaction;
        transaction = await collateralManagerInstance.createReserve("UNI-R01", "Wrapped token UNI reserve", 001);

        const reserveId = transaction.logs[0].args.reserveId;
        const uniCalculatorAddress = enzymeTokenCalculatorStandardInstance.address;

        await collateralManagerInstance.addReserveVault(reserveId, uniVault, uniCalculatorAddress, 1, 1);
        const tokenReserveValue = await collateralManagerInstance.getReserveValue.call(reserveId);

        console.log(` * Denomination value: ${tokenReserveValue.toString(10)}`);

        assert.isFalse(tokenReserveValue.isZero());
    });
});
