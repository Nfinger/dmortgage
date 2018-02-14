import MortgageStoreContract from '../../../build/contracts/MortgageStore.json'
import {
    browserHistory
} from 'react-router'
import store from '../../store'

const contract = require('truffle-contract')

export function getProductDetails(productId) {
    let web3 = store.getState().web3.web3Instance

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
                    
                }).then((result) => {
                    // Get the value from the contract to prove it worked.
                    return MortgageStoreInstance.getProduct.call(1);
                }).then((result) => {
                });
            })
        }
    } else {
        console.error('Web3 is not initialized.');
    }
}