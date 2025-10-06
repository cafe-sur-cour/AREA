import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';
import { spotifyOAuth } from './oauth';

interface SpotifyPlaybackState {
  is_playing: boolean;
  currently_playing_type: string;
  item?: {
    id: string;
    name: string;
    uri: string;
    type: string;
  };
  device?: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  };
}

interface SpotifyPlayRequest {
  uris: string[];
  device_id?: string;
}

export class SpotifyReactionExecutor implements ReactionExecutor {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.SERVICE_SPOTIFY_API_BASE_URL || 'https://api.spotify.com/v1';
  }

  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction, serviceConfig } = context;

    try {
      const accessToken = serviceConfig.credentials?.access_token;
      if (!accessToken) {
        return {
          success: false,
          error: 'Spotify access token not configured',
        };
      }

      // Validate and refresh token if needed
      const userToken = await spotifyOAuth.getUserToken(context.event.user_id);
      if (!userToken) {
        return {
          success: false,
          error: 'Spotify access token not found or expired',
        };
      }

      const validToken = userToken.token_value;

      switch (reaction.type) {
        case 'spotify.skip_track':
          return await this.skipTrack(validToken);
        case 'spotify.pause_resume_playback':
          return await this.pauseResumePlayback(validToken);
        case 'spotify.add_song_to_playlist':
          return await this.addSongToPlaylist(reaction.config, validToken);
        case 'spotify.play_specific_track':
          return await this.playSpecificTrack(reaction.config, validToken);
        case 'spotify.set_volume':
          return await this.setVolume(reaction.config, validToken);
        default:
          return {
            success: false,
            error: `Unknown reaction type: ${reaction.type}`,
          };
      }
    } catch (error) {
      console.error('Spotify reaction execution error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async skipTrack(accessToken: string): Promise<ReactionExecutionResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/me/player/next`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        return {
          success: true,
          output: { success: true },
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'No active device found. Please start Spotify on a device first.',
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Spotify API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
        };
      }

      return {
        success: true,
        output: { success: true },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while skipping track: ${(error as Error).message}`,
      };
    }
  }

  private async pauseResumePlayback(accessToken: string): Promise<ReactionExecutionResult> {
    try {
      // First get current playback state
      const stateResponse = await fetch(`${this.apiBaseUrl}/me/player`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!stateResponse.ok) {
        if (stateResponse.status === 204) {
          return {
            success: false,
            error: 'No active playback found',
          };
        }
        const errorData = await stateResponse.json().catch(() => ({}));
        return {
          success: false,
          error: `Failed to get playback state: ${errorData.error?.message || 'Unknown error'}`,
        };
      }

      const playbackState: SpotifyPlaybackState = await stateResponse.json();
      const isPlaying = playbackState.is_playing;

      // Toggle playback
      const endpoint = isPlaying ? '/me/player/pause' : '/me/player/play';
      const method = isPlaying ? 'PUT' : 'PUT';

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        return {
          success: true,
          output: {
            action: isPlaying ? 'pause' : 'resume',
            success: true,
          },
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'No active device found. Please start Spotify on a device first.',
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Spotify API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
        };
      }

      return {
        success: true,
        output: {
          action: isPlaying ? 'pause' : 'resume',
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while toggling playback: ${(error as Error).message}`,
      };
    }
  }

  private async addSongToPlaylist(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { playlist_id, track_uri } = config as {
      playlist_id: string;
      track_uri?: string;
    };

    if (!playlist_id) {
      return {
        success: false,
        error: 'Playlist ID is required',
      };
    }

    let finalTrackUri = track_uri;

    // If no track URI provided, get currently playing track
    if (!finalTrackUri) {
      try {
        const stateResponse = await fetch(`${this.apiBaseUrl}/me/player`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!stateResponse.ok) {
          return {
            success: false,
            error: 'No currently playing track found and no track URI provided',
          };
        }

        const playbackState: SpotifyPlaybackState = await stateResponse.json();
        if (!playbackState.item?.uri) {
          return {
            success: false,
            error: 'No currently playing track found',
          };
        }

        finalTrackUri = playbackState.item.uri;
      } catch (error) {
        return {
          success: false,
          error: `Failed to get currently playing track: ${(error as Error).message}`,
        };
      }
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/playlists/${playlist_id}/tracks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [finalTrackUri],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Spotify API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
        };
      }

      return {
        success: true,
        output: {
          playlist_id,
          track_uri: finalTrackUri,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while adding song to playlist: ${(error as Error).message}`,
      };
    }
  }

  private async playSpecificTrack(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { uri, device_id } = config as {
      uri: string;
      device_id?: string;
    };

    if (!uri) {
      return {
        success: false,
        error: 'URI is required',
      };
    }

    try {
      const requestBody: SpotifyPlayRequest = {
        uris: [uri],
      };

      if (device_id) {
        requestBody.device_id = device_id;
      }

      const response = await fetch(`${this.apiBaseUrl}/me/player/play`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 204) {
        return {
          success: true,
          output: {
            uri,
            device_id: device_id || null,
            success: true,
          },
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'No active device found. Please start Spotify on a device first.',
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: 'Device not found. Check the device ID.',
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Spotify API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
        };
      }

      return {
        success: true,
        output: {
          uri,
          device_id: device_id || null,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while playing track: ${(error as Error).message}`,
      };
    }
  }

  private async setVolume(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { volume_percent, device_id } = config as {
      volume_percent: number;
      device_id?: string;
    };

    if (volume_percent === undefined || volume_percent < 0 || volume_percent > 100) {
      return {
        success: false,
        error: 'Volume percent must be between 0 and 100',
      };
    }

    try {
      const params = new URLSearchParams({
        volume_percent: Math.round(volume_percent).toString(),
      });

      if (device_id) {
        params.append('device_id', device_id);
      }

      const response = await fetch(
        `${this.apiBaseUrl}/me/player/volume?${params.toString()}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 204) {
        return {
          success: true,
          output: {
            volume_percent: Math.round(volume_percent),
            device_id: device_id || null,
            success: true,
          },
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'No active device found. Please start Spotify on a device first.',
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: 'Device not found. Check the device ID.',
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Spotify API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
        };
      }

      return {
        success: true,
        output: {
          volume_percent: Math.round(volume_percent),
          device_id: device_id || null,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while setting volume: ${(error as Error).message}`,
      };
    }
  }
}

export const spotifyReactionExecutor = new SpotifyReactionExecutor();
