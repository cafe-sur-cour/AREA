import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      role?: number;
    };
  }
}

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth || req.auth.role !== 2) {
    return res.status(403).json({ msg: 'Forbidden' });
  }
  next();
};

export default adminMiddleware;
