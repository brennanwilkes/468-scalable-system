import e from 'express';
import { MongoClient } from 'mongodb';
import { LogSystemEvent, TransactionMongo, UserMongo } from '../mongoTypes';
import { getQuote } from './getQuote';
import {v4 as uuidv4} from 'uuid';

export async function checkTriggers(redisClient: any, mongoClient: MongoClient) {
    const buyUsers = await mongoClient.db("Transaction-Server").collection('Users').find({'buy_triggers.0': {$exists: true}}).toArray();
    

    for(const user of buyUsers) {
        const userType:UserMongo = user as any;
        const removeTriggerIndexes = [];
        for(const [buy_index, buy_trigger] of userType.buy_triggers.entries()) {
            const price = await getQuote(buy_trigger.stock_name, userType.username, 0, redisClient, mongoClient, {skipQuoteLog: true})
            if(price <= buy_trigger.trigger_price){
                    let index: number;
                    const reserve = userType.account_balance_reserves.find((reserve, i) => {
                        if(reserve.stock_name == buy_trigger.stock_name) {
                            index = i;
                            return true;
                        }
                        return false;
                    });
                    let stockIndex: number; 
                    let stock = userType.stocks_owned.find((stock, i) => {
                        if(stock.stock_name == buy_trigger.stock_name) {
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
                        stock = {stock_name: buy_trigger.stock_name, amount: amountOfStock}
                        userType.stocks_owned.push(stock);
                    };
                    const transaction: Partial<TransactionMongo> = {
                        transaction_id: uuidv4(),
                        timestamp: Date.now(),
                        amount: reserve!.amount_in_reserve,
                        username: userType.username,
                        transaction_type: 'BUY',
                        stock_symbol: buy_trigger.stock_name,
                        user_id: userType._id.toString(),
                    }
                    const systemLog: Partial<LogSystemEvent> = {
                        log_id: uuidv4(),
                        server: "Server1",
                        transactionNumber: buy_trigger.transactionNumber,
                        timestamp: Date.now(),
                        type: 'System',
                        command: 'BUY',
                        userId: userType.username,
                        stockSymbol: buy_trigger.stock_name,
                        funds: reserve!.amount_in_reserve,
                    }
                    removeTriggerIndexes.push(buy_index);
                    userType.account_balance_reserves.splice(index!, 1);

                    

                    
            };
            
        }
        for(const trig_index of removeTriggerIndexes) {
            userType.buy_triggers.splice(trig_index, 1);
        }
        userType.updated = Date.now();
        mongoClient.db("Transaction-Server").collection('Users').updateOne({username: userType.username}, {$set: userType});
        return;
    };

    const sellUsers = await mongoClient.db("Transaction-Server").collection('Users').find({'sell_triggers.0': {$exists: true}}).toArray();

    for(const user of sellUsers) {
        const userType:UserMongo = user as any;
        const removeTriggerIndexes = [];
        for(const [sell_index, sell_trigger] of userType.sell_triggers.entries()) {
            const price = await getQuote(sell_trigger.stock_name, userType.username, 0, redisClient, mongoClient, {skipQuoteLog: true})
            if(price >= sell_trigger.trigger_price){
                    let index: number;
                    const reserve = userType.stocks_owned_reserves.find((reserve, i) => {
                        if(reserve.stock_name == sell_trigger.stock_name) {
                            index = i;
                            return true;
                        }
                        return false;
                    });
                    let stockIndex: number; 
                    let stock = userType.stocks_owned.find((stock, i) => {
                        if(stock.stock_name == sell_trigger.stock_name) {
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
                        stock_symbol: sell_trigger.stock_name,
                        user_id: userType._id.toString(),
                    }
                    const systemLog: Partial<LogSystemEvent> = {
                        log_id: uuidv4(),
                        server: "Server1",
                        transactionNumber: sell_trigger.transactionNumber,
                        timestamp: Date.now(),
                        type: 'System',
                        command: 'SELL',
                        userId: userType.username,
                        stockSymbol: sell_trigger.stock_name,
                        funds: amountOfMoney,
                    }
                    removeTriggerIndexes.push(sell_index);
                    userType.stocks_owned_reserves.splice(index!, 1);

                    

                    
            };
            
        }
        for(const trig_index of removeTriggerIndexes) {
            userType.buy_triggers.splice(trig_index, 1);
        }
        userType.updated = Date.now();
        mongoClient.db("Transaction-Server").collection('Users').updateOne({username: userType.username}, {$set: userType});
        return;
    }
    setTimeout(() => {
        checkTriggers(redisClient, mongoClient)
    }, 1000)
}