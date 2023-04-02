import { ObjectId } from 'mongodb';

export interface TriggerMongo {
    _id: ObjectId;
    trigger_id: string;
    user_id: string;
    stock_symbol: string;
    trigger_type: 'BUY' | 'SELL';
    trigger_price: number;
    transactionNumber: number;
}