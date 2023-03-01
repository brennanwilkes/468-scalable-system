import { LogAccountTransaction, UserMongo } from "../mongoTypes";
import {MongoClient} from 'mongodb';
import {v4 as uuidv4} from 'uuid';

/**
 * Allows the API to add or remove funds from an account. Used to make sure
 * the event is always logged. 
 * @param mongoClient DB connection
 */
export async function editAccount(mongoClient: MongoClient, userId: string, action: 'add' | 'remove', amount: number, transactionNumber: number): Promise<void> {
    const user: UserMongo = (await mongoClient.db('Transaction-Server').collection('Users').findOne({username: userId})) as any;
    if(action == 'add') {
        user.account_balance += amount;
    } else {
        user.account_balance -= amount;
    }
    user.updated = Date.now();

    const logAccount: Partial<LogAccountTransaction> = {
        log_id: uuidv4(),
        server: "Server1", //TODO: Replace with a unique server Name
        transactionNumber: transactionNumber,
        timestamp: Date.now(),
        type: 'Account',
        userId: userId,
        action: action,
        funds: amount,
    }
    await mongoClient.db("Transaction-Server").collection('Logs').insertOne(logAccount);
    await mongoClient.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});

}   