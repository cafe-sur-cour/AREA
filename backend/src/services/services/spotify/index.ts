import type { Service } from '../../../types/service';
import { spotifyActions } from './actions';
import { spotifyReactions } from './reactions';
import { spotifyReactionExecutor } from './executor';
import { getIconSvg } from '../../../utils/iconMapping';

const spotifyService: Service = {
  id: 'spotify',
  name: 'Spotify',
  description: 'Spotify service for music streaming integration',
  version: '1.0.0',
  icon: getIconSvg('FaSpotify'),
  actions: spotifyActions,
  reactions: spotifyReactions,
  getCredentials: async (userId: number) => {
    const { spotifyOAuth } = await import('./oauth');
    const userToken = await spotifyOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
};

export default spotifyService;

export const executor = spotifyReactionExecutor;

export async function initialize(): Promise<void> {
  console.log('Initializing Spotify service...');
  console.log('Spotify service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Spotify service...');
  console.log('Spotify service cleaned up');
}
