import * as React from "react";
import "./Transaction.css";

const App = (props) => {
    return (
        <div className="transaction">
            <div className="rectangle-2">
                <span className="stockSymbol">{props.stockSymbol}</span>
                <span className="price">{props.price}</span>
                <span className="type">{props.type}</span>
                <span className="timestamp">{props.timestamp}</span>
              
            </div>
        </div>
    );
};
export default App;