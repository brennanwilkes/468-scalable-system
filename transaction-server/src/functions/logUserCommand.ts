import { MongoClient } from 'mongodb';
import { LogUserCommand } from '../mongoTypes';
import {v4 as uuidv4} from 'uuid';

/**
 * Logs a User Command and returns a transaction Number
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
        server: "Server1", //TODO: Replace with a unique server Name
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