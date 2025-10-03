import { Logger } from '../../config/entity/Logger';
import { AppDataSource } from '../../config/db';

export const createLog = async (
  error: number,
  kind: 'login' | 'logout' | 'register' | 'user' | 'other',
  message: string | null
): Promise<Logger> => {
  const log = new Logger();
  log.type =
    error < 200 ? 'info' : error < 300 ? 'succ' : error < 400 ? 'warn' : 'err';
  log.kind = kind;
  log.message = message;
  return await AppDataSource.manager.save(log);
};
