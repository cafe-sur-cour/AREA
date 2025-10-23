import { Request, Response, NextFunction } from 'express';
import mailMiddleware from '../../src/middleware/mail';

describe('Mail Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when authorization header is missing', () => {
    mailMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is empty', () => {
    mockReq.headers = { authorization: '' };

    mailMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should extract token from any authorization header format', () => {
    mockReq.headers = { authorization: 'Basic token123' };

    mailMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect((mockReq as any).token).toBe('token123');
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is Bearer without token', () => {
    mockReq.headers = { authorization: 'Bearer ' };

    mailMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is Bearer with only whitespace', () => {
    mockReq.headers = { authorization: 'Bearer   ' };

    mailMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should set req.token and call next() when valid Bearer token is provided', () => {
    const token = 'valid.jwt.token';
    mockReq.headers = { authorization: `Bearer ${token}` };

    mailMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect((mockReq as any).token).toBe(token);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should handle case-insensitive Bearer prefix', () => {
    const token = 'valid.jwt.token';
    mockReq.headers = { authorization: `bearer ${token}` };

    mailMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect((mockReq as any).token).toBe(token);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should extract token correctly with extra spaces', () => {
    const token = 'valid.jwt.token';
    mockReq.headers = { authorization: `Bearer  ${token}  ` };

    mailMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect((mockReq as any).token).toBe('valid.jwt.token');
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
