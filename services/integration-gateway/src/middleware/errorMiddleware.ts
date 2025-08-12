import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Gateway Error: ${err.message}`);

  res.status(500).json({
    success: false,
    message: 'Internal Gateway Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
