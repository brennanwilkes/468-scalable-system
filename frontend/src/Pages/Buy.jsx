import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./Buy.css";
import Navbar from "../Components/Navbar";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";


function App() {
  const navigate = useNavigate();
  const [searchparams] = useSearchParams();
  const [value, setValue] = useState("");
  const handleChange = e => {
    setValue(e.target.value)
  }

  const navigateHome = () => {
    navigate('/');
  };
  return (
    <div className="buy-page">
      <Navbar />

      <div className="container">
        <div className="buy-stock">Buy {searchparams.get("id")}</div>

        <div className="account-balance">Account Balance</div>
        <div className="balance">$100</div>

        <div className="amount">Amount</div>

        <div className="input-container">
          <TextField value={value} onChange={handleChange} className="search" placeholder="Enter Amount" sx={{
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

        <div className="buttons">
          <Button size="medium" variant="contained" children="Submit" sx={{
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
          <Button size="medium" variant="contained" children="Cancel" onClick={navigateHome} sx={{
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
      </div>

    </div>

  );
}

export default App;