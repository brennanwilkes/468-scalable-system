export interface TransactionMongo {
    transaction_id: string;
    timestamp: number;
    amount: number;
    username: string;
    transaction_type: string;
    stock_symbol: string;
    cryptokey: string;
}