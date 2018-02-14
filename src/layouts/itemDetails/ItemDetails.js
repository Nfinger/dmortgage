import React, { Component } from 'react'
// import { Link } from 'react-router'
import Web3 from 'web3'
import MortgageStoreContract from '../../../build/contracts/MortgageStore.json'
import { setTimeout } from 'timers';

const ipfsAPI = require('ipfs-api')
const ethUtil = require('ethereumjs-util')
const contract = require('truffle-contract')

const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});


class ItemDetails extends Component {

    constructor(match) {
        super()
        var web3 = window.web3
        web3 = new Web3(web3.currentProvider)
        const MortgageStore = contract(MortgageStoreContract)
        MortgageStore.setProvider(web3.currentProvider)
        this.state = {
            name: '',
            desc: '',
            imgLink: '',
            auctionStart: '',
            auctionEnd: '',
            price: '',
            status: 0,
            bid: 0,
            sendAmount: 0,
            secretText: '',
            totalBids: 0,
            submited: false,
            message: '',
            web3,
            MortgageStore
        }
        this.getProduct(match.params.id)
        this.submitBid = this.submitBid.bind(this)
        this.revealBid = this.revealBid.bind(this)
    }

    getProduct(id) {
        // Declaring this for later so we can chain functions on MortgageStore.
        var MortgageStoreInstance

        this.state.MortgageStore.deployed().then((instance) => {
            MortgageStoreInstance = instance
            
        }).then((result) => {
            // Get the value from the contract to prove it worked.
            return MortgageStoreInstance.getProduct.call(id);
        }).then((result) => {
            console.log(result)
            let content = "";
            const stream = ipfs.files.catReadableStream(result[3])
            stream.on('data', (chunk) => {
                // do stuff with this chunk of data
                content += chunk.toString();
                this.setState({desc: content})
            })
            this.setState({
                id: parseInt(result[0].toLocaleString),
                name: result[1],
                imgLink: result[2],
                auctionStart: result[4],
                auctionEnd: result[5],
                price: result[6],
                status: parseInt(result[7].toLocaleString)
            });
            return MortgageStoreInstance.totalBids.call(id);
        }).then((totalBids) => {
            this.setState({totalBids: totalBids.c[0]})
        });
    }

    displayPrice(amt) {
        return 'Ξ' + this.state.web3.fromWei(amt, 'ether');
    }

    getCurrentTimeInSeconds(){
        return Math.round(new Date() / 1000);
    }

    displayEndHours(seconds) {
        let current_time = this.getCurrentTimeInSeconds()
        let remaining_seconds = seconds - current_time;

        if (remaining_seconds <= 0) {
            return "Auction has ended";
        }

        let days = Math.trunc(remaining_seconds / (24*60*60));

        remaining_seconds -= days*24*60*60
        let hours = Math.trunc(remaining_seconds / (60*60));

        remaining_seconds -= hours*60*60

        let minutes = Math.trunc(remaining_seconds / 60);

        if (days > 0) {
            return "Auction ends in " + days + " days, " + hours + ", hours, " + minutes + " minutes";
        } else if (hours > 0) {
            return "Auction ends in " + hours + " hours, " + minutes + " minutes ";
        } else if (minutes > 0) {
            return "Auction ends in " + minutes + " minutes ";
        } else {
            return "Auction ends in " + remaining_seconds + " seconds";
        }
    }

    submitBid(event) {
        const self = this;
        event.preventDefault()
        let amount = this.state.bid
        let sendAmount = this.state.sendAmount
        let secretText = this.state.secretText
        let sealedBid = '0x' + ethUtil.sha3(this.state.web3.toWei(amount, 'ether') + secretText).toString('hex');
        console.log(sealedBid + " for " + this.state.id);

        this.state.MortgageStore.deployed().then((i) => {
            i.bid(this.state.id, sealedBid, {value: this.state.web3.toWei(sendAmount), from: this.state.web3.eth.accounts[0], gas: 440000}).then(
                (f) => {
                    this.setState({submited: true, message: 'Your bid has been successfully submitted!'});
                    this.state.MortgageStore.totalBids.call(this.state.id).then(totalBids => this.setState({totalBids}))
                    setTimeout(() => {
                        this.props.router.push('/')
                    }, 2000)
                }
            )
        });
    };

    revealBid(event) {
        event.preventDefault();
        let amount = this.state.bid
        let secretText = this.state.secretText
        let productId = this.state.id
        this.state.MortgageStore.deployed().then((i) => {
            i.revealBid(this.state.id, this.state.web3.toWei(amount).toString(), secretText, {from: this.state.web3.eth.accounts[0], gas: 440000}).then((f) => {
                // $("#msg").show();
                // $("#msg").html("Your bid has been successfully revealed!");
                console.log(f)
            })
        });
    }

    finalizeAuction(event) {
        this.state.MortgageStore.deployed().then((i) =>{
            i.finalizeAuction(this.state.id, {from: this.state.web3.eth.accounts[2], gas: 4400000}).then((f) =>{
                this.setState({submited: true, message: "The auction has been finalized and winner declared."});
                console.log(f)
                location.reload();
            }).catch((e) => {
                console.log(e);
                this.setState({submited: true, message: "The auction can not be finalized by the buyer or seller, only a third party aribiter can finalize it"});
            })
        });
        event.preventDefault();
    }

    releaseFunds() {
        let productId = new URLSearchParams(window.location.search).get('id');
        this.state.MortgageStore.deployed().then((f) => {
            this.setState({submited: true, message: "Your transaction has been submitted. Please wait for few seconds for the confirmation"});
            console.log(productId);
            f.releaseAmountToSeller(productId, {from: this.state.web3.eth.accounts[0], gas: 440000}).then((f) => {
                console.log(f);
                location.reload();
            }).catch((e) => {
                console.log(e);
            })
        });
    }
     
