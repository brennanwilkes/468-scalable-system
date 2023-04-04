import express, { Application, Request, Response } from 'express';
import { apiRouter } from './routes/api';
import * as fs from 'fs';
import path from 'path';
import cors from 'cors';


const app: Application = express();

app.use(express.json());
app.use(cors())
app.use('/api', apiRouter);

//If log directory does not exist
if(!fs.existsSync(path.resolve(__dirname, 'logs'))) {
  fs.mkdirSync(path.resolve(__dirname, 'logs'));
}

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Page not found!' });
});

const port =  8000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
