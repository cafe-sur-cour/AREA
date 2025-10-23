import { Request, Response, NextFunction } from 'express';

const mailMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: 'Unauthorized' });

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2) return res.status(401).json({ msg: 'Unauthorized' });

  const token = parts[1];
  if (!token) return res.status(401).json({ msg: 'Unauthorized' });

  req.token = token.trim();
  return next();
};

export default mailMiddleware;
