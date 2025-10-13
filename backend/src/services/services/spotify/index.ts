import type { Service } from '../../../types/service';
import { spotifyActions } from './actions';
import { spotifyReactions } from './reactions';
import { spotifyReactionExecutor } from './executor';
import { SpotifyScheduler } from './SpotifyScheduler';
import { getIconSvg } from '../../../utils/iconMapping';

const spotifyService: Service = {
  id: 'spotify',
  name: 'Spotify',
  description: 'Spotify service for music streaming integration',
  version: '1.0.0',
  icon: getIconSvg('FaSpotify'),
  actions: spotifyActions,
  reactions: spotifyReactions,
  oauth: {
    enabled: true,
    supportsLogin: false,
  },
  getCredentials: async (userId: number) => {
    const { spotifyOAuth } = await import('./oauth');
    const userToken = await spotifyOAuth.getUserToken(userId);
    return userToken ? { access_token: userToken.token_value } : {};
  },
};

export default spotifyService;

export const executor = spotifyReactionExecutor;

const spotifyScheduler = new SpotifyScheduler();

export async function initialize(): Promise<void> {
  console.log('Initializing Spotify service...');
  await spotifyScheduler.start();
  console.log('Spotify service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Spotify service...');
  await spotifyScheduler.stop();
  console.log('Spotify service cleaned up');
}
