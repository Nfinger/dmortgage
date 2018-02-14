import { connect } from 'react-redux'
import NewItemForm from './NewItemForm'
import { addProductToStore } from './NewItemFormAction'

const mapStateToProps = (state, ownProps) => {
  return {
    name: state.user.data.name
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onNewItemFormSubmit: (name, description, image, auctionStart, auctionEnd, price) => {
      dispatch(addProductToStore(name, description, image, auctionStart, auctionEnd, price))
    }
  }
}

const NewItemFormContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(NewItemForm)

export default NewItemFormContainer
