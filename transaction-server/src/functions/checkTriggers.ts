import e from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { LogSystemEvent, TransactionMongo, TriggerMongo, UserMongo } from '../mongoTypes';
import { getQuote } from './getQuote';
import {v4 as uuidv4} from 'uuid';
import os from 'os';

/**
 * A function that acts as a seperate service. It checks the triggers and executes them if they are met.
 * Not all transaction servers handle this, so if start is true (which is only true when the server starts up), it
 * will check if another server is already handling this. This is determined by redis. If another server is already
 * handling this, it will return. If not, it will increment the value in redis to 1.
 * 
 * It will then get all the buy and sell triggers from the database and check if they are met. If they are, it will execute the trigger 
 * and remove it from the databse. If not, it will continue to the next trigger. This function continually loops. 
 * @param redisClient - redis client
 * @param mongoClient  - mongo client
 * @param start - if this is the first time the function is being called
 */
export async function checkTriggers(redisClient: any, mongoClient: MongoClient, start: boolean) {
    if(start) {
        const startVal = await redisClient.incr('checkTrigger');
        if(startVal > 1) {
            return;
        }
    }
    const buyTriggers: TriggerMongo[] = await mongoClient.db("Transaction-Server").collection('Triggers').find({'trigger_type': "BUY"}).toArray() as any[];
    

    const removeTriggerIds = [];
        // Check all buy triggers
        for(const trigger of buyTriggers) {
            const userType: UserMongo = await mongoClient.db("Transaction-Server").collection('Users').findOne({_id: new ObjectId(trigger.user_id)}) as any;
            const {price, cryptoKey} = await getQuote(trigger.stock_symbol, userType.username, trigger.transactionNumber, redisClient, mongoClient);
            if(price <= trigger.trigger_price){
                    let index: number;
                    const reserve = userType.account_balance_reserves.find((reserve, i) => {
                        if(reserve.stock_name == trigger.stock_symbol) {
                            index = i;
                            return true;
                        }
                        return false;
                    });
                    if(!reserve) {
                        removeTriggerIds.push(trigger._id);
                        continue;
                    }
                    let stockIndex: number; 
                    let stock = userType.stocks_owned.find((stock, i) => {
                        if(stock.stock_name == trigger.stock_symbol) {
                            stockIndex = i;
                            return true;
                        }
                        return false;
                    })

                    const amountOfStock = reserve.amount_in_reserve / price;
                    if(stock) {
                        stock.amount += amountOfStock
                        userType.stocks_owned[stockIndex!] = stock;
                    } else {
                        stock = {stock_name: trigger.stock_symbol, amount: amountOfStock}
                        userType.stocks_owned.push(stock);
                    };
                    const transaction: Partial<TransactionMongo> = {
                        transaction_id: uuidv4(),
                        timestamp: Date.now(),
                        amount: reserve!.amount_in_reserve,
                        username: userType.username,
                        transaction_type: 'BUY',
                        stock_symbol: trigger.stock_symbol,
                        cryptoKey: cryptoKey,
                        user_id: userType._id.toString(),
                    }
                    const systemLog: Partial<LogSystemEvent> = {
                        log_id: uuidv4(),
                        server: os.hostname(),
                        transactionNumber: trigger.transactionNumber,
                        timestamp: Date.now(),
                        type: 'System',
                        command: 'BUY',
                        userId: userType.username,
                        stockSymbol: trigger.stock_symbol,
                        funds: reserve!.amount_in_reserve,
                    }
                    removeTriggerIds.push(trigger._id);
                    userType.account_balance_reserves.splice(index!, 1);
                    userType.updated = Date.now();
                    await mongoClient.db("Transaction-Server").collection('Users').updateOne({_id: userType._id}, {$set: userType});
                    await mongoClient.db("Transaction-Server").collection('Transactions').insertOne(transaction);
                    await mongoClient.db("Transaction-Server").collection('Logs').insertOne(systemLog);


                    

                    
            };
            
        }
    await mongoClient.db("Transaction-Server").collection('Triggers').deleteMany({_id: {$in: removeTriggerIds}});
    
    const sellTriggers: TriggerMongo[] = await mongoClient.db("Transaction-Server").collection('Triggers').find({'trigger_type': "SELL"}).toArray() as any;

    const removeTriggerIdsSell = [];
        //Check all sell triggers
        for(const trigger of sellTriggers) {
            const userType: UserMongo = await mongoClient.db("Transaction-Server").collection('Users').findOne({_id: new ObjectId(trigger.user_id)}) as any;
            const {price, cryptoKey }= await getQuote(trigger.stock_symbol, userType.username, trigger.transactionNumber, redisClient, mongoClient, {skipQuoteLog: true});
            if(price >= trigger.trigger_price){
                    let index: number;
                    const reserve = userType.stocks_owned_reserves.find((reserve, i) => {
                        if(reserve.stock_name == trigger.stock_symbol) {
                            index = i;
                            return true;
                        }
                        return false;
                    });

                    if(!reserve) {
                        removeTriggerIdsSell.push(trigger._id);
                        continue;
                    }
                    let stockIndex: number; 
                    let stock = userType.stocks_owned.find((stock, i) => {
                        if(stock.stock_name == trigger.stock_symbol) {
                            stockIndex = i;
                            return true;
                        }
                        return false;
                    })

                    if(!stock) {
                        removeTriggerIdsSell.push(trigger._id);
                        continue;
                    }

                    const amountOfMoney = reserve.amount_in_reserve * price;
                    stock.amount -= reserve.amount_in_reserve;
                    userType.stocks_owned[stockIndex!] = stock!;
                    userType.account_balance += amountOfMoney;

                    const transaction: Partial<TransactionMongo> = {
                        transaction_id: uuidv4(),
                        timestamp: Date.now(),
                        amount: amountOfMoney,
                        username: userType.username,
                        transaction_type: 'SELL',
                        stock_symbol: trigger.stock_symbol,
                        cryptoKey: cryptoKey,
                        user_id: userType._id.toString(),
                    }
                    const systemLog: Partial<LogSystemEvent> = {
                        log_id: uuidv4(),
                        server: os.hostname(),
                        transactionNumber: trigger.transactionNumber,
                        timestamp: Date.now(),
                        type: 'System',
                        command: 'SELL',
                        userId: userType.username,
                        stockSymbol: trigger.stock_symbol,
                        funds: amountOfMoney,
                    }
                    removeTriggerIdsSell.push(trigger._id);
                    userType.stocks_owned_reserves.splice(index!, 1);
                    userType.updated = Date.now();
                    await mongoClient.db("Transaction-Server").collection('Users').updateOne({_id: userType._id}, {$set: userType});
                    await mongoClient.db("Transaction-Server").collection('Transactions').insertOne(transaction);
                    await mongoClient.db("Transaction-Server").collection('Logs').insertOne(systemLog);

                    

                    
            };
            
        }
    await mongoClient.db("Transaction-Server").collection('Triggers').deleteMany({_id: {$in: removeTriggerIdsSell}});
    setTimeout(() => {
        checkTriggers(redisClient, mongoClient, false)
    }, 5000)
}