    refundFunds() {
        let productId = new URLSearchParams(window.location.search).get('id');
        this.state.MortgageStore.deployed().then((f) => {
            this.setState({submited: true, message: "Your transaction has been submitted. Please wait for few seconds for the confirmation"});
            f.refundAmountToBuyer(productId, {from: this.state.web3.eth.accounts[0], gas: 440000}).then((f) => {
                console.log(f);
                location.reload();
            }).catch((e) => {
                console.log(e);
            })
        });

        alert("refund the funds!");
    }

    // getEscrowInfo() {
    //     this.state.MortgageStore.deployed().then((i) => {
    //         i.highestBidderInfo.call(productId).then((f) => {
    //             if (f[2].toLocaleString() == '0') {
    //                 "Auction has ended. No bids were revealed"
    //             } else {
    //                 "Auction has ended. Product sold to " + f[0] + " for " + displayPrice(f[2]) +
    //                 "The money is in the escrow. Two of the three participants (Buyer, Seller and Arbiter) have to " +
    //                 "either release the funds to seller or refund the money to the buyer"
    //             }
    //         })
    //         i.escrowInfo.call(productId).then((f) => {
    //             $("#buyer").html('Buyer: ' + f[0]);
    //             $("#seller").html('Seller: ' + f[1]);
    //             $("#arbiter").html('Arbiter: ' + f[2]);
    //             if(f[3] == true) {
    //                 $("#release-count").html("Amount from the escrow has been released");
    //             } else {
    //                 $("#release-count").html(f[4] + " of 3 participants have agreed to release funds");
    //                 $("#refund-count").html(f[5] + " of 3 participants have agreed to refund the buyer");
    //             }
    //         })
    //     })
    // }

    getCurrentTimeInSeconds(){
        return Math.round(new Date() / 1000);
    }

    render() {
        const self = this;
        const textStyle = {"textDecoration": 'underline', 'display': 'flex', 'justifyContent': 'center'}
        let currentTime = this.getCurrentTimeInSeconds();
        return(
            <main className="container">
                {this.state.submited ? <div className="alert alert-success" id="msg">{this.state.message}</div> : null}
                <h1 style={textStyle}>Heres the item!</h1>
                <div className="product-container">
                    <div>
                        <img src={`https://ipfs.io/ipfs/${this.state.imgLink}`} width='250px' />
                        <div>{this.state.name}</div>
                        <div>{this.state.desc}</div>
                        <div>{this.displayEndHours(this.state.auctionEnd)}</div>
                        <h3>Start Price: <span>{this.displayPrice(this.state.price)}</span></h3>
                        <h4>Total Bids: <span>{this.state.totalBids}</span></h4>
                    </div>
                    <div>
                        {function() {
                            if (self.state.status == 1) {
                                return (<div id="product-status">
                                    <div id="escrow-info">
                                        <div id="buyer"></div>
                                        <div id="seller"></div>
                                        <div id="arbiter"></div>
                                        <div id="release-count"></div>
                                        <div id="refund-count"></div>
                                        <a id="release-funds" class="btn form-submit">Release Amount to Seller</a>
                                        <a id="refund-funds" class="btn form-submit">Refund Amount to Buyer</a>
                                    </div>
                                    <form id="finalize-auction" class="col-sm-6">
                                        <input type="hidden" name="product-id" id="product-id" />
                                        <button type="submit" class="btn form-submit">Finalize Auction</button>
                                    </form>
                                </div>)
                            } else if (self.state.status == 2) {
                                return (<h1>Product was not sold</h1>)
                            } else if (currentTime < parseInt(self.state.auctionEnd)) {
                                return (<form id="bidding" onSubmit={self.submitBid}>
                                    <h4>Your Bid</h4>
                                    <div className="form-group">
                                        <label htmlFor="bid-amount">Enter Bid Amount</label>
                                        <input type="text" className="form-control" name="bid-amount" id="bid-amount" placeholder="Amount > Start Price" onChange={evt => self.setState({bid: evt.target.value})} required="required"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="bid-send-amount">Enter Amount To Send</label>
                                        <input type="text" className="form-control" name="bid-send-amount" id="bid-send-amount" placeholder="Amount >= Bid Amount" onChange={evt => self.setState({sendAmount: evt.target.value})} required="required"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="secret-text">Enter Secret Text</label>
                                        <input type="text" className="form-control" name="secret-text" id="secret-text" placeholder="Any random text" onChange={evt => self.setState({secretText: evt.target.value})} required="required"/>
                                    </div>
                                    <input type="hidden" name="product-id" id="product-id" />
                                    <button type="submit" className="btn btn-primary">Submit Bid</button>
                                </form>)
                            } else if (currentTime < (self.state.auctionEnd + 600)) {
                                return (<form id="revealing" onSubmit={self.revealBid}>
                                <h4>Reveal Bid</h4>
                                <div className="form-group">
                                    <label htmlFor="actual-amount">Amount You Bid</label>
                                    <input type="text" className="form-control" name="actual-amount" id="actual-amount" placeholder="Amount > Start Price" onChange={evt => self.setState({bid: evt.target.value})} required="required"/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="reveal-secret-text">Enter Secret Text</label>
                                    <input type="text" className="form-control" name="reveal-secret-text" id="reveal-secret-text" placeholder="Any random text" onChange={evt => self.setState({secretText: evt.target.value})} required="required"/>
                                </div>
                                <input type="hidden" name="product-id" id="product-id" />
                                <button type="submit" className="btn btn-primary">Reveal Bid</button>
                            </form>)
                            } 
                        }()}
                    </div>
                </div>
            </main>
        )
    }
}

export default ItemDetails
