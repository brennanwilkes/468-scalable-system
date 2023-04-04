import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  stocks: [],
}

const stockSlice = createSlice({
  name: "stockSlice",
  initialState,
  reducers: {
    setAllStocks: (state, action) => {
      state.stocks = action.payload
    },
    setOneStock: (state, action) => {
      const tempStock = state.stocks.findIndex((stock) => stock.stockSymbol === action.payload.stockSymbol)
      if(tempStock === -1) {
        if(action.payload.stockSymbol != "") {
            state.stocks.push(action.payload)
        }
      } else {
        state.stocks[tempStock] = action.payload
      }
    },
  },
})

export const { setAllStocks, setOneStock } = stockSlice.actions

export const selectStocks = (state) => {
    return state.stockSlice.stocks
}

export const selectStock = (state, stockSymbol) => {
  console.log(state)
  console.log(stockSymbol)
    return state.stockSlice.stocks.find((stock) => stock.stockSymbol === stockSymbol)
}

export default stockSlice.reducer
