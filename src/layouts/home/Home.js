import React, { Component } from 'react'
import { Link } from 'react-router'
import axios from 'axios'
const ipfsAPI = require('ipfs-api')

const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});

class Home extends Component {

  constructor(props) {
    super(props)
    this.state = {
      items: []
    }
    axios.get('http://localhost:4000/products')
      .then((res) => {
        res.data.map((item) => {ipfs.files.get(item.ipfsDescHash).then((res) => { item.content = res.data})})
        this.setState({items: res.data})
      })
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
          return "Auction ends in " + days + " days";
      } else if (hours > 0) {
          return "Auction ends in " + hours + " hours, " + minutes + " minutes ";
      } else if (minutes > 0) {
          return "Auction ends in " + minutes + " minutes ";
      } else {
          return "Auction ends in " + remaining_seconds + " seconds";
      }
  }

  render() {
    return(
      <main className="container">
        <h1>Welcome to the store!</h1>
        <div className="list-container">
          {this.state.items.map((item, i) => {
            return (<Link to={`/item/${item.blockchainId}`} className="pure-menu-link" key={i}>
              <img src={`https://ipfs.io/ipfs/${item.ipfsImageHash}`} width='200px' height='200px'></img>
              <div>{item.name}</div>
              <div>{this.displayEndHours(item.auctionEndTime)}</div>
            </Link>)
          })}
        </div>
      </main>
    )
  }
}

export default Home
