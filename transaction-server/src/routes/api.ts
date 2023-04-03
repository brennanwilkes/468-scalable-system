import express, { Request, Response, Router } from 'express';
import { AddType, BuyType, CancelBuyType, CancelSellType, CancelSetBuyType, CancelSetSellType, CommitBuyType, CommitSellType, DisplaySummaryReturnType, DisplaySummaryType, DumplogType, QuoteType, SellType, SetBuyAmountType, SetBuyTriggerType, SetSellAmountType, SetSellTriggerType } from '../types';
import { getQuote } from '../functions/getQuote';
import { MongoClient, FindCursor, WithId, Document } from 'mongodb';
import { CredentialMongo, LogSystemEvent, TransactionMongo, TriggerMongo, UserMongo } from '../mongoTypes';
import {v4 as uuidv4} from 'uuid';
import { logUserCommand } from '../functions/logUserCommand';
import { createLogFile } from '../functions/createLogFile';
import {createClient} from 'redis';
import { editAccount } from '../functions/editAccount';
import { logError } from '../functions/logError';
import { TransactionNumber } from '../classes/transactionNumber.class';
import { checkTriggers } from '../functions/checkTriggers';
import os from 'os';

require('dotenv').config();

//Settting up necessary dependencies for the API
export const apiRouter: Router = express.Router();

