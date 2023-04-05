import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const transactionServerApi = createApi({
  reducerPath: "transactionServerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5001/api",
    prepareHeaders: (headers) => {},
  }),
  endpoints: (builder) => ({
    getQuote: builder.query({
      query: ({ userId, ticker }) =>
        `QUOTE?userId=${userId}&stockSymbol=${ticker}`,
    }),
    getStocks: builder.query({
      query: (userId) => `STOCKS?userId=${userId}`,
    }),
    createAccount: builder.mutation({
      query: (body) => ({ url: "CREATE_ACCOUNT", method: "POST", body: body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: "LOGIN", method: "POST", body: body }),
    }),
    add: builder.mutation({
      query: (body) => ({ url: "ADD", method: "POST", body: body }),
    }),
    getDisplaySummary: builder.query({
      query: (userId) => `DISPLAY_SUMMARY?userId=${userId}`,
    }),

    buy: builder.mutation({
      query: (body) => ({ url: "BUY", method: "POST", body: body }),
    }),

    commitBuy: builder.mutation({
      query: (body) => ({ url: "COMMIT_BUY", method: "POST", body: body }),
    }),

    cancelBuy: builder.mutation({
      query: (body) => ({ url: "CANCEL_BUY", method: "POST", body: body }),
    }),

    sell: builder.mutation({
      query: (body) => ({ url: "SELL", method: "POST", body: body }),
    }),

    commitSell: builder.mutation({
      query: (body) => ({ url: "COMMIT_SELL", method: "POST", body: body }),
    }),

    cancelSell: builder.mutation({
      query: (body) => ({ url: "CANCEL_SELL", method: "POST", body: body }),
    }),
  }),
});

export const {
  useGetQuoteQuery,
  useGetStocksQuery,
  useCreateAccountMutation,
  useLoginMutation,
  useAddMutation,
  useGetDisplaySummaryQuery,
  useBuyMutation,
  useCommitBuyMutation,
  useCancelBuyMutation,
  useSellMutation,
  useCommitSellMutation,
  useCancelSellMutation      
} = transactionServerApi;
