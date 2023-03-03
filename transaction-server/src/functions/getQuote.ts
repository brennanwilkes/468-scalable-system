import * as net from 'net';
import { MongoClient } from 'mongodb';
import {v4 as uuidv4} from 'uuid';
import { LogQuoteServer } from '../mongoTypes';
/**
 * Returns the latest quote for a certain symbol. Checks the redis
 * cache before calling the quote server. 
 * @param stockSymbol Symbol of the Stock to get a quote of
 */
export async function getQuote(stockSymbol: string, userId: string, transactionNumber: number, redisClient: any, mongoClient: MongoClient, optional?: {byPassRedis?: boolean, skipQuoteLog?: boolean}): Promise<number> {
    if(process.env.DISABLE_QUOTE_SOCKET == 'true') {
        return 1;
    }

    if(!optional?.byPassRedis) {
        const result: string = await redisClient.get(stockSymbol);
        if(result) {
            //TODO: Log System Event: Quote from Cache
            return parseInt(result);
        }
    }

    var client = new net.Socket();

    return new Promise((resolve, reject) => {
        client.connect(4444, 'quoteserve.seng.uvic.ca', function() {
            console.log('Connected');
            client.write(`${stockSymbol}, ${userId}`);
        });
    
        client.on('data', async (data) => {
            //[Quote, SYM, UserID, Timestamp, Cryptokey]
            const returnedData = data.toString().split(',')

            if(!optional?.skipQuoteLog) {
                            //Log Quote
            const logQuote: Partial<LogQuoteServer> = {
                log_id: uuidv4(),
                server: "Server1", //TODO: Replace with a unique server Name
                transactionNumber: transactionNumber,
                timestamp: Date.now(),
                type: 'Quote',
                userId: returnedData[2],
                price: parseFloat(returnedData[0]),
                stockSymbol: returnedData[1],
                quoteServerTime: parseInt(returnedData[3]),
                cryptokey: returnedData[4]
            }
            await mongoClient.db("Transaction-Server").collection('Logs').insertOne(logQuote);
            }


            const returnResult = parseFloat(returnedData[0])
            await redisClient.set(returnedData[1], returnResult, {PX: 3_000}) //Sets Redis Key to expire in 3 seconds
            resolve(returnResult)
        })
    })
    
   
}