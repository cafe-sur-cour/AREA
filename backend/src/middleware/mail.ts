import { Request, Response, NextFunction } from 'express';

const mailMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Unauthorized' });

  req.token = token;
  return next();
};

export default mailMiddleware;
