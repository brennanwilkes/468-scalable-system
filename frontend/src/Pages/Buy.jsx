import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./Buy.css";
import Navbar from "../Components/Navbar";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useSelector } from "react-redux";
import { selectPendingBuy, selectUserData, setPendingBuy } from "../redux/slices/userSlice";
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

      <div className="container">
        <div className="buy-stock">Buy {searchparams.get("id")}</div>
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
        <div className="account-balance">Account Balance</div>
        <div className="balance">${userData.amount}</div>

        <div className="amount">Amount</div>

        <div className="input-container">
          <TextField value={value} onChange={handleChange} className="search" placeholder="Enter Amount in Dollars to Purchase" sx={{
            'width': '80%',
            'flexDirection': 'column',
            'alignItems': 'stretch',
            'display': 'flex',
            'marginLeft': '1rem',
            'marginRight': '1rem',
            'marginTop': '1rem',
            'marginBottom': '1rem',
            "& .MuiInputBase-root": {
              "borderRadius": "50px",
            }
          }} />
        </div>

        
          {!pendingBuy && (
            <div className="buttons">
            <Button size="medium" variant="contained" children="Submit" onClick={
              () => {
                if(value !== "") {
                  postBuy({userId: userData.userName, stockSymbol: searchparams.get("id"), amount: value});
                } 
              }}sx={{
              'borderRadius': '50px',
              'alignSelf': 'flex-start',
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
              'alignSelf': 'flex-start',
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
            <div className="buttons">
            <Button size="medium" variant="contained" children="Confirm" onClick={
              () => {
                  commitBuy({userId: userData.userName});
              }
            }sx={{
              'borderRadius': '50px',
              'alignSelf': 'flex-start',
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
              'alignSelf': 'flex-start',
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

  );
}

export default App;