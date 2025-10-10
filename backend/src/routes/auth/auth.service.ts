import { User } from '../../config/entity/User';
import {
  getUserByEmail,
  getUserByID,
  createUser,
  updateUserEmailVerified,
  updateUserLastLogin,
  updateUserPassword,
} from '../user/user.service';
import {
  getOAuthProviderByUserIdAndProvider,
  getOAuthProviderByProviderAndId,
  createOAuthProvider,
  updateOAuthProviderLastUsed,
  updateOAuthProvider,
} from './oauth.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, encryption } from '../../../index';

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
  const newUser = await createUser({
    name,
    email,
    password_hash: hashed_password,
  });
  const token = jwt.sign(
    { name: newUser.name, email: newUser.email },
    JWT_SECRET as string,
    {
      expiresIn: '1h',
    }
  );
  return token;
}

export async function verify(email: string) {
  const decryptedEmail = encryption.decryptFromString(email);
  const user = await getUserByEmail(decryptedEmail);
  if (!user) return new Error('User not found');
  await updateUserEmailVerified(user.id, true);
}

export async function requestReset(email: string) {
  const decryptedEmail = encryption.decryptFromString(email);
  const user = await getUserByEmail(decryptedEmail);
  if (!user) return null;

  const token = jwt.sign({ email: user.email }, JWT_SECRET as string, {
    expiresIn: '1h',
  });
  return token;
}

export async function resetPassword(email: string, newPassword: string) {
  const decryptedEmail = encryption.decryptFromString(email);
  const user = await getUserByEmail(decryptedEmail);
  if (!user) return new Error('User not found');

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const success = await updateUserPassword(user.id, hashedPassword);
    if (success) {
      return true;
    } else {
      return new Error('Failed to update password');
    }
  } catch {
    return new Error('Invalid or expired token');
  }
}

export async function connectOAuthProvider(
  userId: number,
  provider: string,
  providerId: string,
  providerEmail: string,
  name: string
): Promise<string | Error> {
  const existingProvider = await getOAuthProviderByUserIdAndProvider(
    userId,
    provider
  );

  if (existingProvider) {
    await updateOAuthProvider(existingProvider.id, {
      provider_id: providerId,
      provider_email: providerEmail,
      provider_username: name,
      last_used_at: new Date(),
    });
  } else {
    await createOAuthProvider({
      user_id: userId,
      provider,
      connection_type: 'service',
      provider_id: providerId,
      provider_email: providerEmail,
      provider_username: name,
    });
  }

  const user = await getUserByID(userId);
  if (!user) {
    return new Error('User not found');
  }

  await updateUserLastLogin(user.id);

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
  let oauthProvider = await getOAuthProviderByProviderAndId(
    provider,
    providerId
  );

  let user: User | null;

  if (oauthProvider) {
    user = oauthProvider.user;
  } else {
    user = await getUserByEmail(providerEmail);

    if (user) {
      await createOAuthProvider({
        user_id: user.id,
        provider,
        connection_type: 'auth',
        provider_id: providerId,
        provider_email: providerEmail,
        provider_username: name,
      });

      await updateUserEmailVerified(user.id, true);
    } else {
      user = await createUser({
        name,
        email: providerEmail || `${providerId}@${provider}.oauth`,
        password_hash: '',
        email_verified: true,
        is_active: true,
      });

      await createOAuthProvider({
        user_id: user.id,
        provider,
        connection_type: 'auth',
        provider_id: providerId,
        provider_email: providerEmail,
        provider_username: name,
      });
    }
  }

  if (!user) {
    return new Error('Failed to create or find user');
  }

  await updateUserLastLogin(user.id);

  if (oauthProvider) {
    await updateOAuthProviderLastUsed(oauthProvider.id);
  }

  const token = jwt.sign(
    { email: user.email, id: user.id, is_admin: user.is_admin },
    JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  return token;
}
