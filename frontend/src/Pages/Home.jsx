import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { FaHistory, FaUserAlt, FaChartLine } from "react-icons/fa";
import "./Home.css";
import Stock from "./Stock";
import Navbar from "../Components/Navbar";
import TextField from "@mui/material/TextField";


function App() {
  const stockData = [
    {
      stockSymbol: "ABC",
      price: "$1.52"

    },
    {
      stockSymbol: "XZF",
      price: "$2.50"

    },
    {
      stockSymbol: "JEM",
      price: "$4.50"
    },
    {
      stockSymbol: "MAO",
      price: "$0.50"
    }
  ];


  return (
    <div className="home">
      <Navbar />

    <div className="search-container">
    <TextField className="search" placeholder="Search Stocks" sx={{
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
      <div className="stocks-list">

      <label className="stock-market">Stocks Market</label>

      {stockData.map(stocks => (
        <Stock key={stocks.stockSymbol} className="stock-instance" {...stocks} />
      ))}
      </div>


    </div>

  );
}

export default App;