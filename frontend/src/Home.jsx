import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { FaHistory, FaUserAlt, FaChartLine } from "react-icons/fa";
import "./Home.css";
import { NavLink } from "react-router-dom";
import Navbar from "./Components/Navbar";

function App() {
  const [windowDimension, setWindowDimension] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStocks, setFilteredStocks] = useState([]);

  const allStocks = ["AAPL", "GOOG", "TSLA", "AMZN", "MSFT"];

  useEffect(() => {
    setWindowDimension(window.innerWidth);
  }, []);

  useEffect(() => {
    function handleResize() {
      setWindowDimension(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setFilteredStocks(
      allStocks.filter((stock) =>
        stock.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery]);

  const isMobile = windowDimension <= 640;

  return (
    <div className="home">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search Stocks"
      />
      <ul>
        {filteredStocks.map((stock) => (
          <li key={stock}>{stock}</li>
        ))}
      </ul>
      <Navbar />
    </div>
  );
}

export default App;
