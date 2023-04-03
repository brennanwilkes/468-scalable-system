import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Transaction from "./Transaction";
import TextField from "@mui/material/TextField";
import "./History.css"

function App(){
  const transactionHistory = [
    {
      stockSymbol: "ABC",
      price: "$1.52",
      type: "Buy",
    },
    {
      stockSymbol: "XZF",
      price: "$2.50",
      type: "Buy",
    },
    {
      stockSymbol: "JEM",
      price: "$4.50",
      type: "Sell"
    },
    {
      stockSymbol: "MAO",
      price: "$0.50",
      type: "Sell",

    }
  ];
return(

  <div className="history">
  <Navbar />

<div className="search-container">
<TextField className="search" placeholder="Search History" sx={{
                'width': '80%',
                'flexDirection' : 'column',
                'alignItems' : 'stretch',
                'display' : 'flex',
                'marginLeft': '1rem',
                'marginRight' : '1rem',                    
                'marginTop': '1rem',
                'marginBottom' : '1rem',
                "& .MuiInputBase-root": {
                    "borderRadius": "50px",
                }
            }} />
  </div>
  <div className="transaction-list">

  <label className="trans-history">Transaction History</label>

  {transactionHistory.map(transaction => (
    <Transaction key={transaction.stockSymbol} className="transaction-instance" {...transaction} />
  ))}
  </div>


</div>
);
}

export default App;