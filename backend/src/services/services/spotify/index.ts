import type { Service } from '../../../types/service';
import { spotifyActions } from './actions';
import { spotifyReactions } from './reactions';
import { spotifyReactionExecutor } from './executor';
import { spotifyScheduler } from './SpotifyScheduler';

const spotifyService: Service = {
  id: 'spotify',
  name: 'Spotify',
  description: 'Spotify service for music streaming integration',
  version: '1.0.0',
  icon: `<svg stroke="currentColor" fill="#1DB954" stroke-width="0" viewBox="0 0 496 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.3 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.4-17.6 19.4zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 210.4 44.9 9.7 5.2 13.9 11.9 13.9 22.9 0 13.1-8.9 23.6-18.6 23.6z"></path></svg>`,
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

export async function initialize(): Promise<void> {
  console.log('Initializing Spotify service...');
  const { initializeSpotifyPassport } = await import('./passport');
  initializeSpotifyPassport();
  await spotifyScheduler.start();
  console.log('Spotify service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Spotify service...');
  await spotifyScheduler.stop();
  console.log('Spotify service cleaned up');
}
