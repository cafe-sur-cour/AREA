import { Request, Response, NextFunction } from "express";
import { User } from '../config/entity/User';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        role?: number;
      };
    }
  }
}

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth || req.auth.role !== 2) {
    return res.status(403).json({ msg: "Forbidden" });
  }
  next();
};

export default adminMiddleware;
