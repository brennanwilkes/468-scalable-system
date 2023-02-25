import { CredentialMongo } from "./Credential";
import { TransactionMongo } from "./Transaction";

export interface UserMongo {
    username: string;
    account_balance: number;
    stocks_owned: {stock_name: string, amount: number}[];
    account_balance_reserves: {stock_name: string, amount_in_reserve: number}[]; //For SET_BUY_AMOUNT
    stocks_owned_reserves: {stock_name: string, amount_in_reserve: number}[];
    buy_triggers: {stock_name: string, trigger_price: number}[];
    sell_triggers: {stock_name: string, trigger_price: number}[];
    created: number;
    updated: number;
    credential: CredentialMongo;
    transactions: TransactionMongo[];
}