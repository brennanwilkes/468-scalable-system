import * as React from "react";
import "./Stock.css";
import Button from "@mui/material/Button";
import {createSearchParams, useNavigate} from 'react-router-dom';


const App = (props) => {
    const navigate = useNavigate();

    function navigateBuy(id){
        navigate({
            pathname:'/Buy',
            search: createSearchParams({
                id: props.stockSymbol
            }).toString()});
    };


    return (
        <div className="stock">
            <div className="rectangle">
                <span className="stockSymbol">{props.stockSymbol}</span>
                <span className="price">{props.amount}</span>
                <Button size="medium" variant= "contained" children= "Quote" onClick={() => props.quoteClick(props.stockSymbol)}sx={{
                        'borderRadius': '50px',
                        'alignSelf' : 'flex-start',
                        'backgroundColor': '#397598',
                        'color': '#d7ecf5',
                        'borderColor': '#397598',
                        'marginTop': '0.5rem',
                        ":hover": {
                            bgcolor: "#578DAD",
                            color: "#d7ecf5",
                          }
                    }} />
                <Button onClick={()=>navigateBuy(props.stockSymbol)} size="medium" variant= "contained" children= "Buy" sx={{
                        'borderRadius': '50px',
                        'alignSelf' : 'flex-start',
                        'backgroundColor': '#397598',
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
    );
};
export default App;