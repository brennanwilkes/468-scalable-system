import e from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { LogSystemEvent, TransactionMongo, TriggerMongo, UserMongo } from '../mongoTypes';
import { getQuote } from './getQuote';
import {v4 as uuidv4} from 'uuid';

export async function checkTriggers(redisClient: any, mongoClient: MongoClient) {
    const buyTriggers: TriggerMongo[] = await mongoClient.db("Transaction-Server").collection('Triggers').find({'trigger_type': "BUY"}).toArray() as any[];
    

    const removeTriggerIds = [];
        for(const trigger of buyTriggers) {
            const {price, cryptoKey} = await getQuote(trigger.stock_symbol, trigger.user_id, trigger.transactionNumber, redisClient, mongoClient, {byPassRedis: true});
            if(price <= trigger.trigger_price){
                    let index: number;
                    const userType: UserMongo = await mongoClient.db("Transaction-Server").collection('Users').findOne({_id: new ObjectId(trigger.user_id)}) as any;
                    const reserve = userType.account_balance_reserves.find((reserve, i) => {
                        if(reserve.stock_name == trigger.stock_symbol) {
                            index = i;
                            return true;
                        }
                        return false;
                    });
                    let stockIndex: number; 
                    let stock = userType.stocks_owned.find((stock, i) => {
                        if(stock.stock_name == trigger.stock_symbol) {
                            stockIndex = i;
                            return true;
                        }
                        return false;
                    })

                    const amountOfStock = reserve!.amount_in_reserve / price;
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
                        server: "Server1",
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
        for(const trigger of sellTriggers) {
            const {price, cryptoKey }= await getQuote(trigger.stock_symbol, trigger.user_id, trigger.transactionNumber, redisClient, mongoClient, {skipQuoteLog: true});
            if(price >= trigger.trigger_price){
                    let index: number;
                    const userType: UserMongo = await mongoClient.db("Transaction-Server").collection('Users').findOne({_id: new ObjectId(trigger.user_id)}) as any;
                    const reserve = userType.stocks_owned_reserves.find((reserve, i) => {
                        if(reserve.stock_name == trigger.stock_symbol) {
                            index = i;
                            return true;
                        }
                        return false;
                    });
                    let stockIndex: number; 
                    let stock = userType.stocks_owned.find((stock, i) => {
                        if(stock.stock_name == trigger.stock_symbol) {
                            stockIndex = i;
                            return true;
                        }
                        return false;
                    })

                    const amountOfMoney = reserve!.amount_in_reserve * price;
                    stock!.amount -= reserve!.amount_in_reserve;
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
                        server: "Server1",
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
        checkTriggers(redisClient, mongoClient)
    }, 1000)
}