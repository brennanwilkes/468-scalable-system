import * as React from "react";
import "./Stock.css";
import Button from "@mui/material/Button";
import { createSearchParams, useNavigate } from 'react-router-dom';


const App = (props) => {
  const navigate = useNavigate();

  function navigateBuy(id) {
    navigate({
      pathname: '/Buy',
      search: createSearchParams({
        id: props.stock_name
      }).toString()
    });
  };

  function navigateSell(id) {
    navigate({
      pathname: '/Sell',
      search: createSearchParams({
        id: props.stock_name
      }).toString()
    });
  };

  return (
    <div className="stock">
      <div className="rectangle">
        <span className="stockSymbol">{props.stock_name}</span>
        <span className="price">{Math.round(props.amount * 100) / 100} Shares</span>
        {/* <Button size="medium" variant="contained" children="Quote" onClick={() => props.quoteClick(props.stock_name)} sx={{
          'borderRadius': '50px',
          'alignSelf': 'flex-start',
          'backgroundColor': '#0F4ABF',
          'color': '#d7ecf5',
          'borderColor': '#397598',
          'marginTop': '0.5rem',
          ":hover": {
            bgcolor: "#0E54DE",
            color: "#d7ecf5",
          }
        }} /> */}
        <Button onClick={() => navigateBuy(props.stock_name)} size="medium" variant="contained" children="Buy" sx={{
          'borderRadius': '50px',
          'alignSelf': 'flex-start',
          'backgroundColor': '#3B9D61',
          'color': '#d7ecf5',
          'borderColor': '#397598',
          'marginTop': '0.5rem',
          ":hover": {
            bgcolor: "#60AE7E",
            color: "#d7ecf5",
          }
        }} />

        <Button onClick={() => navigateSell(props.stock_name)} size="medium" variant="contained" children="Sell" sx={{
          'borderRadius': '50px',
          'alignSelf': 'flex-start',
          'backgroundColor': '#A61110',
          'color': '#d7ecf5',
          'borderColor': '#397598',
          'marginTop': '0.5rem',
          ":hover": {
            bgcolor: "#DE4A48",
            color: "#d7ecf5",
          }
        }} />

      </div>
    </div>
  );
};
export default App;