import { User } from '../../config/entity/User';
import { AppDataSource } from '../../config/db';
import { getUserByEmail } from '../user/user.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../../index';

export async function login(email: string, password_hash: string) {
  const foundUser = await getUserByEmail(email);
  if (!foundUser) return new Error('User not found');
  const match = await bcrypt.compare(password_hash, foundUser.password_hash);
  if (!match) return new Error('Incorrect Password');
  const token = jwt.sign(
    { email: foundUser.email, id: foundUser.id },
    JWT_SECRET as string,
    { expiresIn: '1h' }
  );
  return token;
}

export async function register(email: string, name: string, password: string) {
  const foundUser = await getUserByEmail(email);
  if (foundUser) return new Error('Account already exists');
  const hashed_password = await bcrypt.hash(password, 10);
  const newUser = new User();
  newUser.name = name;
  newUser.email = email;
  newUser.password_hash = hashed_password;
  await AppDataSource.manager.save(newUser);
}
