import * as React from "react";
import { useState, useEffect } from "react";
import "./Sell.css";
import Navbar from "../Components/Navbar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useSearchParams, useNavigate } from "react-router-dom";
import { selectStock } from "../redux/slices/stockSlice";
import { store } from "../redux/store";
import { Link } from "react-router-dom";
import { selectPendingSell, selectSpecficOwnedStock, selectUserData, setAmount, setAllOwnedStocks, setPendingSell, setTransactionHistory } from "../redux/slices/userSlice";
import { setOneStock } from "../redux/slices/stockSlice";
import { useSelector } from "react-redux";
import { useGetQuoteQuery, useSellMutation, useCommitSellMutation, useCancelSellMutation, useGetDisplaySummaryQuery } from "../rtkQuery/api";

// import API from "../api";


const App = () => {
  const navigate = useNavigate()
  const userData = useSelector(selectUserData);
  const [value, setValue] = useState("");
  const pendingSell = useSelector(selectPendingSell);

  const [searchparams] = useSearchParams();

  const [stockInfo, setStockInfo] = useState(selectStock(store.getState(), searchparams.get("id")));
  const [ownedStockInfo, setOwnedStockInfo] = useState(selectSpecficOwnedStock(store.getState(), searchparams.get("id")))
  const [currentValue, setCurrentValue] = useState("");

  const [stockToQuote, setStockToQuote] = useState(searchparams.get("id"));
  const [skip, setSkip] = useState(true);
  const {data: quoteStockData, error: quoteError, isLoading: quoteIsLoading, refetch: getQuote} = useGetQuoteQuery({userId: userData.userName, ticker: stockToQuote}, {skip: skip});
  
  const {data: summaryData, error: summaryError, isLoading: summaryIsLoading, refetch: getSummary} = useGetDisplaySummaryQuery(userData.userName);

  const [postSell, sellResult] = useSellMutation();
  const [commitSell, commitSellResult] = useCommitSellMutation();
  const [cancelSell, cancelSellResult] = useCancelSellMutation();

  useEffect(() => {
    if(quoteStockData) {
      store.dispatch(setOneStock({stockSymbol: stockToQuote, amount: quoteStockData.price}));
      setStockInfo({stockSymbol: stockToQuote, amount: quoteStockData.price})
    }
  }, [quoteStockData])

  useEffect(() => {
    if(sellResult.status === 'fulfilled') {
      store.dispatch(setPendingSell(true))
    }}, [sellResult]);

  useEffect(() => {
    if(commitSellResult.status === 'fulfilled') {
      store.dispatch(setPendingSell(false))
      getSummary();

    }}, [commitSellResult]);

  useEffect(() => {
    if(cancelSellResult.status === 'fulfilled') {
      store.dispatch(setPendingSell(false))
    }}, [cancelSellResult]);

  useEffect(() => {
    if(summaryData) {
        store.dispatch(setAmount(summaryData.data.funds));
        store.dispatch(setAllOwnedStocks(summaryData.data.stocksOwned));
        console.log(summaryData.data.transactionHistory)
        store.dispatch(setTransactionHistory(summaryData.data.transactionHistory));
        setOwnedStockInfo(selectSpecficOwnedStock(store.getState(), searchparams.get("id")));
    }
  }, [summaryData])

  const handleChange = e => {
    setValue(e.target.value)
  }
  const navigateMyStocks = () => {
    navigate('/MyStocks');
  }
  
  return (
    <div className="sell-page">
      <Navbar />

      <div className="sell-body">
        <div className="sell-container">
          <span className="sell-title" >Sell {searchparams.get("id")}</span>
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
          <div className="sell-content">
            <div className="sell-account-title">Account Balance: ${userData.amount}</div>

            <div></div>
            <div className="sell-account-title">Stock in Account: {ownedStockInfo.amount} Shares</div>

            <div className="sell-amount">Amount</div>
            </div>

              <TextField value={value} onChange={handleChange} className="search" variant="standard" placeholder="Enter Amount of Stock to Sell" sx={{
                'width': '80%',   
                'alignSelf': 'center',
                'marginTop': '1rem',
                'marginBottom': '1rem',
                "& .MuiInputBase-root": {
                  "borderRadius": "20px",
                },
                
              }} />
           {!pendingSell && (
            <div className="sell-buttons">
            <Button size="medium" variant="contained" children="Submit" onClick={
              () => {
                if(value !== "") {
                  setCurrentValue(value);
                  postSell({userId: userData.userName, stockSymbol: searchparams.get("id"), amount: value});
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
            <Button size="medium" variant="contained" children="Cancel" onClick={navigateMyStocks} sx={{
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

          {pendingSell && (
            <div className="sell-buttons">
            <Button size="medium" variant="contained" children="Confirm" onClick={
              () => {
                  commitSell({userId: userData.userName});
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
              cancelSell({userId: userData.userName});
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

      </div >
    </div>
  );
};
export default App;