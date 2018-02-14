import React, { Component } from 'react'
import Dropzone from 'react-dropzone'

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});

class ItemForm extends Component {
  constructor(props) {
    super(props)

    this.state = {
      name: "",
      description: this.props.description,
      price: this.props.price,
      reader: new window.FileReader(),
      auctionStart: new Date(),
      auctionEnd: 1,
      files: []
    }
  }

  onInputChange(event) {
    if (event.target.id === "name") {
      this.setState({ name: event.target.value })
    } else if (event.target.id === "description") {
      this.setState({ description: event.target.value })
    } else if (event.target.id === "price") {
      this.setState({ price: event.target.value })
    } else if (event.target.id === "product-auction-start") {
      this.setState({ auctionStart: event.target.value })
    } else if (event.target.id === "product-auction-end") {
      this.setState({ auctionEnd: event.target.value })
    }
  }

  onDrop(acceptedFiles) {
    this.setState({
      files: acceptedFiles
    });

    acceptedFiles.forEach(file => {
      this.state.reader.readAsArrayBuffer(file);
    });
  }

  saveImageOnIpfs(reader) {
    const self = this;
    return new Promise(function(resolve, reject) {
      const buffer = Buffer.from(self.state.reader.result);
      ipfs.add(buffer)
        .then((response) => {
          resolve(response[0].hash);
        }).catch((err) => {
          console.error(err)
          reject(err);
        })
    })
  }

  saveTextBlobOnIpfs(blob) {
    return new Promise(function(resolve, reject) {
     const descBuffer = Buffer.from(blob, 'utf-8');
     ipfs.add(descBuffer)
     .then((response) => {
      resolve(response[0].hash);
     }).catch((err) => {
      console.error(err)
      reject(err);
     })
    })
  }

  handleSubmit(event) {
    event.preventDefault()

    if (this.state.name.length < 2)
    {
      return alert('Please fill in your name.')
    }
    
    let imageId, descId;
    this.saveImageOnIpfs(this.state.reader).then((id) => {
      imageId = id;
      this.saveTextBlobOnIpfs(this.state.description).then((id) => {
        descId = id;
        let auctionStartTime = Date.parse(this.state.auctionStart) / 1000;
        let auctionEndTime = auctionStartTime + parseInt(this.state.auctionEnd) * 24 * 60 * 60
        this.props.onNewItemFormSubmit(this.state.name, descId, imageId, auctionStartTime, auctionEndTime, this.state.price)
      })
    }).catch(err => console.log(err));
  }

  render() {
    return(
      <form className="pure-form pure-form-stacked" onSubmit={this.handleSubmit.bind(this)}>
        <fieldset>
            <label htmlFor="name">Name</label>
            <input id="name" type="text" value={this.state.name} onChange={this.onInputChange.bind(this)} placeholder="Name" />
            <span className="pure-form-message">This is a required field.</span>
        
            <br />

            <label htmlFor="description">Description</label>
            <input id="description" type="text" value={this.state.description} onChange={this.onInputChange.bind(this)} placeholder="Description" />
            <span className="pure-form-message">This is a required field.</span>
        
            <br />

            <Dropzone onDrop={this.onDrop.bind(this)}>
              <p>Try dropping some files here, or click to select files to upload.</p>
            </Dropzone>
            <aside>
              <h2>Dropped files</h2>
              <ul>
                {

                  this.state.files.map(f => <img role="presentation" key={f.name} src={f.preview} />)
                }
              </ul>
            </aside>

            <br />

            <label htmlFor="price">Start Price</label>
            <input id="price" type="text" value={this.state.price} onChange={this.onInputChange.bind(this)} placeholder="Starting Price" />
            <span className="pure-form-message">This is a required field.</span>
        
            <br />

            <div>
              <label className="col-sm-2 control-label">Auction Start Time</label>
              <div className="col-sm-10">
              <input type="datetime-local" name="product-auction-start" id="product-auction-start" value={this.state.auctionStart} onChange={this.onInputChange.bind(this)}></input>
              </div>
            </div>
            <div>
              <label className="col-sm-2 control-label">Days to run the auction</label>
              <div className="col-sm-10">
              <select name="product-auction-end" id="product-auction-end" value={this.state.auctionEnd} onChange={this.onInputChange.bind(this)}>
                <option>1</option>
                <option>3</option>
                <option>5</option>
                <option>7</option>
                <option>10</option>
              </select>
              </div>
            </div>

            <button type="submit" className="pure-button pure-button-primary">Add Item</button>
        </fieldset>
      </form>
    )
  }
}

export default ItemForm
