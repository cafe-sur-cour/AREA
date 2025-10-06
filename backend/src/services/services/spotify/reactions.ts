import type { ReactionDefinition } from '../../../types/service';
import {
  spotifySkipTrackSchema,
  spotifyPauseResumePlaybackSchema,
  spotifyAddSongToPlaylistSchema,
  spotifyPlaySpecificTrackSchema,
  spotifySetVolumeSchema,
} from './schemas';

// Spotify reactions
export const spotifyReactions: ReactionDefinition[] = [
  {
    id: 'spotify.skip_track',
    name: 'Skip Current Track',
    description: "Skips to the next track in the user's current playback",
    configSchema: spotifySkipTrackSchema,
    outputSchema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the skip operation was successful',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Spotify',
      tags: ['music', 'playback', 'skip'],
      requiresAuth: true,
      estimatedDuration: 1000,
    },
  },
  {
    id: 'spotify.pause_resume_playback',
    name: 'Pause / Resume Playback',
    description: 'Toggles playback pause or resume depending on current state',
    configSchema: spotifyPauseResumePlaybackSchema,
    outputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'The action performed (pause or resume)',
        },
        success: {
          type: 'boolean',
          description: 'Whether the toggle operation was successful',
        },
      },
      required: ['action', 'success'],
    },
    metadata: {
      category: 'Spotify',
      tags: ['music', 'playback', 'pause', 'resume'],
      requiresAuth: true,
      estimatedDuration: 1000,
    },
  },
  {
    id: 'spotify.add_song_to_playlist',
    name: 'Add Song to Playlist',
    description:
      'Adds the current or specified track to a chosen playlist (or to Liked Songs if no playlist specified)',
    configSchema: spotifyAddSongToPlaylistSchema,
    outputSchema: {
      type: 'object',
      properties: {
        playlist_id: {
          type: 'string',
          description:
            'The ID of the playlist the track was added to (null if added to Liked Songs)',
        },
        added_to_liked: {
          type: 'boolean',
          description: 'Whether the track was added to Liked Songs',
        },
        track_uri: {
          type: 'string',
          description: 'The URI of the track that was added',
        },
        success: {
          type: 'boolean',
          description: 'Whether the add operation was successful',
        },
      },
      required: ['added_to_liked', 'track_uri', 'success'],
    },
    metadata: {
      category: 'Spotify',
      tags: ['music', 'playlist', 'add'],
      requiresAuth: true,
      estimatedDuration: 1500,
    },
  },
  {
    id: 'spotify.play_specific_track',
    name: 'Play Specific Track',
    description: 'Starts playback of a given track or playlist URI',
    configSchema: spotifyPlaySpecificTrackSchema,
    outputSchema: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          description: 'The URI that was played',
        },
        device_id: {
          type: 'string',
          description: 'The device ID used for playback',
        },
        success: {
          type: 'boolean',
          description: 'Whether the play operation was successful',
        },
      },
      required: ['uri', 'success'],
    },
    metadata: {
      category: 'Spotify',
      tags: ['music', 'playback', 'play'],
      requiresAuth: true,
      estimatedDuration: 1500,
    },
  },
  {
    id: 'spotify.set_volume',
    name: 'Set Volume',
    description: 'Adjusts the playback volume to a specified level',
    configSchema: spotifySetVolumeSchema,
    outputSchema: {
      type: 'object',
      properties: {
        volume_percent: {
          type: 'number',
          description: 'The volume level that was set',
        },
        device_id: {
          type: 'string',
          description: 'The device ID the volume was set on',
        },
        success: {
          type: 'boolean',
          description: 'Whether the volume set operation was successful',
        },
      },
      required: ['volume_percent', 'success'],
    },
    metadata: {
      category: 'Spotify',
      tags: ['music', 'playback', 'volume'],
      requiresAuth: true,
      estimatedDuration: 1000,
    },
  },
];
