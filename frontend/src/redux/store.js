import { configureStore } from '@reduxjs/toolkit'
// Or from '@reduxjs/toolkit/query/react'
import { setupListeners } from '@reduxjs/toolkit/query'
import { transactionServerApi } from '../rtkQuery/api'
import stockSlice from './slices/stockSlice'
import userSlice from './slices/userSlice'
import { loadState, saveState } from './storePersist'

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [transactionServerApi.reducerPath]: transactionServerApi.reducer,
    stockSlice: stockSlice,
    userSlice: userSlice,

  },

  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(transactionServerApi.middleware),
  
  preloadedState: loadState(),
},)

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch)

store.subscribe(() => {
  saveState(store.getState())
})