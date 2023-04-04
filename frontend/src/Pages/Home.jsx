import React, { useEffect, useState } from "react";
import { FaHistory, FaUserAlt, FaChartLine } from "react-icons/fa";
import "./Home.css";
import Stock from "./Stock";
import Navbar from "../Components/Navbar";
import TextField from "@mui/material/TextField";
import { useGetQuoteQuery, useGetStocksQuery } from "../rtkQuery/api";
import { selectStocks, setOneStock } from "../redux/slices/stockSlice";
import { setAllStocks } from "../redux/slices/stockSlice";
import { store } from "../redux/store";
import { useSelector } from "react-redux";
import { selectUserData } from "../redux/slices/userSlice";


function Home() {
  const userData = useSelector(selectUserData);
  if(userData.isLoggedIn === false) {
    window.location.href = "/Login";
    return(<div></div>);
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [stockToQuote, setStockToQuote] = useState("");

  const stockData = useSelector(selectStocks);
  const [skipGetStocks, setSkipGetStocks] = useState(stockData.length > 0 ? true : false);

  const {data: queryStockData, error: stockError, isLoading: stockIsLoading} = useGetStocksQuery(userData.userName, {skip: skipGetStocks});
  const {data: quoteStockData, error: quoteError, isLoading: quoteIsLoading, refetch: quoteRefetch } = useGetQuoteQuery({userId: userData.userName, ticker: stockToQuote});

  useEffect(() => {
    if (queryStockData) {
      const stocks = [...queryStockData.data];
      store.dispatch(setAllStocks(stocks.sort((a, b) => a.stockSymbol.localeCompare(b.stockSymbol))));
    }
  }, [queryStockData])

  useEffect(() => {
    if(quoteStockData) {
      store.dispatch(setOneStock({stockSymbol: stockToQuote, amount: quoteStockData.price}));
    }
  }, [quoteStockData])

  const filteredStockData = stockData.filter(stock => {
    return stock.stockSymbol.toLowerCase().includes(searchQuery.toLowerCase());
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

        <label className="stock-market">Stocks Market</label>

        {!stockIsLoading && !stockError && filteredStockData.map(stocks => (
          <Stock key={stocks.stockSymbol} className="stock-instance" quoteClick={(stockSymbol) => {
            if(stockSymbol === stockToQuote) {
              quoteRefetch();
            } else {
              setStockToQuote(stockSymbol);
              setTimeout(() => {
                quoteRefetch();
              }, 100)
            }
          }
          } {...stocks}  />
        ))}
        {
          stockIsLoading && <div>Loading...</div>
        }
        {
          stockError && <div>Error: {stockError.error}</div>
        }
      </div>


    </div>
  );
}



export default Home;
