import express, { Request, Response, Router } from 'express';
import { apiMiddleware } from '../middleware/api';
import httpProxy from 'http-proxy';

const apiProxy = httpProxy.createProxyServer();

export const apiRouter: Router = express.Router();

apiRouter.use(apiMiddleware);

apiRouter.get('/health', (req: Request, res: Response): void => {
  res.json({healthy: true});
});

//TODO: Add message broker eg. kafka
apiRouter.use((req: Request, res: Response): void => {
  apiProxy.web(req, res, { target: 'http://localhost:3001' });
});
