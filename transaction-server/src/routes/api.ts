import express, { Request, Response, Router } from 'express';
import { apiMiddleware } from '../middleware/api';

export const apiRouter: Router = express.Router();

apiRouter.use(apiMiddleware);

apiRouter.get('/', (req: Request, res: Response): void => {
  res.json({response: 'Hello, World!'});
});
