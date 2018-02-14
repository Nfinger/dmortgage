import MortgageStoreContract from '../../build/contracts/MortgageStore.json'
import store from '../store'

const contract = require('truffle-contract')


export function addProductToStore(name, descLink, imageLink, auctionStartTime, auctionEndTime, price) {
    let web3 = store.getState().web3.web3Instance

    // Double-check web3's status.
    if (typeof web3 !== 'undefined') {

        return function (dispatch) {
            const MortgageStore = contract(MortgageStoreContract)
            MortgageStore.setProvider(web3.currentProvider)

            // Declaring this for later so we can chain functions on MortgageStore.
            var MortgageStoreInstance

            // Get accounts.
            web3.eth.getAccounts((error, accounts) => {
                MortgageStore.deployed().then((instance) => {
                    MortgageStoreInstance = instance
                    const _startPrice = web3.toWei(price);
                    return MortgageStoreInstance.addProductToStore(name, imageLink, descLink, auctionStartTime, auctionEndTime, _startPrice, {
                        from: accounts[0],
                        gas: 440000
                    })
                }).then((result) => {
                    // Get the value from the contract to prove it worked.
                    return MortgageStoreInstance.getProduct.call(1);
                }).then((result) => {
                    // Update state with the result.
                    console.log(result)
                })
            })
        }
    } else {
        console.error('Web3 is not initialized.');
    }
}