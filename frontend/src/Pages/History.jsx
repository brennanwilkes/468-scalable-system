import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Transaction from "./Transaction";
import TextField from "@mui/material/TextField";
import { useSelector } from "react-redux";
import { selectTransactions } from "../redux/slices/userSlice";
import "./History.css"

function App(){
  const transactionHistory = useSelector(selectTransactions)
  const [search, setSearch] = useState("");

  const transactionHistoryFiltered = transactionHistory.filter(transaction => {
    return transaction.stockSymbol.toLowerCase().includes(search.toLowerCase());
  });
return(

  <div className="history">
  <Navbar />

<div className="search-container">
<TextField className="search" placeholder="Search History" onChange={(event) => setSearch(event.target.value)} sx={{
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

  {transactionHistoryFiltered.map(transaction => (
    <Transaction key={transaction.timestamp} className="transaction-instance" {...transaction} />
  ))}
  </div>


</div>
);
}

export default App;