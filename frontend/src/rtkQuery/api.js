import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

export const transactionServerApi = createApi({
    reducerPath: 'transactionServerApi',
    baseQuery: fetchBaseQuery({baseUrl: 'http://localhost:5001/api',  prepareHeaders: (headers) => {
    },}),
    endpoints: (builder) => ({
        getQuote: builder.query({
            query: (userId, ticker) => `QUOTE?userId=${userId}&stockSymbol=${ticker}`,
        }),
        getStocks: builder.query({
            query: (userId) => `STOCKS?userId=${userId}`,
        }),
    }),
})

export const {useGetQuoteQuery, useGetStocksQuery} = transactionServerApi