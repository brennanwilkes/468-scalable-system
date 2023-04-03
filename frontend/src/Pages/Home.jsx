import React, { useState } from "react";
import styled from "styled-components";
import { FaHistory, FaUserAlt, FaChartLine } from "react-icons/fa";
import "./Home.css";
import Stock from "./Stock";
import Navbar from "../Components/Navbar";
import TextField from "@mui/material/TextField";
import PropTypes from 'prop-types';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SearchContainer = styled.div`
  display: flex;
  margin: 1rem;
`;

const StocksList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredStockData = stockData.filter(stock => {
    return stock.stockSymbol.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  return (
    <HomeContainer>
      <Navbar />
      <SearchContainer>
        <TextField
          className="search"
          placeholder="Search Stocks"
          value={searchQuery}
          onChange={handleSearch}
          sx={{
            'width': '80%',
            'flexDirection': 'column',
            'alignItems': 'stretch',
            'display': 'flex',
            "& .MuiInputBase-root": {
              "borderRadius": "50px",
            }
          }}
          key="search-input"
        />
      </SearchContainer>
      <StocksList>
        <label className="stock-market">Stocks Market</label>
        {filteredStockData.map(({ stockSymbol, price }) => (
          <Stock
            key={stockSymbol}
            className="stock-instance"
            stockSymbol={stockSymbol}
            price={price}
          />
        ))}
      </StocksList>
    </HomeContainer>
  );
}

Stock.propTypes = {
  stockSymbol: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
};

export default Home;
