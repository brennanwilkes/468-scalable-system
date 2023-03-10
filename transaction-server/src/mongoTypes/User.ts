import { ObjectId } from "mongodb";


export interface UserMongo {
    _id: ObjectId;
    username: string;
    account_balance: number;
    stocks_owned: {stock_name: string, amount: number}[];
    pending_buy?: {stock_name: string, stock_price: number; amount_to_buy: number, timestamp: number, cryptoKey: string};
    pending_sell?: {stock_name: string, stock_price: number; amount_to_sell: number, timestamp: number, cryptoKey: string};
    account_balance_reserves: {stock_name: string, amount_in_reserve: number, timestamp: number}[]; //For SET_BUY_AMOUNT
    stocks_owned_reserves: {stock_name: string, amount_in_reserve: number, timestamp: number}[]; //Fpr SET_SELL_AMOUNT
    created: number;
    updated: number;
    credential_id: string;
}