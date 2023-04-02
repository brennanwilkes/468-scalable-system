import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import {FaHistory, FaUserAlt, FaChartLine} from "react-icons/fa";
import "./Home.css";
import { NavLink } from "react-router-dom";
import Navbar from "./Components/Navbar";

function App() {
  const [windowDimension, setWindowDimension] = useState(null);

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

  const isMobile = windowDimension <= 640;

return (
  <div className = "home">
  All Stocks
  <Navbar/>

  </div>
  );
}

export default App;