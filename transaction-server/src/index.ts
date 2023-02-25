import express, { Application, Request, Response } from 'express';
import { apiRouter } from './routes/api';



const app: Application = express();

app.use(express.json());
app.use('/api', apiRouter);



app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Page not found!' });
});

const port: number | string = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
