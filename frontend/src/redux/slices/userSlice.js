import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userName: null,
  isLoggedIn: false,
  amount: 0,
  stocks: [],
  transactionHistory: [],
  pendingBuy: null,
  pendingSell: null,
};

const userSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    setAllOwnedStocks: (state, action) => {
      state.stocks = action.payload;
    },

    setTransactionHistory: (state, action) => {
      state.transactionHistory = action.payload;
    },

    setLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
    setUserName: (state, action) => {
      state.userName = action.payload;
    },
    setAmount: (state, action) => {
      state.amount = action.payload;
    },
    setPendingBuy: (state, action) => {
      state.pendingBuy = action.payload;
    },

    setPendingSell: (state, action) => {
      state.pendingSell = action.payload;
    },
    logOut: (state) => {
      state.userName = null;
      state.isLoggedIn = false;
      state.amount = 0;
      state.stocks = [];
      state.pendingBuy = null;
      state.pendingSell = null;
    }
  },
});

export const {
  setAllOwnedStocks,
  setTransactionHistory,
  setLoggedIn,
  setUserName,
  setAmount,
  setPendingBuy,
  setPendingSell,
  logOut,
} = userSlice.actions;

export const selectUserData = (state) => state.userSlice;

export const selectPendingBuy = (state) => state.userSlice.pendingBuy;

export const selectPendingSell = (state) => state.userSlice.pendingSell;

export const selectTransactions = (state) => state.userSlice.transactionHistory;

export const selectOwnedStocks = (state) => state.userSlice.stocks;

export const selectSpecficOwnedStock = (state, ticker) => {
  return state.userSlice.stocks.find((stock) => stock.stock_name === ticker);
}

export default userSlice.reducer;
