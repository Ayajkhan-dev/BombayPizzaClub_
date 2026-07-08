import { createSlice, current } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    itemsInMyCity: null,
    cartItems: [],
    totalAmount: 0,
    myOrders: [],
    searchItems: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload
    },
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload
    },
    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload
    },
    addToCart: (state, action) => {
      const cartItem = action.payload
      const existingItem = state.cartItems.find(i => i.id == cartItem.id)
      if (existingItem) {
        existingItem.quantity += cartItem.quantity
      } else {
        state.cartItems.push(cartItem)
      }

      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

    },

    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload
    }

    ,

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.cartItems.find(i => i.id == id)
      if (item) {
        item.quantity = quantity
      }
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    },

    removeCartItem: (state, action) => {
      state.cartItems = state.cartItems.filter(i => i.id !== action.payload)
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    },

    // NEW: Order place hone ke baad cart poori tarah khaali karne ke liye
    clearCart: (state) => {
      state.cartItems = []
      state.totalAmount = 0
    },

    setMyOrders: (state, action) => {
      state.myOrders = action.payload
    },
    addMyOrder: (state, action) => {
      state.myOrders = [action.payload, ...state.myOrders]
    },
    updateOrderStatus: (state, action) => {
      const { orderId, ownerId, status } = action.payload
      const order = state.myOrders.find(o => o._id == orderId)
      if (order) {
        if (Array.isArray(order.shopOrders)) {
          const shopOrder = order.shopOrders.find(so => (so.owner?._id || so.owner) == ownerId)
          if (shopOrder) shopOrder.status = status
        } else if (order.shopOrders && (order.shopOrders.owner?._id || order.shopOrders.owner) == ownerId) {
          order.shopOrders.status = status
        }
      }
    },

    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, ownerId, status } = action.payload
      const order = state.myOrders.find(o => o._id == orderId)
      if (order) {
        if (Array.isArray(order.shopOrders)) {
          const shopOrder = order.shopOrders.find(so => (so.owner?._id || so.owner) == ownerId)
          if (shopOrder) shopOrder.status = status
        } else if (order.shopOrders && (order.shopOrders.owner?._id || order.shopOrders.owner) == ownerId) {
          order.shopOrders.status = status
        }
      }
    },

    setSearchItems: (state, action) => {
      state.searchItems = action.payload
    }
  }
})

export const { setUserData, setCurrentAddress, setCurrentCity, setCurrentState, setItemsInMyCity, addToCart, updateQuantity, removeCartItem, clearCart, setMyOrders, addMyOrder, updateOrderStatus, setSearchItems, setTotalAmount, updateRealtimeOrderStatus } = userSlice.actions
export default userSlice.reducer