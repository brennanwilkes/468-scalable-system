import { MongoClient } from 'mongodb';
import { LogUserCommand } from '../mongoTypes';
import {v4 as uuidv4} from 'uuid';
import os from 'os';

/**
 * Logs a User Command
 * @param dbConnection 
 */
export async function logUserCommand(dbConnection: MongoClient, command: string, transactionNumber: number, optionalParams?: {
    stockSymbol?: string;
    filename?: string;
    funds?: number;
    userId?: string;
}){

      //Log User Command
    const log: Partial<LogUserCommand> = {
        log_id: uuidv4(),
        type: 'User',
        command: command,
        server: os.hostname(),
        transactionNumber: transactionNumber,
        timestamp: Date.now(),
    }
    if(optionalParams) {
        if(optionalParams.stockSymbol) {
            log.stockSymbol = optionalParams.stockSymbol;
        }
        if(optionalParams.filename) {
            log.filename = optionalParams.filename;
        }
        if(optionalParams.funds) {
            log.funds = optionalParams.funds;
        }
        if(optionalParams.userId) {
            log.userId = optionalParams.userId;
        }
        
    }
    await dbConnection.db("Transaction-Server").collection('Logs').insertOne(log);

}