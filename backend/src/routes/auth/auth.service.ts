import { User } from '../../config/entity/User';
import { UserOAuthProvider } from '../../config/entity/UserOAuthProvider';
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
  const token = jwt.sign(
    { name: newUser.name, email: newUser.email },
    JWT_SECRET as string,
    {
      expiresIn: '1h',
    }
  );
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

export async function connectOAuthProvider(
  userId: number,
  provider: string,
  providerId: string,
  providerEmail: string,
  name: string
): Promise<string | Error> {
  const oauthProviderRepository =
    AppDataSource.getRepository(UserOAuthProvider);

  const existingProvider = await oauthProviderRepository.findOne({
    where: {
      user_id: userId,
      provider: provider,
    },
  });

  if (existingProvider) {
    existingProvider.provider_id = providerId;
    existingProvider.provider_email = providerEmail;
    existingProvider.provider_username = name;
    existingProvider.last_used_at = new Date();
    await oauthProviderRepository.save(existingProvider);
  } else {
    const newProvider = oauthProviderRepository.create({
      user_id: userId,
      provider: provider,
      provider_id: providerId,
      provider_email: providerEmail,
      provider_username: name,
    });
    await oauthProviderRepository.save(newProvider);
  }

  const user = await AppDataSource.getRepository(User).findOneBy({
    id: userId,
  });
  if (!user) {
    return new Error('User not found');
  }

  user.last_login_at = new Date();
  await AppDataSource.manager.save(user);

  const token = jwt.sign(
    { email: user.email, id: user.id, is_admin: user.is_admin },
    JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  return token;
}

export async function oauthLogin(
  provider: string,
  providerId: string,
  providerEmail: string,
  name: string
): Promise<string | Error> {
  const oauthProviderRepository =
    AppDataSource.getRepository(UserOAuthProvider);

  let oauthProvider = await oauthProviderRepository.findOne({
    where: {
      provider: provider,
      provider_id: providerId,
    },
    relations: ['user'],
  });

  let user: User | null;

  if (oauthProvider) {
    user = oauthProvider.user;
  } else {
    user = await getUserByEmail(providerEmail);

    if (user) {
      oauthProvider = oauthProviderRepository.create({
        user_id: user.id,
        provider: provider,
        provider_id: providerId,
        provider_email: providerEmail,
        provider_username: name,
      });
      await oauthProviderRepository.save(oauthProvider);

      user.email_verified = true;
      await AppDataSource.manager.save(user);
    } else {
      user = new User();
      user.name = name;
      user.email = providerEmail || `${providerId}@${provider}.oauth`;
      user.password_hash = '';
      user.email_verified = true;
      user.is_active = true;
      await AppDataSource.manager.save(user);

      oauthProvider = oauthProviderRepository.create({
        user_id: user.id,
        provider: provider,
        provider_id: providerId,
        provider_email: providerEmail,
        provider_username: name,
      });
      await oauthProviderRepository.save(oauthProvider);
    }
  }

  if (!user) {
    return new Error('Failed to create or find user');
  }

  user.last_login_at = new Date();
  await AppDataSource.manager.save(user);

  oauthProvider.last_used_at = new Date();
  await oauthProviderRepository.save(oauthProvider);

  const token = jwt.sign(
    { email: user.email, id: user.id, is_admin: user.is_admin },
    JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  return token;
}
