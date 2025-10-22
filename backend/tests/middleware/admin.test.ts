import { Request, Response, NextFunction } from 'express';
import adminMiddleware from '../../src/middleware/admin';

describe('Admin Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() when user is admin', () => {
    mockReq.auth = { is_admin: true };

    adminMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 403 when req.auth is undefined', () => {
    mockReq.auth = undefined;

    adminMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Forbidden' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when req.auth.is_admin is false', () => {
    mockReq.auth = { is_admin: false };

    adminMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Forbidden' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when req.auth.is_admin is undefined', () => {
    mockReq.auth = { is_admin: undefined };

    adminMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Forbidden' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when req.auth.is_admin is null', () => {
    mockReq.auth = { is_admin: null as any };

    adminMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Forbidden' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when req.auth.is_admin is not strictly true', () => {
    mockReq.auth = { is_admin: 1 as any };

    adminMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Forbidden' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
