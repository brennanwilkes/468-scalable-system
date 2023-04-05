import React, { useState } from "react";
import { FaHistory, FaUserAlt, FaChartLine } from "react-icons/fa";
import "./Home.css";
import OwnedStock from "./OwnedStock";
import Navbar from "../Components/Navbar";
import TextField from "@mui/material/TextField";
import { useSelector } from "react-redux";
import { selectOwnedStocks, selectUserData } from "../redux/slices/userSlice";



function MyStocks() {
  const userData = useSelector(selectUserData);

  const [searchQuery, setSearchQuery] = useState("");
  const stockData = useSelector(selectOwnedStocks);
  const filteredStockData = stockData.filter(stock => {
    return stock.stock_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  return (


    <div className="home">
      <Navbar />

      <div className="search-container">
        <TextField className="search" value={searchQuery} onChange={handleSearch} placeholder="Search Stocks" sx={{
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
      <div className="stocks-list">

        <label className="stock-market">Stock Market</label>

        {filteredStockData.map(stocks => (
          <OwnedStock key={stocks.stock_name} className="stock-instance" {...stocks} />
        ))}
        {
          filteredStockData.length === 0 && <div>No stocks found</div>
        }
      </div>


    </div>
  );
}



export default MyStocks;