import { Request, Response, NextFunction, RequestHandler } from 'express';

export const apiMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  console.log('Middleware function called!');
  next();
};
