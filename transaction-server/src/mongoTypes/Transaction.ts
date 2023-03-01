import { ObjectId } from "mongodb";

export interface TransactionMongo {
    _id: ObjectId;
    transaction_id: string;
    timestamp: number;
    amount: number;
    username: string;
    transaction_type: string;
    stock_symbol: string;
    user_id: string;
}