import { AppDataSource } from './config/db';
import { User } from './config/entity/User';
import { getUserByEmail } from './routes/user/user.service';

/* Example of saving elem in table */
export const saveData = async () => {
  if (await getUserByEmail('alice@example.com')) {
    console.log('User already exists');
    return;
  }
  const user = new User();
  user.name = 'Alice';
  user.email = 'alice@example.com';
  user.password_hash =
    '$2b$10$07icanS1KkeTriOqW1w1A.P3FE04VWfHiFj7JYRHcFALBViNJ3B/q';
  user.is_admin = true;
  user.email_verified = true;

  await AppDataSource.manager.save(user);
  console.log('Saved a new user:', user);
};
