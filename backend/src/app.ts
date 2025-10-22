import { AppDataSource } from './config/db';
import { User } from './config/entity/User';
import { encryption } from '../index';
import { getUserByEmail } from './routes/user/user.service';

/* Example of saving elem in table */
export const saveData = async () => {
  if (await getUserByEmail('alice@example.com')) {
    console.log('User already exists');
    return;
  }
  const user = new User();
  user.name = encryption.encryptToString('Alice');
  user.email = encryption.encryptToString('alice@example.com');
  user.password_hash =
    '$2b$10$07icanS1KkeTriOqW1w1A.P3FE04VWfHiFj7JYRHcFALBViNJ3B/q';
  user.is_admin = true;
  user.email_verified = true;
  await AppDataSource.manager.save(user);

  const newUSer = new User();
  newUSer.name = encryption.encryptToString('Bob');
  newUSer.email = encryption.encryptToString('bob@example.com');
  newUSer.password_hash =
    '$2b$10$07icanS1KkeTriOqW1w1A.P3FE04VWfHiFj7JYRHcFALBViNJ3B/q';
  newUSer.email_verified = true;

  await AppDataSource.manager.save(newUSer);
  console.log('Saved a new user:', user);
};
