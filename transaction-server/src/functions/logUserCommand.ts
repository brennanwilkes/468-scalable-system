import { MongoClient } from 'mongodb';
import { LogUserCommand } from '../mongoTypes';
import {v4 as uuidv4} from 'uuid';

/**
 * Logs a User Command and returns a transaction Number
 * @param dbConnection 
 */
export async function logUserCommand(dbConnection: MongoClient, command: string, userId: string, optionalParams?: {
    stockSymbol?: string;
    filename?: string;
    funds?: number;
}){

      //Log User Command
    const log: Partial<LogUserCommand> = {
        log_id: uuidv4(),
        type: 'User',
        command: command,
        server: "TBD", //TODO: Replace with a unique server Name
        transactionNumber: 1, //TODO: Implement Transaction Numbers
        userId: userId,
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
    }
    dbConnection.db("Transaction-Server").collection('Logs').insertOne(log);

}