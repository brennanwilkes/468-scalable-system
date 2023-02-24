interface SellType {
    userId: string;
    stockSymbol: string;
    amount: number;
}

interface CommitSellType {
    userId: string;
}

interface CancelSellType {
    userId: string;
}
interface SetSellAmountType {
    userId: string;
    stockSymbol: string;
    amount: number;
}

interface CancelSetSellType {
    userId: string;
    stockSymbol: string;
}

interface SetSellTriggerType {
    userId: string; 
    stockSymbol: string;
    amount: number;
}

export {SellType, CommitSellType, CancelSellType, SetSellAmountType, CancelSetSellType, SetSellTriggerType}