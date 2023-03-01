import * as net from 'net';
import { MongoClient } from 'mongodb';
import {v4 as uuidv4} from 'uuid';
import { LogQuoteServer } from '../mongoTypes';
/**
 * Returns the latest quote for a certain symbol. Checks the redis
 * cache before calling the quote server. 
 * @param stockSymbol Symbol of the Stock to get a quote of
 */
export async function getQuote(stockSymbol: string, userId: string, redisClient: any, mongoClient: MongoClient, byPassRedis?: boolean): Promise<{price: number; cryptokey: string}> {
    if(process.env.DISABLE_QUOTE_SOCKET == 'true') {
        return {price: 1,  cryptokey: "testCryptoKey"};
    }

    if(!byPassRedis) {
        const result: {price: number; cryptokey: string;} = JSON.parse(await redisClient.get(stockSymbol));
        if(result) {
            //TODO: Log System Event: Quote from Cache
            return result;
        }
    }

    var client = new net.Socket();

    return new Promise((resolve, reject) => {
        client.connect(4444, 'quoteserver.seng.uvic.ca', function() {
            console.log('Connected');
            client.write(`${stockSymbol}, ${userId}`);
        });
    
        client.on('data', async (data) => {
            //[Quote, SYM, UserID, Timestamp, Cryptokey]
            const returnedData = data.toString().split(',')

            //Log Quote
            const logQuote: Partial<LogQuoteServer> = {
                log_id: uuidv4(),
                server: "TBD", //TODO: Replace with a unique server Name
                transactionNumber: 1, //TODO: Implement Transaction Numbers
                timestamp: Date.now(),
                type: 'Quote',
                userId: returnedData[2],
                price: parseFloat(returnedData[0]),
                stockSymbol: returnedData[1],
                quoteServerTime: parseInt(returnedData[3]),
                cryptokey: returnedData[4]
            }
            await mongoClient.db("Transaction-Server").collection('Logs').insertOne(logQuote);

            const returnResult = {price: parseFloat(returnedData[0]), cryptokey: returnedData[4]}
            await redisClient.set(returnedData[1], JSON.stringify(returnResult), {PX: 3_000}) //Sets Redis Key to expire in 3 seconds
            resolve(returnResult)
        })
    })
    
   
}