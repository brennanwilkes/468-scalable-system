interface BuyType {
    userId: string;
    stockSymbol: string;
    amount: number;
}

interface CommitBuyType {
    userId: string;
}

interface CancelBuyType {
    userId: string;
}

interface SetBuyAmountType {
    userId: string;
    stockSymbol: string;
    amount: number;
}

interface CancelSetBuyType {
    userId: string;
    stockSymbol: string;
}

interface SetBuyTriggerType {
    userId: string; 
    stockSymbol: string;
    amount: number;
}

export {BuyType, CommitBuyType, CancelBuyType, SetBuyAmountType, CancelSetBuyType, SetBuyTriggerType}