import { MongoClient } from 'mongodb';
import { LogErrorEvent } from '../mongoTypes';
import {v4 as uuidv4} from 'uuid';

/**
 * Logs an ErrorEvent
 * @param dbConnection 
 */
export async function logError(client: MongoClient, transactionNumer: number, command: string, optionalParams?: {
    userId?: string;
    stockSymbol?: string;
    filename?: string;
    funds?: number;
    errorMessage?: string;
}){

      //Log User Command
    const log: Partial<LogErrorEvent> = {
        log_id: uuidv4(),
        type: 'Error',
        command: command,
        server: "TBD", //TODO: Replace with a unique server Name
        transactionNumber: transactionNumer,
        timestamp: Date.now(),
    }
    if(optionalParams) {
        if(optionalParams.userId) {
            log.userId =optionalParams.userId;
        }
        if(optionalParams.stockSymbol) {
            log.stockSymbol = optionalParams.stockSymbol;
        }
        if(optionalParams.filename) {
            log.filename = optionalParams.filename;
        }
        if(optionalParams.funds) {
            log.funds = optionalParams.funds;
        }
        if(optionalParams.errorMessage) {
            log.errorMessage = optionalParams.errorMessage;
        }
    }
    await client.db("Transaction-Server").collection('Logs').insertOne(log);

}