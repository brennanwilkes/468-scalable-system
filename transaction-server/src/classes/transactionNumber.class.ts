export class TransactionNumber{
    private transNumber: number;
    constructor() {
        this.transNumber = 1;
    }

    public getTransactionNumber() {
        const returnTransNumber = this.transNumber;
        this.transNumber += 1;
        return returnTransNumber;
    }
}