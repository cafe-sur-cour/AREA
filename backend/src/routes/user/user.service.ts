import { User } from '../../config/entity/User';
import { AppDataSource } from '../../config/db';
import { Repository } from 'typeorm';

/* Thos function returns a user from data */
export const getAllUsers = async (): Promise<User[]> => {
  return await AppDataSource.manager.find(User);
};

export const getUserByID = async (id: number): Promise<User | null> => {
  return await AppDataSource.manager.findOneBy(User, { id });
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  return AppDataSource.manager.findOneBy(User, { email });
};

export const getUserByName = async (name: string): Promise<User | null> => {
  return AppDataSource.manager.findOneBy(User, { name });
};

/* Those function update or delete info from a user */

interface UpdateUserDTO {
  name?: string;
  bio?: string;
  picture?: string;
}

interface CreateUserDTO {
  name: string;
  email: string;
  password_hash: string;
  email_verified?: boolean;
  is_active?: boolean;
}

export const deleteUserById = async (id: number): Promise<boolean> => {
  const user = await getUserByID(id);
  if (!user) return false;
  await AppDataSource.manager.delete(User, { id });
  return true;
};

export async function updateUser(
  id: number,
  userData: UpdateUserDTO
): Promise<User | null> {
  const userRepository: Repository<User> = AppDataSource.getRepository(User);

  const updateResult = await userRepository.update(id, userData);

  if (updateResult.affected && updateResult.affected > 0) {
    return userRepository.findOne({ where: { id } });
  }

  return null;
}

export const updateUserPassword = async (
  id: number,
  new_password: string
): Promise<boolean> => {
  const user = getUserByID(id);
  if (!user) return false;
  AppDataSource.manager.update(User, { id }, { password_hash: new_password });
  return true;
};

export const updateUserName = async (
  id: number,
  new_name: string
): Promise<boolean> => {
  const user = getUserByID(id);
  if (!user) return false;
  AppDataSource.manager.update(User, { id }, { name: new_name });
  return true;
};

/* Those function are here for app gestion */
export const getNbUser = async (): Promise<number | null> => {
  return AppDataSource.manager.count(User);
};

export const createUser = async (userData: CreateUserDTO): Promise<User> => {
  const user = new User();
  user.name = userData.name;
  user.email = userData.email;
  user.password_hash = userData.password_hash;
  if (userData.email_verified !== undefined)
    user.email_verified = userData.email_verified;
  if (userData.is_active !== undefined) user.is_active = userData.is_active;
  return await AppDataSource.manager.save(user);
};

export const updateUserEmailVerified = async (
  id: number,
  email_verified: boolean
): Promise<boolean> => {
  const user = await getUserByID(id);
  if (!user) return false;
  await AppDataSource.manager.update(User, { id }, { email_verified });
  return true;
};

export const updateUserLastLogin = async (id: number): Promise<boolean> => {
  const user = await getUserByID(id);
  if (!user) return false;
  await AppDataSource.manager.update(
    User,
    { id },
    { last_login_at: new Date() }
  );
  return true;
};
