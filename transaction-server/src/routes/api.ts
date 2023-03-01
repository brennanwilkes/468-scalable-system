import express, { Request, Response, Router } from 'express';
import { AddType, BuyType, CancelBuyType, CancelSellType, CancelSetBuyType, CancelSetSellType, CommitBuyType, CommitSellType, DisplaySummaryType, DumplogType, QuoteType, SellType, SetBuyAmountType, SetBuyTriggerType, SetSellAmountType, SetSellTriggerType } from '../types';
import { apiMiddleware } from '../middleware/api';
import { getQuote } from '../functions/getQuote';
import { MongoClient, FindCursor, WithId, Document } from 'mongodb';
import { CredentialMongo, TransactionMongo, UserMongo } from '../mongoTypes';
import {v4 as uuidv4} from 'uuid';
import { logUserCommand } from '../functions/logUserCommand';
import { createLogFile } from '../functions/createLogFile';

require('dotenv').config();

export const apiRouter: Router = express.Router();

const uri = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}:${process.env.MONGO_PORT}/?authMechanism=DEFAULT`;

const client = new MongoClient(uri);
client.connect();

apiRouter.use(apiMiddleware);

apiRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  

  console.log(await client.db('Transaction-Server').admin().listDatabases())
  res.json({response: 'Hello, World!'});
});

//Commands in order of provided list https://www.ece.uvic.ca/~seng462/ProjectWebSite/Commands.html

apiRouter.post('/ADD', async (req: Request, res: Response): Promise<void> => {
  const data: AddType = req.body;
  await logUserCommand(client, 'ADD', data.userId, {funds: data.amount});

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
      account_balance: data.amount,
      stocks_owned: [],
      account_balance_reserves: [],
      stocks_owned_reserves: [],
      buy_triggers: [],
      sell_triggers: [],
      created: Date.now(),
      updated: Date.now(),
      credential_id: credentialResult.insertedId.toString(),
    }
    const userResult = await client.db("Transaction-Server").collection('Users').insertOne(newUser);
    res.json({response: `Account Created and Amount added to Account. Account holds ${newUser.account_balance}`});
  } else {
    user.account_balance += data.amount;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    res.json({response: `Amount added to Account. Account now holds ${user.account_balance}`});
  }
  
});

apiRouter.get('/QUOTE', async (req: Request, res: Response): Promise<void> => {
  const data: QuoteType = req.query as any;
  await logUserCommand(client, 'QUOTE', data.userId, {stockSymbol: data.stockSymbol});
  const amount = await getQuote(data.stockSymbol);
  res.json({price: amount.price});
});

apiRouter.post('/BUY', async (req: Request, res: Response): Promise<void> => {
  //Account must have enough money
  //Stage transaction temporarily in mongo, do not execute.
  const data: BuyType = req.body;
  await logUserCommand(client, 'BUY', data.userId, {funds: data.amount, stockSymbol: data.stockSymbol});

  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    res.json({success: false, response: 'User Not Found'});
    return;
  }

  if(user.account_balance < data.amount) {
    res.json({success: false, response: 'Not enough funds'});
    return;
  }

  const getQuoteResult = await getQuote(data.stockSymbol);
  user.pending_buy = {stock_name: data.stockSymbol, stock_price: getQuoteResult.price,amount_to_buy: data.amount, timestamp: Date.now(), cryptokey: getQuoteResult.cryptokey};
  user.updated = Date.now();

  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});


   
  res.json({success: true, response: 'Ready to Buy, Please Commit or Cancel'});
});

apiRouter.post('/COMMIT_BUY', async (req: Request, res: Response): Promise<void> => {
  //User must have a buy within previous 60 seconds - most recent
  //Account depletes, but stock added to account
  const data: CommitBuyType = req.body;
  await logUserCommand(client, 'COMMIT_BUY', data.userId);
  
  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    res.json({success: false, response: 'User Not Found'});
    return;
  }

  if(user.pending_buy == null) {
    res.json({success: false, response: 'No pending BUY commands found. Please run a BUY command first'});
    return;
  }

  if(Date.now() - user.pending_buy.timestamp > 60_000) {
    user.pending_buy = undefined;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    res.json({success: false, response: 'Pending BUY command too old. Please try again'});
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
    cryptokey: user.pending_buy.cryptokey,
    user_id: user._id.toString(),
  }
  await client.db("Transaction-Server").collection('Transactions').insertOne(transaction);
  
  user.pending_buy = undefined;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});

  res.json({success: true, response: `Stock purchased. You now own ${stockAmount} shares of ${stockName} stock`});
});

apiRouter.post('/CANCEL_BUY', async (req: Request, res: Response): Promise<void> => {
  //User must have a buy within previous 60 seconds - most recent
  //BUY is cancelled 
  const data: CancelBuyType = req.body;
  await logUserCommand(client, 'CANCEL_BUY', data.userId);
  
  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    res.json({success: false, response: 'User Not Found'});
    return;
  }

  if(user.pending_buy == null) {
    res.json({success: false, response: 'No pending BUY commands found.'});
    return;
  }

  //Command stipulates a 60 second limit here, but it makes no difference for this function lol. - James 24/02/23
  if(Date.now() - user.pending_buy.timestamp > 60_000) {
    user.pending_buy = undefined;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    res.json({success: false, response: 'Pending BUY command too old. Please try again'});
    return;
  }

  user.pending_buy = undefined;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  res.json({success: true, response: `Transaction Cancelled`});
});

apiRouter.post('/SELL', async (req: Request, res: Response): Promise<void> => {
  //User most hold enough stock
  //Save transaction temporarily in mongo, do not execute. 
  const data: SellType = req.body;
  await logUserCommand(client, 'SELL', data.userId, {funds: data.amount, stockSymbol: data.stockSymbol});

  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    res.json({success: false, response: 'User Not Found'});
    return;
  }

  const stock = user.stocks_owned.find((value) => {
    if(value.stock_name == data.stockSymbol) {
      return value;
    }
  })

  if(stock == null) {
    res.json({success: false, response: 'You do not have any of that stock'});
    return;
  }

  const getQuoteResult = await getQuote(data.stockSymbol);
  const dollarAmountCurrentlyHeld = getQuoteResult.price * stock.amount;

  if(dollarAmountCurrentlyHeld < data.amount) {
    res.json({success: false, response: 'Requesting to sell more stock than you have in dollar amounts'});
    return;
  }

  user.pending_sell = {stock_name: data.stockSymbol, stock_price: getQuoteResult.price, amount_to_sell: data.amount, timestamp: Date.now(), cryptokey: getQuoteResult.cryptokey};
  user.updated = Date.now();

  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});


   
  res.json({success: true, response: 'Ready to Sell, Please Commit or Cancel'});

});

apiRouter.post('/COMMIT_SELL', async (req: Request, res: Response): Promise<void> => {
  //User must have a Sell within previous 60 seconds - most recent
  //Stock depletes, but account money increases
  const data: CommitSellType = req.body;
  await logUserCommand(client, 'COMMIT_SELL', data.userId);
  

  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    res.json({success: false, response: 'User Not Found'});
    return;
  }

  if(user.pending_sell == null) {
    res.json({success: false, response: 'No pending SELL commands found. Please run a SELL command first'});
    return;
  }

  if(Date.now() - user.pending_sell.timestamp > 60_000) {
    user.pending_sell = undefined;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    res.json({success: false, response: 'Pending SELL command too old. Please try again'});
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
    res.json({success: false, response: 'Stock could not be found in account. Command cancelled'});
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
    cryptokey: user.pending_sell.cryptokey,
    user_id: user._id.toString(),
  }
  await client.db("Transaction-Server").collection('Transactions').insertOne(transaction);
  
  user.pending_buy = undefined;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});

  res.json({success: true, response: `Stock purchased. You sold ${stockAmount} shares of ${stockName} stock for a total of \$${amountToSell}`});
});

apiRouter.post('/CANCEL_SELL', async (req: Request, res: Response): Promise<void> => {
  //User must have a sell within previous 60 seconds - most recent
  //SELL is cancelled
  const data: CancelSellType = req.body;
  await logUserCommand(client, 'CANCEL_SELL', data.userId);

  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    res.json({success: false, response: 'User Not Found'});
    return;
  }

  if(user.pending_sell == null) {
    res.json({success: false, response: 'No pending SELL commands found.'});
    return;
  }

  //Command stipulates a 60 second limit here, but it makes no difference for this function lol. - James 24/02/23
  if(Date.now() - user.pending_sell.timestamp > 60_000) {
    user.pending_sell = undefined;
    user.updated = Date.now();
    await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
    res.json({success: false, response: 'Pending SELL command too old. Please try again'});
    return;
  }

  user.pending_sell = undefined;
  user.updated = Date.now();
  await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  res.json({success: true, response: `Transaction Cancelled`});
});

apiRouter.post('/SET_BUY_AMOUNT', async (req: Request, res: Response): Promise<void> => {
  const data: SetBuyAmountType = req.body;
  await logUserCommand(client, 'SET_BUY_AMOUNT', data.userId, {funds: data.amount, stockSymbol: data.stockSymbol});
  //Cash of user must be hihger than buy amount at transaction time
  //Creates a reserve
  // User cash removed to that reserve
  // reserve is emptied at buy time, stock added to account

  //WIP - James 24/02/23
  // const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  // if(user == null) {
  //   res.json({success: false, response: 'User Not Found'});
  //   return;
  // }

  // if(user.account_balance_reserves.length == 0) {
  //   res.json({success: false, response: 'No valid BUY transactions found. Please make a BUY transaction'});
  //   return;
  // }

  // let newestTimestamp = 0;
  // let indexOfReserve = 0;
  // user.account_balance_reserves.map((value, index) => {
  //     if(value.timestamp > newestTimestamp) {
  //       newestTimestamp = value.timestamp;
  //       indexOfReserve = index
  //     }
  // })

  // const transaction = user.account_balance_reserves[indexOfReserve];
  // user.account_balance_reserves.splice(indexOfReserve, 1);

  // if(Date.now() - newestTimestamp > 60_000) {
  //   user.account_balance += transaction.amount_in_reserve;
  //   user.updated = Date.now();
  //   await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  //   res.json({success: false, response: 'BUY transaction too old. Please try again'});
  //   return;
  // }

  // const stockPrice = await getQuote(transaction.stock_name);
  // const amountOfStock = transaction.amount_in_reserve / stockPrice;
  

  // let ownedStockIndex = 0;
  // const ownedStock = user.stocks_owned.find((value, index) => {
  //   if(value.stock_name == transaction.stock_name) {
  //     ownedStockIndex = index;
  //     return value;
  //   }
  // })

  // let stockAmount;
  // if(ownedStock == null) {
  //   stockAmount = amountOfStock;
  //   user.stocks_owned.push({stock_name: transaction.stock_name, amount: amountOfStock});
  // } else {
  //   stockAmount = amountOfStock + ownedStock.amount;
  //   user.stocks_owned[ownedStockIndex] = {stock_name: transaction.stock_name, amount: ownedStock.amount + amountOfStock};
  // }
  // user.updated = Date.now();
  // await client.db("Transaction-Server").collection('Users').updateOne({username: user.username}, {$set: user});
  // res.json({success: true, response: `Stock purchased. You now own ${stockAmount} shares of ${transaction.stock_name} stock`});
  res.json({response: 'Hello, World!'});
})

apiRouter.post('/CANCEL_SET_BUY', async (req: Request, res: Response): Promise<void> => {
  const data: CancelSetBuyType = req.body;
  await logUserCommand(client, 'CANCEL_SET_BUY', data.userId, {stockSymbol: data.stockSymbol});
  //Must havea set_buy for stock
  // Put reserves back into account
  // Buy trigger cancelled
  res.json({response: 'Hello, World!'});
})

apiRouter.post('/SET_BUY_TRIGGER', async (req: Request, res: Response): Promise<void> => {
  const data: SetBuyTriggerType = req.body;

  // Check if user has enough balance to create a trigger
  const account = getAccountBalance(data.userId);
  if (!account || account.balance < data.buy_amount) {
    return res.status(400).json({ error: 'Insufficient account balance.' });
  }

  // Create buy trigger
  const buyTrigger = {
    id: uuidv4(),
    user_id: data.userId,
    stock_id: data.stockId,
    reserved_balance: data.buy_amount
  };

  // Update db
  db.buy_triggers.push(buyTrigger);
  account.balance -= data.buy_amount;

  res.json({ response: 'Set buy_trigger successful.' });
});



apiRouter.post('/SET_SELL_AMOUNT', (req: Request, res: Response): void => {
  const data: SetSellAmountType = req.body;
  //Stock of user must be hihger than sell amount
  //Creates a reserve
  // User stock removed to that reserve
  // reserve is emptied at sell time, cash added to account
  res.json({response: 'Hello, World!'});
})

apiRouter.post('/SET_SELL_TRIGGER', async (req: Request, res: Response): Promise<void> => {
  const data: SetSellTriggerType = req.body;
  await logUserCommand(client, 'SET_SELL_TRIGGER', data.userId, {funds: data.amount, stockSymbol: data.stockSymbol});
  // Specify sell_amount first
  // Update db
  res.json({response: 'Hello, World!'});
})

apiRouter.post('/CANCEL_SET_SELL', async (req: Request, res: Response): Promise<void> => {
  const data: CancelSetSellType = req.body;
  await logUserCommand(client, 'CANCEL_SET_SELL', data.userId, { stockSymbol: data.stockSymbol});
  // Must havea set_sell for stock
  // Put reserves back into account
  // sell trigger cancelled
  res.json({response: 'Hello, World!'});
})

apiRouter.get('/DUMPLOG', async (req: Request, res: Response): Promise<void> => {
  const data: DumplogType = req.query as any;
  //check if supervisor
  // if not - return user history into a file
  // if yes - returns a complete log file into a file
  let mongoData: FindCursor<WithId<Document>>;
  if(data.userId) {
    await logUserCommand(client, 'DUMPLOG', data.userId, {filename: data.fileName});
    mongoData = client.db("Transaction-Server").collection('Logs').find({ userId: data.userId, type: 'User' }, {sort: {timestamp: 1}});
  } else {
    mongoData = client.db("Transaction-Server").collection('Logs').find().sort({timestamp: 1});
  }
  const logFilePath = await createLogFile(data.fileName, mongoData);
  
  res.json({success: true, response: 'XML Log Genereated and Saved on the Server'});
})

apiRouter.get('/DISPLAY_SUMMARY',  async (req: Request, res: Response): Promise<void> => {
  const data: DisplaySummaryType = req.query as any;
  await logUserCommand(client, 'DUMPLOG', data.userId,);
  //get all user data
  res.json({response: 'Hello, World!'});
})


