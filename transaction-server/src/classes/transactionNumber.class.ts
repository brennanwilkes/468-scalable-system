import { createClient } from 'redis';
require('dotenv').config();

export class TransactionNumber{
    private transNumber: number;
    redisClient: any;
    constructor() {
        this.transNumber = 1;
        this.redisClient= createClient({url: `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}/0`});
        this.redisClient.connect();
    }


   

    public async getTransactionNumber() {
        const transactionNumber = await this.redisClient.incr('transactionNumber');
        return transactionNumber;
    }
}