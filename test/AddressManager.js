// FIXME: Use a package like truffle-assertions when asserting for reverts

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const AddressManager = artifacts.require("AddressManager");

contract("AddressManager", (accounts) => {
    let instance;
    const MAX_UINT_8 = 255

    beforeEach(async () => {
        instance = await deployProxy(AddressManager, [accounts[0]]);
    });

    describe('#networkName()', () => {
        it('should return all network names', async () => {
            let result
            result = await instance.networkName(0)
            expect(result).to.equal('Cardano Testnet')
            result = await instance.networkName(1)
            expect(result).to.equal('Doge Testnet')
            result = await instance.networkName(2)
            expect(result).to.equal('Cardano Mainnet')
            result = await instance.networkName(3)
            expect(result).to.equal('Doge Mainnet')
        })

        it('should revert when an invalid network index is used', async () => {
            try {
                await instance.networkName(4)
            } catch (e) {
                expect(e.message).to.match(/VM Exception/)
            }
        })
    })

    describe('#addWalletAddress()', () => {
        it("should add a network's wallet address", async () => {
            await instance.addWalletAddress(0, 'addr1')

            const address = await instance.walletAddressesMap(0, 0)
            const addresses = await instance.walletAddresses(0)
            expect(address).to.equal('addr1')
            expect(addresses).to.have.lengthOf(1)
        })

        it('should revert when an invalid network index is used', async () => {
            try {
                await instance.addWalletAddress(MAX_UINT_8, 'addr1')
            } catch (e) {
                expect(e.message).to.match(/VM Exception/)
            }
        })
    })

    describe('#removeWalletAddress()', () => {
        const NETWORK = 0

        beforeEach(async () => {
            await instance.addWalletAddress(NETWORK, 'addr1')
        })

        it("should remove a network's wallet address", async () => {
            let addresses
            addresses = await instance.walletAddresses(0)
            expect(addresses).to.have.lengthOf(1)

            await instance.removeWalletAddress(NETWORK, 0)

            addresses = await instance.walletAddresses(0)
            expect(addresses).to.have.lengthOf(0)
        })

        it('should revert when a non-existent wallet address is removed', async () => {
            try {
                await instance.removeWalletAddress(NETWORK, 1)
            } catch (e) {
                expect(e.message).to.match(/invalid address item/)
            }
        })

        it('should revert when an invalid network index is used', async () => {
            try {
                await instance.removeWalletAddress(MAX_UINT_8, 0)
            } catch (e) {
                expect(e.message).to.match(/VM Exception/)
            }
        })
    })

    describe('#walletAddresses()', () => {
        const NETWORK = 0

        beforeEach(async () => {
            await instance.addWalletAddress(NETWORK, 'addr1')
            await instance.addWalletAddress(NETWORK, 'addr2')
        })

        it("should return the Network's wallet addresses", async () => {
            const addresses = await instance.walletAddresses(0)
            expect(addresses).to.deep.equal(['addr1', 'addr2'])
        })

        it('should revert when an invalid network index is used', async () => {
            try {
                await instance.removeWalletAddress(MAX_UINT_8, 0)
            } catch (e) {
                expect(e.message).to.match(/VM Exception/)
            }
        })
    })
});
