import { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';

export const apiMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  helmet()(req, res, next);
};
