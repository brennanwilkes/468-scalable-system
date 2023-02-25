import express, { Request, Response, Router } from 'express';
import { AddType, BuyType, CancelBuyType, CancelSellType, CancelSetBuyType, CancelSetSellType, CommitBuyType, CommitSellType, DisplaySummaryType, DumplogType, QuoteType, SellType, SetBuyAmountType, SetBuyTriggerType, SetSellAmountType, SetSellTriggerType } from '../types';
import { apiMiddleware } from '../middleware/api';
import { getQuote } from '../functions/getQuote';
import { MongoClient } from 'mongodb';
import { UserMongo } from '../mongoTypes';

require('dotenv').config();

export const apiRouter: Router = express.Router();

const uri = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}:${process.env.MONGO_PORT}/?authMechanism=DEFAULT`;

const client = new MongoClient(uri);

apiRouter.use(apiMiddleware);

apiRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  

  console.log(await client.db('Transaction-Server').admin().listDatabases())
  await client.close()
  res.json({response: 'Hello, World!'});
});

//Commands in order of provided list https://www.ece.uvic.ca/~seng462/ProjectWebSite/Commands.html

apiRouter.post('/ADD', async (req: Request, res: Response): Promise<void> => {
  const data: AddType = req.body;

  await client.connect();
  const user: UserMongo = (await client.db('Transaction-Server').collection('Users').findOne({username: data.userId})) as any;
  if(user == null) {
    //User missing, create one -- TODO: Reevalutate this, how are users created? - James 24/02/23
    const newUser: UserMongo = {
      username: data.userId,
      account_balance: data.amount,
      stocks_owned: [],
      account_balance_reserves: [],
      stocks_owned_reserves: [],
      buy_triggers: [],
      sell_triggers: [],
      created: Date.now(),
      updated: Date.now(),
      credential: {
        username: 'admin',
        hash_password: 'temp',
        created: Date.now(),
        updated: Date.now(),
      },
      transactions: [],
    }
    console.log('Inserting User');
    await client.db("Transaction-Server").collection('Users').insertOne(newUser);
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
  const amount = await getQuote(data.stockSymbol);
  res.json({price: amount});
});

apiRouter.post('/BUY', (req: Request, res: Response): void => {
  const data: BuyType = req.body;
  //Account must have enough money
  //Save transaction temporarily in mongo, do not execute. 
  console.log(data);
  res.json({response: 'Hello, World!'});
});

apiRouter.post('/COMMIT_BUY', (req: Request, res: Response): void => {
  const data: CommitBuyType = req.body;
  //User must have a buy within previous 60 seconds - most recent
  //Account depletes, but stock added to account
  res.json({response: 'Hello, World!'});
});

apiRouter.post('/CANCEL_BUY', (req: Request, res: Response): void => {
  const data: CancelBuyType = req.body;
  //User must have a buy within previous 60 seconds - most recent
  //BUY is cancelled 
  res.json({response: 'Hello, World!'});
});

apiRouter.post('/SELL', (req: Request, res: Response): void => {
  const data: SellType = req.body;
  //User most hold enough stock
  //Save transaction temporarily in mongo, do not execute. 
  res.json({response: 'Hello, World!'});
});

apiRouter.post('/COMMIT_SELL', (req: Request, res: Response): void => {
  const data: CommitSellType = req.body;
  //User must have a Sell within previous 60 seconds - most recent
  //Stock depletes, but account money increases
  res.json({response: 'Hello, World!'});
});

apiRouter.post('/CANCEL_SELL', (req: Request, res: Response): void => {
  const data: CancelSellType = req.body;
  //User must have a sell within previous 60 seconds - most recent
  //SELL is cancelled 
  res.json({response: 'Hello, World!'});
});

apiRouter.post('/SET_BUY_AMOUNT', (req: Request, res: Response): void => {
  const data: SetBuyAmountType = req.body;
  //Cash of user must be hihger than buy amount at transaction time
  //Creates a reserve
  // User cash removed to that reserve
  // reserve is emptied at buy time, stock added to account
  res.json({response: 'Hello, World!'});
})

apiRouter.post('/CANCEL_SET_BUY', (req: Request, res: Response): void => {
  const data: CancelSetBuyType = req.body;
  //Must havea set_buy for stock
  // Put reserves back into account
  // Buy trigger cancelled
  res.json({response: 'Hello, World!'});
})

apiRouter.post('/SET_BUY_TRIGGER', (req: Request, res: Response): void => {
  const data: SetBuyTriggerType = req.body;
  // Specify buy_amount first
  // Update db
  res.json({response: 'Hello, World!'});
})

apiRouter.post('/SET_SELL_AMOUNT', (req: Request, res: Response): void => {
  const data: SetSellAmountType = req.body;
  //Stock of user must be hihger than sell amount
  //Creates a reserve
  // User stock removed to that reserve
  // reserve is emptied at sell time, cash added to account
  res.json({response: 'Hello, World!'});
})

apiRouter.post('/SET_SELL_TRIGGER', (req: Request, res: Response): void => {
  const data: SetSellTriggerType = req.body;
  // Specify sell_amount first
  // Update db
  res.json({response: 'Hello, World!'});
})

apiRouter.post('/CANCEL_SET_SELL', (req: Request, res: Response): void => {
  const data: CancelSetSellType = req.body;
  // Must havea set_sell for stock
  // Put reserves back into account
  // sell trigger cancelled
  res.json({response: 'Hello, World!'});
})

apiRouter.get('/DUMPLOG', (req: Request, res: Response): void => {
  const data: DumplogType = req.params as any;
  //check if supervisor
  // if not - return user history into a file
  // if yes - returns a complete log file into a file
  res.json({response: 'Hello, World!'});
})

apiRouter.get('/DISPLAY_SUMMARY',  (req: Request, res: Response): void => {
  const data: DisplaySummaryType = req.params as any;
  //get all user data
  res.json({response: 'Hello, World!'});
})


