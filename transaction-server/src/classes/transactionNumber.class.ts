import { createClient } from 'redis';
require('dotenv').config();

/**
 * This class is used to generate a transaction number. Uses redis to keep track of the number so that all transaction servers
 * are consistent and don't use the same number twice.
 */
export class TransactionNumber{
    redisClient: any;
    constructor() {
        this.redisClient= createClient({url: `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}/0`});
        this.redisClient.connect();
    }


   
    /**
     * Gets the next transaction number from redis and increments it for the next transaction.
     * @returns the next transaction number
     */
    public async getTransactionNumber() {
        const transactionNumber = await this.redisClient.incr('transactionNumber');
        return transactionNumber;
    }
}