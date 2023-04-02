import { TriggerMongo } from "../mongoTypes";

export interface DisplaySummaryType {
    userId: string;
}

export interface DisplaySummaryReturnType {
    transactionHistory: {timestamp: number; action: string; stockSymbol: string; amount: number}[];
    stocksOwned: {stock_name: string, amount: number}[];
    funds: number;
    buyTriggers: TriggerMongo [];
    sellTriggers: TriggerMongo [];
}