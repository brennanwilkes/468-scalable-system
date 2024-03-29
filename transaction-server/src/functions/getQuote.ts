import * as net from 'net';
import { MongoClient } from 'mongodb';
import {v4 as uuidv4} from 'uuid';
import { LogQuoteServer, LogSystemEvent } from '../mongoTypes';
import * as os from 'os';
require('dotenv').config()

/**
 * Returns the latest quote for a certain symbol. Checks the redis
 * cache before calling the quote server. 
 * @param stockSymbol Symbol of the Stock to get a quote of
 */
export async function getQuote(stockSymbol: string, userId: string, transactionNumber: number, redisClient: any, mongoClient: MongoClient, optional?: {byPassRedis?: boolean, skipQuoteLog?: boolean}): Promise<{price: number, cryptoKey: string}> {
    // Allows the quote server to be bypassed for testing purposes
    if(process.env.DISABLE_QUOTE_SOCKET == 'true') {
        return {price: parseFloat((Math.random() * 5).toFixed(2)), cryptoKey: `test-uuid: ${uuidv4()}`};
    }

    // Provides the option to bypass the redis cache
    if(!optional?.byPassRedis) {
        const result: {price: number, cryptoKey: string} = JSON.parse(await redisClient.get(stockSymbol));
        if(result) {
            if(!optional?.skipQuoteLog) {
                const logCacheQuote: Partial<LogSystemEvent> = {
                log_id: uuidv4(),
                server: os.hostname(),
                transactionNumber: transactionNumber,
                timestamp: Date.now(),
                type: 'System',
                command: 'QUOTE',
                userId: userId,
                stockSymbol: stockSymbol,
                funds: result.price,
                }

                await mongoClient.db("Transaction-Server").collection('Logs').insertOne(logCacheQuote);
            }
            return result;
        }
    }

    // Makes a request to the quote server. Only works if in the lab room. 
    var client = new net.Socket();
    return new Promise((resolve, reject) => {
        client.connect(4444, 'quoteserve.seng.uvic.ca', function() {
            client.write(`${stockSymbol} ${userId}\n`) ;
        });

        client.on('error', (err) => {
            console.log(err);
        });
    
        client.on('data', async (data) => {
            console.log('Received: ' + data.toString() + ' for user ' + userId);
            //[Quote, SYM, UserID, Timestamp, Cryptokey]
            // SYM and userId should be the same as the request, but the quote
            // server is bad and returns stupid stuff so we don't log the 
            // response values. 
            const returnedData = data.toString().split(',')

            if(!optional?.skipQuoteLog) {
                            //Log Quote
            const logQuote: Partial<LogQuoteServer> = {
                log_id: uuidv4(),
                server: os.hostname(),
                transactionNumber: transactionNumber,
                timestamp: Date.now(),
                type: 'Quote',
                userId: userId,
                price: parseFloat(returnedData[0]),
                stockSymbol: stockSymbol,
                quoteServerTime: parseInt(returnedData[3]),
                cryptokey: returnedData[4]
            }
            await mongoClient.db("Transaction-Server").collection('Logs').insertOne(logQuote);
            }


            const returnResult = {price: parseFloat(returnedData[0]), cryptoKey: returnedData[4]};
            await redisClient.set(stockSymbol, JSON.stringify(returnResult), {PX: parseInt(process.env.CACHE_TIME!)}) //Sets Redis Key to expire in x milliseconds
            resolve(returnResult)
        })
    })
    
   
}