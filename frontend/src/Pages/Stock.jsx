import * as React from "react";
import "./Stock.css";
import Button from "@mui/material/Button";



const App = (props) => {
    return (
        <div className="stock">
            <div className="rectangle">
                <span className="stockSymbol">{props.stockSymbol}</span>
                <span className="price">{props.price}</span>
                <Button size="medium" variant= "contained" children= "Quote" sx={{
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
                <Button size="medium" variant= "contained" children= "Buy" sx={{
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