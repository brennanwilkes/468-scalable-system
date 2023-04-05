import * as React from "react";
import { useState } from "react";
import "./Sell.css";
import Navbar from "../Components/Navbar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
// import API from "../api";


const App = () => {
  const navigate = useNavigate()
  const [value, setValue] = useState("");

  const [searchparams] = useSearchParams();

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
          <span className="sell-title">Sell {searchparams.get("id")}</span>
          <div className="sell-content">
            <div className="sell-account-title">Account Balance</div>
            <div className="sell-account-balance">$100</div>

            <div className="sell-amount">Amount</div>
            </div>

              <TextField value={value} onChange={handleChange} className="search" variant="standard" placeholder="Enter Amount in Dollars to Sell" sx={{
                'width': '80%',   
                'alignSelf': 'center',
                'marginTop': '1rem',
                'marginBottom': '1rem',
                "& .MuiInputBase-root": {
                  "borderRadius": "20px",
                },
                
              }} />
          <div className="sell-buttons">
            <Button size="medium" variant="contained" children="Submit" sx={{
              'borderRadius': '50px',
              'alignSelf': 'flex-start',
              'backgroundColor': '#3B9D61',
              'color': '#d7ecf5',
              'borderColor': '#397598',
              'marginTop': '0.5rem',
              'marginRight': '0.5rem',
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
              'marginLeft': '0.5rem',
              ":hover": {
                bgcolor: "#578DAD",
                color: "#d7ecf5",
              }
            }} />
          </div>
        </div>

      </div >
    </div>
  );
};
export default App;