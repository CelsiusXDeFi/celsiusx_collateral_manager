The Collateral Manager contract calculates the reserve quantity of ERC20 tokens and that quantities dollar denominated
values. It is dependant on `calculator` adapter contracts that are used for reporting these quantities which also
serve as an abstraction for the assets representing the collateral for the reserves. The reserves are meant to be read
by an oracle service like Chainlink for reporting proof of reserve, or by another contract native to the same chain
where the collateral is deployed.

# Collateral Manager

Manages sets of vaults. Each set is called a reserve and labeled with a unique `bytes32` identifier. Depending on the
adapter contracts used to define a vault the quantity reported back by the reserve will either be a token quantity
or dollar amount.

# Vault Calculator

Interface for the `calculator` adapter contracts provided with each `Vault`.

# Collateral V3 Aggregator

Oracle contract implementation compatible with the Chainlink Aggregator for when the collateral is on the same chain
as the Wrapped instance.

# Address Manager

Contract used to share addresses where reserves are held on different chains.

![](wrapped-architecture.jpeg "Wrapped Architecture")

![](stablecoin-architecture.jpeg "Stablecoin Architecture")

# Operations

The management of this contract requires some precautions by the operator in order to not confuse the way data is read. 
Specifically, making more than one call to `createReserve` if they end up in the same block will result in only one new
unique `reserveId`. This should not generally be a problem as expected values describing each reserve will most likely
be unique.

## Setup

```sh
npm ci
```

Because this contract relies on other contracts and platforms running on Ethereum you will want to fork a chain when
starting up Ganache, and run the test against that.

```sh
npx ganache-cli --fork https://kovan.infura.io/v3/${PROJECT_ID}
```

Now you will need to set some environment variables in your `.env` file. A set that works for Kovan are:

```sh
PROJECT_ID=<infura-api-key>
ETHERSCAN_API_KEY=<etherscan-api-key>

SHARES_HOLDER=0xc41BE0892D5062DE350EcFe858288f6A40A67dCf
TOKEN_VALUE_CALCULATOR=0xeAc8Aa139C68fc20813afE47171a1C5CBe9b3CF3
CURRENCY_VALUE_CALCULATOR=0xF7c62e4e86361BC71a99D20787E6c02ABc74dd00

UNI_TOKEN=0x86684577af5598b229a27c5774b658d303e2e044

LINK_TOKEN=0xd7f19f0d395e8c7d5368d74a81b774e2b822df25
WETH_TOKEN=0xd0A1E359811322d97991E03f863a0C30C2cF029C

UNI_PRICE_FEED=0xDA5904BdBfB4EF12a3955aEcA103F51dc87c7C39

LINK_PRICE_FEED=0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0
WETH_PRICE_FEED=0x9326BFA02ADD2366b30bacB125260Af641031331

UNI_VAULT=0x461b0699632d16f0ac4a8c035b9e7bc6936f9c33

LINK_VAULT=0xaed20fc87ed85a15b8a76c45f5cb8b7e11135660
WETH_VAULT=0xd4e11e18180d06ddd9aad0671ad0bd69d5ab9a60
```

```sh
npm run test
```

# Deploy and Verify

For deployment, have all required configuration needed for _truffle_ in a `.env` file at the root directory of the
project:

```
npm run migrate kovan
```
