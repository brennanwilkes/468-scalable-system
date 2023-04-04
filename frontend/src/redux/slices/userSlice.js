import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  userName: null,
  isLoggedIn: false,
  amount: 0,
  stocks: [],
  pendingBuy: null,
  pendingSell: null,
}

const userSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    setAllOwnedStocks: (state, action) => {
      state.stocks = action.payload
    },

    setLoggedIn: (state, action) => {
        state.isLoggedIn = action.payload
        },
    setUserName: (state, action) => {
        state.userName = action.payload
        },
    setAmount: (state, action) => {
        state.amount = action.payload
        },
    setPendingBuy: (state, action) => {
        state.pendingBuy = action.payload
        }

  },
})

export const { setAllOwnedStocks, setLoggedIn, setUserName, setAmount, setPendingBuy } = userSlice.actions

export const selectUserData = (state) => state.userSlice

export const selectPendingBuy = (state) => state.userSlice.pendingBuy

export default userSlice.reducer
