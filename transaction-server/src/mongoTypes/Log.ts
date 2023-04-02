import { ObjectId } from "mongodb";

export interface LogMongo {
    _id: ObjectId;
    log_id: string;
    server: string;
    transactionNumber: number;
    timestamp: number;
    type: 'User' | 'Quote' | 'Account' | 'System' | 'Error' | 'Debug'
}

export interface LogUserCommand extends LogMongo {
    userId: string;
    command: string;
    stockSymbol?: string;
    filename?: string;
    funds?: number;
}

export interface LogQuoteServer extends LogMongo {
    userId: string;
    price: number;
    stockSymbol: string;
    quoteServerTime: number;
    cryptokey: string;
}

export interface LogAccountTransaction extends LogMongo {
    userId: string;
    action: string;
    funds: number;
}

export interface LogSystemEvent extends LogMongo {
    command: string;
    userId?: string;
    stockSymbol?: string;
    filename?: string;
    funds?: number;
}

export interface LogErrorEvent extends LogMongo {
    command: string;
    userId?: string;
    stockSymbol: string;
    filename?: string;
    funds?: number;
    errorMessage?: string;
}

export interface LogDebugEvent extends LogMongo {
    command: string;
    userId?: string;
    stockSymbol: string;
    filename?: string;
    funds?: number;
    debugMessage?: string;
}
