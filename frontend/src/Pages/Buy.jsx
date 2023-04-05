import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./Buy.css";
import Navbar from "../Components/Navbar";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useSelector } from "react-redux";
import { selectPendingBuy, selectUserData, setPendingBuy, setTransactionHistory } from "../redux/slices/userSlice";
import { selectStock, setOneStock } from "../redux/slices/stockSlice";
import { store } from "../redux/store";
import { useGetQuoteQuery, useBuyMutation, useCommitBuyMutation, useCancelBuyMutation , useGetDisplaySummaryQuery} from "../rtkQuery/api";
import { setAmount, setAllOwnedStocks } from "../redux/slices/userSlice";

function App() {
  const navigate = useNavigate();
  const userData = useSelector(selectUserData);
  const pendingBuy = useSelector(selectPendingBuy);
  const [searchparams] = useSearchParams();
  const [stockInfo, setStockInfo] = useState(selectStock(store.getState(), searchparams.get("id")));

  const [stockToQuote, setStockToQuote] = useState(searchparams.get("id"));
  const [skip, setSkip] = useState(true);
  const {data: quoteStockData, error: quoteError, isLoading: quoteIsLoading, refetch: getQuote} = useGetQuoteQuery({userId: userData.userName, ticker: stockToQuote}, {skip: skip});
  
  const {data: summaryData, error: summaryError, isLoading: summaryIsLoading, refetch: getSummary} = useGetDisplaySummaryQuery(userData.userName);

  const [postBuy, buyResult] = useBuyMutation();
  const [commitBuy, commitBuyResult] = useCommitBuyMutation();
  const [cancelBuy, cancelBuyResult] = useCancelBuyMutation();

  useEffect(() => {
    if(quoteStockData) {
      store.dispatch(setOneStock({stockSymbol: stockToQuote, amount: quoteStockData.price}));
      setStockInfo({stockSymbol: stockToQuote, amount: quoteStockData.price})
    }
  }, [quoteStockData])

  useEffect(() => {
    if(buyResult.status === 'fulfilled') {
      store.dispatch(setPendingBuy(true))
    }}, [buyResult]);

  useEffect(() => {
    if(commitBuyResult.status === 'fulfilled') {
      store.dispatch(setPendingBuy(false))
      getSummary();

    }}, [commitBuyResult]);

  useEffect(() => {
    if(cancelBuyResult.status === 'fulfilled') {
      store.dispatch(setPendingBuy(false))
    }}, [cancelBuyResult]);

  useEffect(() => {
    if(summaryData) {
        store.dispatch(setAmount(summaryData.data.funds));
        store.dispatch(setAllOwnedStocks(summaryData.data.stocksOwned));
        store.dispatch(setTransactionHistory(summaryData.data.transactionHistory));
    }
  }, [summaryData])

  
  const [value, setValue] = useState("");
  const handleChange = e => {
    setValue(e.target.value)
  }

  const navigateHome = () => {
    navigate('/');
  };
  return (
    <div className="buy-page">
      <Navbar />

      <div className="sell-body">
        <div className="sell-container">
        <div className="buy-title">Buy {searchparams.get("id")}</div>
        <div className="current-price">Current Price: ${stockInfo.amount}/share</div>

        <Button size="medium" variant="contained" children="Get Updated Quote" onClick={() => {
          if(skip) {
            setSkip(false);
            getQuote();
          } else {
            getQuote();
          }
        }}
        
        sx={{
              'borderRadius': '50px',
              'alignSelf': 'center',
              'backgroundColor': '#3B9D61',
              'color': '#d7ecf5',
              'borderColor': '#397598',
              'marginTop': '0.5rem',
              ":hover": {
                bgcolor: "#578DAD",
                color: "#d7ecf5",
              }
            }}/>

      <div className="buy-content">

        <div className="buy-account-title">Account Balance: ${userData.amount}</div>
        <div className="buy-amount">Amount</div>

        <TextField value={value} onChange={handleChange} className="search" variant="standard" placeholder="Enter Amount in Dollars to Purcjase" sx={{
                'width': '80%',   
                'alignSelf': 'center',
                'marginTop': '1rem',
                'marginBottom': '1rem',
                "& .MuiInputBase-root": {
                  "borderRadius": "20px",
                },
                
              }} />
        </div>

        
          {!pendingBuy && (
            <div className="buy-buttons">
            <Button size="medium" variant="contained" children="Submit" onClick={
              () => {
                if(value !== "") {
                  postBuy({userId: userData.userName, stockSymbol: searchparams.get("id"), amount: value});
                } 
              }}sx={{
              'borderRadius': '50px',
              'backgroundColor': '#3B9D61',
              'color': '#d7ecf5',
              'borderColor': '#397598',
              'marginTop': '0.5rem',
              ":hover": {
                bgcolor: "#578DAD",
                color: "#d7ecf5",
              }
            }} />
            <Button size="medium" variant="contained" children="Cancel" onClick={navigateHome} sx={{
              'borderRadius': '50px',
              'backgroundColor': '#A61110',
              'color': '#d7ecf5',
              'borderColor': '#397598',
              'marginTop': '0.5rem',
              ":hover": {
                bgcolor: "#578DAD",
                color: "#d7ecf5",
              }
            }} />
            </div>
          )}

          {pendingBuy && (
            <div className="buy-buttons">
            <Button size="medium" variant="contained" children="Confirm" onClick={
              () => {
                  commitBuy({userId: userData.userName});
              }
            }sx={{
              'borderRadius': '50px',
              'backgroundColor': '#3B9D61',
              'color': '#d7ecf5',
              'borderColor': '#397598',
              'marginTop': '0.5rem',
              ":hover": {
                bgcolor: "#578DAD",
                color: "#d7ecf5",
              }
            }} />
            <Button size="medium" variant="contained" children="Cancel" onClick={() => {
              cancelBuy({userId: userData.userName});
            }} sx={{
              'borderRadius': '50px',
              'backgroundColor': '#A61110',
              'color': '#d7ecf5',
              'borderColor': '#397598',
              'marginTop': '0.5rem',
              ":hover": {
                bgcolor: "#578DAD",
                color: "#d7ecf5",
              }
            }} />
            </div>
          )}
          </div>

      </div>

    </div>

  );
}

export default App;