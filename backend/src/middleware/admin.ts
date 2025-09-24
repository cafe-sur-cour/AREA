import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      is_admin?: boolean;
    };
  }
}

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth || req.auth.is_admin !== true) {
    console.log("Is admin status :", req.auth?.is_admin);
    return res.status(403).json({ msg: 'Forbidden' });
  }
  next();
};

export default adminMiddleware;
