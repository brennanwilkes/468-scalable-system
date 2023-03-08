import * as net from 'net';
import { MongoClient } from 'mongodb';
import {v4 as uuidv4} from 'uuid';
import { LogQuoteServer } from '../mongoTypes';

/**
 * Returns the latest quote for a certain symbol. Checks the redis
 * cache before calling the quote server. 
 * @param stockSymbol Symbol of the Stock to get a quote of
 */
export async function getQuote(stockSymbol: string, userId: string, transactionNumber: number, redisClient: any, mongoClient: MongoClient, optional?: {byPassRedis?: boolean, skipQuoteLog?: boolean}): Promise<{price: number, cryptoKey: string}> {
    if(process.env.DISABLE_QUOTE_SOCKET == 'true') {
        return {price: 1, cryptoKey: `test-uuid: ${uuidv4()}`};
    }

    if(!optional?.byPassRedis) {
        const result: string = await redisClient.get(stockSymbol);
        if(result) {
            //TODO: Log System Event: Quote from Cache -- maybe not 
            return {price: parseFloat(result), cryptoKey: 'null'};
        }
    }

    var client = new net.Socket();

    return new Promise((resolve, reject) => {
        client.connect(4444, 'quoteserve.seng.uvic.ca', function() {
            console.log('Connected');
            client.write(`${stockSymbol} ${userId}\n`, () => {
                console.log('Data Sent');
            }) ;
        });

        client.on('error', (err) => {
            console.log(err);
        });

        client.on('close' , () => {
            console.log('Connection Closed');
        });
    
        client.on('data', async (data) => {
            console.log('Received: ' + data.toString());
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


            const returnResult = {price: parseFloat(returnedData[0]), cryptoKey: returnedData[4]};
            await redisClient.set(returnedData[1], JSON.stringify(returnResult), {PX: 3_000}) //Sets Redis Key to expire in 3 seconds
            resolve(returnResult)
        })
    })
    
   
}