import * as React from "react";
import "./Transaction.css";

const App = (props) => {
    return (
        <div className="transaction">
            <div className="rectangle-2">
                <span className="stockSymbol">{props.stockSymbol}</span>
                <span className="type">{props.action}</span>
                <span className="price">${props.amount}</span>
                <span className="timestamp">{(new Date(props.timestamp)).toLocaleString()}</span>
              
            </div>
        </div>
    );
};
export default App;