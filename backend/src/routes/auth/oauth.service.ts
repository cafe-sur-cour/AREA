import { UserOAuthProvider } from '../../config/entity/UserOAuthProvider';
import { AppDataSource } from '../../config/db';

interface CreateOAuthProviderDTO {
  user_id: number;
  provider: string;
  connection_type: 'auth' | 'service';
  provider_id: string;
  provider_email?: string;
  provider_username?: string;
  provider_profile_data?: string;
}

export const getOAuthProviderByUserIdAndProvider = async (
  userId: number,
  provider: string
): Promise<UserOAuthProvider | null> => {
  return await AppDataSource.manager.findOneBy(UserOAuthProvider, {
    user_id: userId,
    provider,
  });
};

export const getOAuthProviderByProviderAndId = async (
  provider: string,
  providerId: string
): Promise<UserOAuthProvider | null> => {
  return await AppDataSource.getRepository(UserOAuthProvider).findOne({
    where: {
      provider,
      provider_id: providerId,
    },
    relations: ['user'],
  });
};

export const createOAuthProvider = async (
  oauthData: CreateOAuthProviderDTO
): Promise<UserOAuthProvider> => {
  const oauthProviderRepository =
    AppDataSource.getRepository(UserOAuthProvider);
  const oauthProvider = oauthProviderRepository.create(oauthData);
  return await oauthProviderRepository.save(oauthProvider);
};

export const updateOAuthProviderLastUsed = async (
  id: number
): Promise<boolean> => {
  const oauthProviderRepository =
    AppDataSource.getRepository(UserOAuthProvider);
  const updateResult = await oauthProviderRepository.update(id, {
    last_used_at: new Date(),
  });
  return updateResult.affected ? updateResult.affected > 0 : false;
};

export const updateOAuthProvider = async (
  id: number,
  updateData: Partial<CreateOAuthProviderDTO & { last_used_at?: Date }>
): Promise<boolean> => {
  const oauthProviderRepository =
    AppDataSource.getRepository(UserOAuthProvider);
  const updateResult = await oauthProviderRepository.update(id, updateData);
  return updateResult.affected ? updateResult.affected > 0 : false;
};
