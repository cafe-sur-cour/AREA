import { User } from '../../config/entity/User';
import { AppDataSource } from '../../config/db';
import { getUserByEmail } from '../user/user.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../../index';

export async function login(email: string, password_hash: string) {
  const foundUser = await getUserByEmail(email);
  if (!foundUser) return new Error('User not found');
  if (!foundUser.email_verified) return new Error('Email not verified');
  const match = await bcrypt.compare(password_hash, foundUser.password_hash);
  if (!match) return new Error('Incorrect Password');
  const token = jwt.sign(
    { email: foundUser.email, id: foundUser.id, is_admin: foundUser.is_admin },
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
  const token = jwt.sign({ name: newUser.name, email: newUser.email }, JWT_SECRET as string, {
    expiresIn: '1h',
  });
  await AppDataSource.manager.save(newUser);
  return token;
}

export async function verify(email: string) {
  const user = await getUserByEmail(email);
  if (!user) return new Error('User not found');
  user.email_verified = true;
  await AppDataSource.manager.save(user);
}

export async function requestReset(email: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const token = jwt.sign({ email: user.email }, JWT_SECRET as string, {
    expiresIn: '1h',
  });
  return token;
}
