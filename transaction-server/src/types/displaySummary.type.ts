export interface DisplaySummaryType {
    userId: string;
}

export interface DisplaySummaryReturnType {
    transactionHistory: {timestamp: number; action: string; stockSymbol: string; amount: number}[];
    stocksOwned: {stock_name: string, amount: number}[];
    funds: number;
    buyTriggers: {stock_name: string, trigger_price: number}[];
    sellTriggers: {stock_name: string, trigger_price: number}[];
}