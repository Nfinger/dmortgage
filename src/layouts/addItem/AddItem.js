import React, { Component } from 'react'
import NewItemFormContainer from '../../addProduct/NewItemFormContainer'

class AddItem extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return(
      <main className="container">
        <div className="pure-g">
          <div className="pure-u-1-1">
            <h1>Add your first item</h1>
            <NewItemFormContainer />
          </div>
        </div>
      </main>
    )
  }
}

export default AddItem