const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}:${process.env.MONGO_PORT}/?authMechanism=DEFAULT`;
const client = new MongoClient(uri);
client.connect().then(async () => {
  await client.db('Transaction-Server').collection('Logs').createIndex({timestamp: 1});
  await client.db('Transaction-Server').collection('Logs').createIndex({timestamp: -1});
})

const redisClient = createClient({url: `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}/0`});
redisClient.connect();

checkTriggers(redisClient, client, true);

const transactionNumberClass = new TransactionNumber();

//Test route for getting the hostname of the server
apiRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  

  console.log(await client.db('Transaction-Server').admin().listDatabases())
  res.json({response: 'Server Name: ' + os.hostname()});
});

//Commands in order of provided list https://www.ece.uvic.ca/~seng462/ProjectWebSite/Commands.html

/**
 * Adds a specified amount of funds to the user's account. Creates a new account if the user does not have one.
 */
apiRouter.post('/ADD', async (req: Request, res: Response): Promise<void> => {
  const data: AddType = req.body;
  if(data.amount == null || data.userId == null) {
    res.status(500).json({error: 'Invalid request body'});
    return;
  };
  
  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'ADD',  transactionNumber, {funds: data.amount, userId: data.userId});


  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    //User missing, create one -- TODO: Reevalutate this, how are users created? - James 24/02/23
    //Create credentials, insert, then attach to user
    console.log('Inserting User');
    const newCredential: Partial<CredentialMongo> = {
      username: 'admin',
      hash_password: 'temp',
      created: Date.now(),
      updated: Date.now(),
    }

    const credentialResult = await client.db("Transaction-Server").collection('Credentials').insertOne(newCredential);

    const newUser: Partial<UserMongo> = {
      username: data.userId,
      account_balance: 0,
      stocks_owned: [],
      account_balance_reserves: [],
      stocks_owned_reserves: [],
      created: Date.now(),
      updated: Date.now(),
      credential_id: credentialResult.insertedId.toString(),
    }
    await client.db("Transaction-Server").collection('Users').insertOne(newUser);
    await editAccount(client, data.userId, 'add', data.amount, transactionNumber);
    res.status(200).json({response: `Account Created and Amount added to Account. Account holds ${data.amount}`});
  } else {
    await editAccount(client, data.userId, 'add', data.amount, transactionNumber);
    res.status(200).json({response: `Amount added to Account. Account now holds ${user.account_balance}`});
  }
  
});


/**
 * Makes a quote request for a specified stock symbol. Returns the price of the stock. Data could be cached.
 */
apiRouter.get('/QUOTE', async (req: Request, res: Response): Promise<void> => {
  const data: QuoteType = req.query as any;
  if(data.stockSymbol == null || data.userId == null) {
    res.status(500).json({error: 'Invalid request body'});
    return;
  };

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'QUOTE',transactionNumber, {stockSymbol: data.stockSymbol, userId: data.userId});
  const amount = await getQuote(data.stockSymbol, data.userId, transactionNumber, redisClient, client);
  res.status(200).json({price: amount.price});
});

/**
 * Buys a specified amount of a stock. If the user has enough funds, the transaction is pending until the user commits or cancels it.
 */
apiRouter.post('/BUY', async (req: Request, res: Response): Promise<void> => {
  //Account must have enough money
  //Stage transaction temporarily in mongo, do not execute.
  const data: BuyType = req.body;
  if(data.amount == null || data.stockSymbol == null || data.userId == null) {
    res.status(500).json({error: 'Invalid request body'});
    return;
  };

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'BUY',  transactionNumber, {funds: data.amount, stockSymbol: data.stockSymbol, userId: data.userId});

  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'BUY', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({ response: 'User Not Found'});
    return;
  }

  if(user.account_balance < data.amount) {
    await logError(client, transactionNumber, 'BUY', {userId: data.userId, errorMessage: 'Not enough funds'})
    res.status(500).json({response: 'Not enough funds'});
    return;
  }

  const getQuoteResult = await getQuote(data.stockSymbol, data.userId, transactionNumber, redisClient, client);
  user.pending_buy = {stock_name: data.stockSymbol, stock_price: getQuoteResult.price,amount_to_buy: data.amount, timestamp: Date.now(), cryptoKey: getQuoteResult.cryptoKey};
  user.updated = Date.now();

  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});


   
  res.status(200).json({ response: 'Ready to Buy, Please Commit or Cancel'});
});

/**
 *  Executes the most recent pending buy for the user. If the user does not have a pending buy, the command is ignored.
 */
apiRouter.post('/COMMIT_BUY', async (req: Request, res: Response): Promise<void> => {
  //User must have a buy within previous 60 seconds - most recent
  //Account depletes, but stock added to account
  const data: CommitBuyType = req.body;
  if(data.userId == null) {
    res.status(500).json({error: 'Invalid request body. Mising UserId'});
    return;
  };

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'COMMIT_BUY', transactionNumber, {userId: data.userId});
  
  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'COMMIT_BUY', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({response: 'User Not Found'});
    return;
  }

  if(user.pending_buy == null) {
    await logError(client, transactionNumber, 'COMMIT_BUY', {userId: data.userId, errorMessage: 'No pending BUY commands found. Please run a BUY command first'})
    res.status(500).json({ response: 'No pending BUY commands found. Please run a BUY command first'});
    return;
  }

  if(Date.now() - user.pending_buy.timestamp > 60_000) {
    user.pending_buy = undefined;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    await logError(client, transactionNumber, 'COMMIT_BUY', {userId: data.userId, errorMessage: 'Pending BUY command too old. Please try again'})
    res.status(500).json({ response: 'Pending BUY command too old. Please try again'});
    return;
  }

  const amountOfStock = user.pending_buy.amount_to_buy / user.pending_buy.stock_price;
  

  let ownedStockIndex = 0;
  const ownedStock = user.stocks_owned.find((value, index) => {
    if(value.stock_name == user.pending_buy?.stock_name) {
      ownedStockIndex = index;
      return value;
    }
  })

  let stockAmount;
  if(ownedStock == null) {
    stockAmount = amountOfStock;
    user.stocks_owned.push({stock_name: user.pending_buy.stock_name, amount: amountOfStock});
  } else {
    stockAmount = amountOfStock + ownedStock.amount;
    user.stocks_owned[ownedStockIndex] = {stock_name: user.pending_buy.stock_name, amount: ownedStock.amount + amountOfStock};
  }
  const stockName = user.pending_buy.stock_name;
 
  

  const transaction: Partial<TransactionMongo> = {
    transaction_id: uuidv4(),
    timestamp: Date.now(),
    amount: user.pending_buy.amount_to_buy,
    username: user.username,
    transaction_type: 'BUY',
    stock_symbol: user.pending_buy.stock_name,
    cryptoKey: user.pending_buy.cryptoKey,
    user_id: user._id.toString(),
  }
  await client.db("Transaction-Server").collection('Transactions').insertOne(transaction);

  const systemLog: Partial<LogSystemEvent> = {
    log_id: uuidv4(),
    server: os.hostname(),
    transactionNumber: transactionNumber,
    timestamp: Date.now(),
    type: 'System',
    command: 'COMMIT_BUY', 
    userId: data.userId,
    stockSymbol: stockName,
    funds: user.pending_buy.amount_to_buy,
  }

  const amount = user.pending_buy.amount_to_buy;

  await client.db("Transaction-Server").collection('Logs').insertOne(systemLog);
  
  user.pending_buy = undefined;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  await editAccount(client, data.userId, 'remove', amount, transactionNumber);

  res.status(200).json({ response: `Stock purchased. You now own ${stockAmount} shares of ${stockName} stock`});
});

/**
 * Cancels the most recent pending buy for the user. If the user does not have a pending buy, the command is ignored.
 */
apiRouter.post('/CANCEL_BUY', async (req: Request, res: Response): Promise<void> => {
  //User must have a buy within previous 60 seconds - most recent
  //BUY is cancelled 
  const data: CancelBuyType = req.body;
  if(data.userId == null) {
    res.status(500).json({error: 'Invalid request body. Mising UserId'});
    return;
  };
  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'CANCEL_BUY',  transactionNumber, {userId: data.userId});
  
  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    res.status(500).json({ response: 'User Not Found'});
    return;
  }

  if(user.pending_buy == null) {
    await logError(client, transactionNumber, 'CANCEL_BUY', {userId: data.userId, errorMessage: 'No pending BUY commands found.'})
    res.status(500).json({response: 'No pending BUY commands found.'});
    return;
  }

  //Command stipulates a 60 second limit here, but it makes no difference for this function lol. - James 24/02/23
  if(Date.now() - user.pending_buy.timestamp > 60_000) {
    user.pending_buy = undefined;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    await logError(client, transactionNumber, 'CANCEL_BUY', {userId: data.userId, errorMessage: 'Pending BUY command too old. Please try again'})
    res.status(500).json({response: 'Pending BUY command too old. Please try again'});
    return;
  }

  user.pending_buy = undefined;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  res.status(200).json({response: `Transaction Cancelled`});
});

/**
 * Sells a specified amount of stock for a user. If the user does not have enough stock, the command is ignored.
 */
apiRouter.post('/SELL', async (req: Request, res: Response): Promise<void> => {
  //User most hold enough stock
  //Save transaction temporarily in mongo, do not execute. 
  const data: SellType = req.body;
  if(data.userId == null || data.stockSymbol == null || data.amount == null) {
    res.status(500).json({error: 'Invalid request body. Missing UserId, StockSymbol or Amount'});
    return;
  };
  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'SELL', transactionNumber, {funds: data.amount, stockSymbol: data.stockSymbol, userId: data.userId});

  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'SELL', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({ response: 'User Not Found'});
    return;
  }

  const stock = user.stocks_owned.find((value) => {
    if(value.stock_name == data.stockSymbol) {
      return value;
    }
  })

  if(stock == null) {
    await logError(client, transactionNumber, 'SELL', {userId: data.userId, errorMessage: 'You do not have any of that stock'})
    res.status(500).json({ response: 'You do not have any of that stock'});
    return;
  }

  const getQuoteResult = await getQuote(data.stockSymbol, data.userId, transactionNumber, redisClient, client);
  const dollarAmountCurrentlyHeld = getQuoteResult.price * stock.amount;

  if(dollarAmountCurrentlyHeld < data.amount) {
    await logError(client, transactionNumber, 'SELL', {userId: data.userId, errorMessage: 'Requesting to sell more stock than you have in dollar amounts'})
    res.status(500).json({ response: 'Requesting to sell more stock than you have in dollar amounts'});
    return;
  }

  user.pending_sell = {stock_name: data.stockSymbol, stock_price: getQuoteResult.price, amount_to_sell: data.amount, timestamp: Date.now(), cryptoKey: getQuoteResult.cryptoKey};
  user.updated = Date.now();

  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});


   
  res.status(200).json({ response: 'Ready to Sell, Please Commit or Cancel'});

});

/**
 * Commits a pending sell for a user. If the user does not have a pending sell, the command is ignored.
 */
apiRouter.post('/COMMIT_SELL', async (req: Request, res: Response): Promise<void> => {
  //User must have a Sell within previous 60 seconds - most recent
  //Stock depletes, but account money increases
  const data: CommitSellType = req.body;
  if(data.userId == null) {
    res.status(500).json({error: 'Invalid request body. Mising UserId'});
    return;
  };

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'COMMIT_SELL', transactionNumber, {userId: data.userId});
  

  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'COMMIT_SELL', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({ response: 'User Not Found'});
    return;
  }

  if(user.pending_sell == null) {
    await logError(client, transactionNumber, 'COMMIT_SELL', {userId: data.userId, errorMessage: 'No pending SELL commands found. Please run a SELL command first'})
    res.status(500).json({ response: 'No pending SELL commands found. Please run a SELL command first'});
    return;
  }

  if(Date.now() - user.pending_sell.timestamp > 60_000) {
    user.pending_sell = undefined;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    await logError(client, transactionNumber, 'COMMIT_SELL', {userId: data.userId, errorMessage: 'Pending SELL command too old. Please try again'})
    res.status(500).json({ response: 'Pending SELL command too old. Please try again'});
    return;
  }

  const amountOfStock = user.pending_sell.amount_to_sell / user.pending_sell.stock_price;
  

  let ownedStockIndex = 0;
  const ownedStock = user.stocks_owned.find((value, index) => {
    if(value.stock_name == user.pending_buy?.stock_name) {
      ownedStockIndex = index;
      return value;
    }
  })

  if(ownedStock == null) {
    user.pending_sell = undefined;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    await logError(client, transactionNumber, 'COMMIT_SELL', {userId: data.userId, errorMessage: 'Stock could not be found in account. Command cancelled'})
    res.status(500).json({ response: 'Stock could not be found in account. Command cancelled'});
    return;
  }

  const amountToSell = user.pending_sell.amount_to_sell;
  const stockAmount = ownedStock.amount - amountOfStock;
  const stockName = user.pending_sell.stock_name;
  user.stocks_owned[ownedStockIndex] = {stock_name: user.pending_sell.stock_name, amount: stockAmount};
  
  
 
  

  const transaction: Partial<TransactionMongo> = {
    transaction_id: uuidv4(),
    timestamp: Date.now(),
    amount: user.pending_sell.amount_to_sell,
    username: user.username,
    transaction_type: 'SELL',
    stock_symbol: user.pending_sell.stock_name,
    cryptoKey: user.pending_sell.cryptoKey,
    user_id: user._id.toString(),
  }
  await client.db("Transaction-Server").collection('Transactions').insertOne(transaction);

  const systemLog: Partial<LogSystemEvent> = {
    log_id: uuidv4(),
    server: os.hostname(),
    transactionNumber: transactionNumber,
    timestamp: Date.now(),
    type: 'System',
    command: 'COMMIT_SELL', 
    userId: data.userId,
    stockSymbol: stockName,
    funds: user.pending_sell.amount_to_sell,
  }

  const amount = user.pending_sell.amount_to_sell;

  await client.db("Transaction-Server").collection('Logs').insertOne(systemLog);
  
  user.pending_buy = undefined;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  await editAccount(client, data.userId, 'add', amount, transactionNumber);
  res.status(200).json({ response: `Stock sold. You sold ${stockAmount} shares of ${stockName} stock for a total of \$${amountToSell}`});
});

/**
 * Cancels a pending sell for a user. If the user does not have a pending sell, the command is ignored.
 */
apiRouter.post('/CANCEL_SELL', async (req: Request, res: Response): Promise<void> => {
  //User must have a sell within previous 60 seconds - most recent
  //SELL is cancelled
  const data: CancelSellType = req.body;
  if(data.userId == null) {
    res.status(500).json({error: 'Invalid request body. Mising UserId'});
    return;
  };

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'CANCEL_SELL',transactionNumber, {userId: data.userId});

  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'CANCEL_SELL', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({ response: 'User Not Found'});
    return;
  }

  if(user.pending_sell == null) {
    await logError(client, transactionNumber, 'CANCEL_SELL', {userId: data.userId, errorMessage: 'No pending SELL commands found.'})
    res.status(500).json({response: 'No pending SELL commands found.'});
    return;
  }

  //Command stipulates a 60 second limit here, but it makes no difference for this function lol. - James 24/02/23
  if(Date.now() - user.pending_sell.timestamp > 60_000) {
    user.pending_sell = undefined;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    await logError(client, transactionNumber, 'CANCEL_SELL', {userId: data.userId, errorMessage: 'Pending SELL command too old. Please try again'})
    res.status(500).json({response: 'Pending SELL command too old. Please try again'});
    return;
  }

  user.pending_sell = undefined;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  res.status(200).json({ response: `Transaction Cancelled`});
});

/**
 * Sets an ampount of money a user wants to spend on a stock. This is a reserve and will be used when the user buys the stock via a trigger. 
 */
apiRouter.post('/SET_BUY_AMOUNT', async (req: Request, res: Response): Promise<void> => {
  const data: SetBuyAmountType = req.body;
  if(data.userId == null || data.amount == null || data.stockSymbol == null) {
    res.status(500).json({error: 'Invalid request body. Missing UserId, Amount or StockSymbol'});
    return;
  };

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'SET_BUY_AMOUNT',  transactionNumber, {funds: data.amount, stockSymbol: data.stockSymbol, userId: data.userId});
  //Cash of user must be higher than buy amount at transaction time
  //Creates a reserve
  // User cash removed to that reserve
  // reserve is emptied at buy time, stock added to account

  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'SET_BUY_AMOUNT', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({response: 'User Not Found'});
    return;
  }

  if(user.account_balance < data.amount) {
    await logError(client, transactionNumber, 'SET_BUY_AMOUNT', {userId: data.userId, errorMessage: 'Not enough funds in Account to set a buy amount.', funds: user.account_balance})
    res.status(500).json({response: 'Not enough funds in Account to set a buy amount.'});
    return;
  }

  user.account_balance -= data.amount;
  user.account_balance_reserves.push({stock_name: data.stockSymbol, amount_in_reserve: data.amount, timestamp: Date.now()});
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});

  const systemLog: Partial<LogSystemEvent> = {
    log_id: uuidv4(),
    server: os.hostname(),
    transactionNumber: transactionNumber,
    timestamp: Date.now(),
    type: 'System',
    command: 'SET_BUY_AMOUNT', 
    userId: data.userId,
    stockSymbol: data.stockSymbol,
    funds: data.amount,
  }

  await client.db("Transaction-Server").collection('Logs').insertOne(systemLog);

  res.status(200).json({response: 'BUY AMOUNT successfully set.'});
})

/**
 * Cancels a reserve buy amount for a user. If the user does not have a reserve buy amount, the command is ignored.
 */
apiRouter.post('/CANCEL_SET_BUY', async (req: Request, res: Response): Promise<void> => {
  const data: CancelSetBuyType = req.body;
  if(data.userId == null || data.stockSymbol == null) {
    res.status(500).json({error: 'Invalid request body. Missing UserId or StockSymbol'});
    return;
  };

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'CANCEL_SET_BUY',  transactionNumber, {stockSymbol: data.stockSymbol, userId: data.userId});
  //Must havea set_buy for stock
  // Put reserves back into account
  // Buy triggers cancelled
  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'CANCEL_SET_BUY', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({response: 'User Not Found'});
    return;
  }
  let reserveIndex: number;
  const reserve = user.account_balance_reserves.find((reserve, i) => {
    if(reserve.stock_name == data.stockSymbol) {
      reserveIndex = i;
      return true;
    }
    return false;
  });

  const buyTriggers: TriggerMongo[] = (await client.db('Transaction-Server').collection('Triggers').find({user_id: user._id.toString(), type: 'BUY', stock_name: data.stockSymbol}).toArray()) as any;

  const buyIdsToRemove = buyTriggers.map(trigger => trigger.trigger_id);


  if(!reserve && buyIdsToRemove.length == 0) {
    await logError(client, transactionNumber, 'CANCEL_SET_BUY', {userId: data.userId, errorMessage: 'Could not find any SET BUY AMOUNT', stockSymbol: data.stockSymbol})
    res.status(500).json({ response: 'Could not find any SET BUY AMOUNT'});
    return;
  }

  user.account_balance_reserves.splice(reserveIndex!, 1);


  user.account_balance += reserve!.amount_in_reserve;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  await client.db("Transaction-Server").collection('Triggers').deleteMany({trigger_id: {$in: buyIdsToRemove}});
  const systemLog: Partial<LogSystemEvent> = {
    log_id: uuidv4(),
    server: os.hostname(),
    transactionNumber: transactionNumber,
    timestamp: Date.now(),
    type: 'System',
    command: 'CANCEL_SET_BUY', 
    userId: data.userId,
    stockSymbol: data.stockSymbol,
    funds: reserve!.amount_in_reserve,
  }

  await client.db("Transaction-Server").collection('Logs').insertOne(systemLog);

  res.status(200).json({ response: 'BUY AMOUNT successfully cancelled.'});
})

/**
 * Sets a buy trigger for a user. If the user does not have a reserve buy amount, the command is ignored.
 */
apiRouter.post('/SET_BUY_TRIGGER', async (req: Request, res: Response): Promise<void> => {
  const data: SetBuyTriggerType = req.body;
  if(data.userId == null || data.stockSymbol == null || data.amount == null) {
    res.status(500).json({error: 'Invalid request body. Missing UserId or StockSymbol or Amount'});
    return;
  };

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'SET_BUY_TRIGGER', transactionNumber, {userId: data.userId, stockSymbol: data.stockSymbol, funds: data.amount, });
  // Check if user has a reserve for that stock

  const user:UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'SET_BUY_TRIGGER', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({ response: 'User Not Found'});
    return;
  }

  const reserve = user.account_balance_reserves.find(reserve => reserve.stock_name == data.stockSymbol);
  if(!reserve) {
    await logError(client, transactionNumber, 'SET_BUY_TRIGGER', {userId: data.userId, errorMessage: 'Could not find any SET BUY AMOUNT', stockSymbol: data.stockSymbol})
    res.status(500).json({response: 'Could not find any SET BUY AMOUNT'});
    return;
  }

  const trigger: Partial<TriggerMongo> = {
    trigger_id: uuidv4(),
    user_id: user._id.toString(),
    stock_symbol: data.stockSymbol,
    trigger_type: 'BUY',
    trigger_price: data.amount,
    transactionNumber: transactionNumber,
  }

  await client.db('Transaction-Server').collection('Triggers').insertOne(trigger);
  res.status(200).json({ response: 'BUY TRIGGER successfully set.'});
});


/**
 *  Sets an ampount of stock a user wants to sell. This is a reserve and will be used when the user sell the stock via a trigger. 
 */
apiRouter.post('/SET_SELL_AMOUNT', async (req: Request, res: Response): Promise<void> => {
  const data: SetSellAmountType = req.body;
  if(data.userId == null || data.stockSymbol == null || data.amount == null) {
    res.status(500).json({error: 'Invalid request body. Missing UserId or StockSymbol or Amount'});
    return;
  };
  
  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'SET_SELL_AMOUNT', transactionNumber, {funds: data.amount, stockSymbol: data.stockSymbol, userId: data.userId});


  //Stock of user must be hihger than sell amount
  //Creates a reserve
  // User stock removed to that reserve
  // reserve is emptied at sell time, cash added to account
  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'SET_SELL_AMOUNT', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({ response: 'User Not Found'});
    return;
  }
  
  let stockIndex: number;
  const stock = user.stocks_owned.find((stock, i) => {
    if(stock.stock_name == data.stockSymbol) {
      stockIndex = i;
      return true;
    }
    return false;
  });

  if(!stock) {
    await logError(client, transactionNumber, 'SET_SELL_AMOUNT', {userId: data.userId, errorMessage: 'You do not own any of that stock', stockSymbol: data.stockSymbol})
    res.status(500).json({ response: 'You do not own any of that stock'})
    return;
  }

  if(stock.amount < data.amount) {
    await logError(client, transactionNumber, 'SET_SELL_AMOUNT', {userId: data.userId, errorMessage: 'Not enough stock to sell', stockSymbol: data.stockSymbol})
    res.status(500).json({ response: 'Not enough stock to sell'});
    return;
  }

  stock.amount -= data.amount;
  user.stocks_owned_reserves.push({stock_name: data.stockSymbol, amount_in_reserve: data.amount, timestamp: Date.now()})
  user.stocks_owned[stockIndex!] = stock;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});

  const systemLog: Partial<LogSystemEvent> = {
    log_id: uuidv4(),
    server: os.hostname(),
    transactionNumber: transactionNumber,
    timestamp: Date.now(),
    type: 'System',
    command: 'SET_SELL_AMOUNT', 
    userId: data.userId,
    stockSymbol: data.stockSymbol,
    funds: data.amount,
  }

  await client.db("Transaction-Server").collection('Logs').insertOne(systemLog);

  res.status(200).json({ response: 'SELL AMOUNT successfully set.'});
})

/**
 * Sets a sell trigger for a user. If the user does not have a reserve sell amount, the command is ignored.
 */
apiRouter.post('/SET_SELL_TRIGGER', async (req: Request, res: Response): Promise<void> => {
  const data: SetSellTriggerType = req.body;
  if(data.userId == null || data.stockSymbol == null || data.amount == null) {
    res.status(500).json({error: 'Invalid request body. Missing UserId or StockSymbol or Amount'});
    return;
  };
  
  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'SET_SELL_TRIGGER', transactionNumber, {funds: data.amount, stockSymbol: data.stockSymbol, userId: data.userId});
  
  const user:UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'SET_SELL_TRIGGER', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({response: 'User Not Found'});
    return;
  }

  const reserve = user.stocks_owned_reserves.find(reserve => reserve.stock_name == data.stockSymbol);
  if(!reserve) {
    await logError(client, transactionNumber, 'SET_SELL_TRIGGER', {userId: data.userId, errorMessage: 'Could not find any SET SELL AMOUNT', stockSymbol: data.stockSymbol})
    res.status(500).json({response: 'Could not find any SET SELL AMOUNT'});
    return;
  }

  const trigger: Partial<TriggerMongo> = {
    trigger_id: uuidv4(),
    user_id: user._id.toString(),
    stock_symbol: data.stockSymbol,
    trigger_type: 'SELL',
    trigger_price: data.amount,
    transactionNumber: transactionNumber,
  }

  await client.db('Transaction-Server').collection('Triggers').insertOne(trigger);
  res.status(200).json({success: true, response: 'SELL TRIGGER successfully set.'});
})

/**
 * Cancels a sell amount for a user. If the user does not have a reserve sell amount, the command is ignored.
 */
apiRouter.post('/CANCEL_SET_SELL', async (req: Request, res: Response): Promise<void> => {
  const data: CancelSetSellType = req.body;
  if(data.userId == null || data.stockSymbol == null) {
    res.status(500).json({error: 'Invalid request body. Missing UserId or StockSymbol'});
    return;
  };

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'CANCEL_SET_SELL', transactionNumber, { stockSymbol: data.stockSymbol, userId: data.userId});
  // Must havea set_sell for stock
  // Put reserves back into account
  // sell trigger cancelled
  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'CANCEL_SET_SELL', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({ response: 'User Not Found'});
    return;
  }
  let reserveIndex: number;
  const reserve = user.stocks_owned_reserves.find((reserve, i) => {
    if(reserve.stock_name == data.stockSymbol) {
      reserveIndex = i;
      return true;
    }
    return false;
  });

  const sellTriggers: TriggerMongo[] = (await client.db('Transaction-Server').collection('Triggers').find({user_id: user._id.toString(), type: 'SELL', stock_name: data.stockSymbol}).toArray()) as any;

  const sellIdsToRemove = sellTriggers.map(trigger => trigger.trigger_id);


  if(!reserve && sellIdsToRemove.length == 0) {
    await logError(client, transactionNumber, 'CANCEL_SET_SELL', {userId: data.userId, errorMessage: 'Could not find any SET SELL AMOUNT', stockSymbol: data.stockSymbol})
    res.status(500).json({ response: 'Could not find any SET SELL AMOUNT'});
    return;
  }

  user.stocks_owned_reserves.splice(reserveIndex!, 1);

  const stockIndex = user.stocks_owned.findIndex(stock => stock.stock_name == data.stockSymbol);
  user.stocks_owned[stockIndex].amount += reserve!.amount_in_reserve;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  await client.db("Transaction-Server").collection('Triggers').deleteMany({trigger_id: {$in: sellIdsToRemove}});
  const systemLog: Partial<LogSystemEvent> = {
    log_id: uuidv4(),
    server: os.hostname(),
    transactionNumber: transactionNumber,
    timestamp: Date.now(),
    type: 'System',
    command: 'CANCEL_SET_SELL', 
    userId: data.userId,
    stockSymbol: data.stockSymbol,
    funds: reserve!.amount_in_reserve,
  }

  await client.db("Transaction-Server").collection('Logs').insertOne(systemLog);

  res.status(200).json({ response: 'SELL AMOUNT successfully cancelled.'});
})

/**
 * Returns a log file of the user's history if a user is provided, otherwise returns a complete log file of everything. 
 */
apiRouter.get('/DUMPLOG', async (req: Request, res: Response): Promise<void> => {
  const data: DumplogType = req.query as any;
  if(!data.fileName) {
    res.status(500).json({response: 'Missing fileName'});
    return;
  }
  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  
  //check if supervisor
  // if not - return user history into a file
  // if yes - returns a complete log file into a file
  let mongoData: FindCursor<WithId<Document>>;
  if(data.userId) {
    await logUserCommand(client, 'DUMPLOG', transactionNumber, {filename: data.fileName, userId: data.userId});
    mongoData = client.db("Transaction-Server").collection('Logs').find({ userId: data.userId, type: 'User' }, {sort: {timestamp: 1}});
  } else {
    await logUserCommand(client, 'DUMPLOG', transactionNumber, {filename: data.fileName});
    mongoData = client.db("Transaction-Server").collection('Logs').find().sort({timestamp: 1});
  }
  const logFilePath = await createLogFile(data.fileName, mongoData);
  res.status(200).download(logFilePath);
})

/**
 * Returns a summary of the user's account.
 */
apiRouter.get('/DISPLAY_SUMMARY',  async (req: Request, res: Response): Promise<void> => {
  const data: DisplaySummaryType = req.query as any;
  if(!data.userId) {
    res.status(500).json({response: 'Missing userId'});
    return;
  }

  const transactionNumber = await transactionNumberClass.getTransactionNumber();
  await logUserCommand(client, 'DISPLAY_SUMMARY', transactionNumber, {userId: data.userId});
  //get all user data
  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    await logError(client, transactionNumber, 'DISPLAY_SUMMARY', {userId: data.userId, errorMessage: 'User Not Found'})
    res.status(500).json({ response: 'User Not Found'});
    return;
  }
  
  const buyTriggers: TriggerMongo[] = (await client.db('Transaction-Server').collection('Triggers').find({user_id: user._id.toString(), type: 'BUY'}).toArray()) as any;
  const sellTriggers: TriggerMongo[] = (await client.db('Transaction-Server').collection('Triggers').find({user_id: user._id.toString(), type: 'SELL'}).toArray()) as any;
  const returnValue: DisplaySummaryReturnType = {
    transactionHistory: [],
    stocksOwned: user.stocks_owned,
    funds: user.account_balance,
    buyTriggers: buyTriggers,
    sellTriggers: sellTriggers,
  };
  const transactionPointer = client.db("Transaction-Server").collection('Transactions').find({ userId: data.userId}, {sort: {timestamp: -1}});
  await transactionPointer.forEach((transaction) => {
    const transactionType : TransactionMongo = transaction as TransactionMongo;
    returnValue.transactionHistory.push({
      timestamp: transactionType.timestamp,
      action: transactionType.transaction_type,
      stockSymbol: transactionType.stock_symbol,
      amount: transactionType.amount,
    })
  })
  res.status(200).json({response: 'Summary Data Retrieved', data: returnValue});
})


