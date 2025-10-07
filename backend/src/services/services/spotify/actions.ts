import type { ActionDefinition } from '../../../types/service';
import {
  spotifyTrackChangedSchema,
  spotifyPlaybackStartedSchema,
  spotifyPlaybackPausedSchema,
  spotifyLikedSongAddedSchema,
} from './schemas';

// Spotify actions
export const spotifyActions: ActionDefinition[] = [
  {
    id: 'spotify.track_changed',
    name: 'Track Changed',
    description: 'Triggered when the currently playing track changes',
    configSchema: spotifyTrackChangedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        previous_track: {
          type: 'object',
          description: 'Information about the previously playing track',
          properties: {
            id: { type: 'string', description: 'Spotify track ID' },
            name: { type: 'string', description: 'Track name' },
            artist: { type: 'string', description: 'Artist name' },
            album: { type: 'string', description: 'Album name' },
            uri: { type: 'string', description: 'Spotify URI' },
          },
        },
        current_track: {
          type: 'object',
          description: 'Information about the currently playing track',
          properties: {
            id: { type: 'string', description: 'Spotify track ID' },
            name: { type: 'string', description: 'Track name' },
            artist: { type: 'string', description: 'Artist name' },
            album: { type: 'string', description: 'Album name' },
            uri: { type: 'string', description: 'Spotify URI' },
          },
        },
        timestamp: {
          type: 'string',
          description: 'ISO timestamp when the change was detected',
        },
      },
      required: ['current_track', 'timestamp'],
    },
    metadata: {
      category: 'Music',
      tags: ['spotify', 'music', 'track', 'playback'],
      requiresAuth: true,
    },
  },
  {
    id: 'spotify.playback_started',
    name: 'Playback Started',
    description: 'Triggered when playback transitions from paused to playing',
    configSchema: spotifyPlaybackStartedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        track: {
          type: 'object',
          description: 'Information about the track that started playing',
          properties: {
            id: { type: 'string', description: 'Spotify track ID' },
            name: { type: 'string', description: 'Track name' },
            artist: { type: 'string', description: 'Artist name' },
            album: { type: 'string', description: 'Album name' },
            uri: { type: 'string', description: 'Spotify URI' },
          },
        },
        device: {
          type: 'object',
          description: 'Information about the device where playback started',
          properties: {
            id: { type: 'string', description: 'Device ID' },
            name: { type: 'string', description: 'Device name' },
            type: { type: 'string', description: 'Device type' },
          },
        },
        timestamp: {
          type: 'string',
          description: 'ISO timestamp when playback started',
        },
      },
      required: ['track', 'timestamp'],
    },
    metadata: {
      category: 'Music',
      tags: ['spotify', 'music', 'playback', 'play'],
      requiresAuth: true,
    },
  },
  {
    id: 'spotify.playback_paused',
    name: 'Playback Paused',
    description: 'Triggered when playback transitions from playing to paused',
    configSchema: spotifyPlaybackPausedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        track: {
          type: 'object',
          description: 'Information about the track that was paused',
          properties: {
            id: { type: 'string', description: 'Spotify track ID' },
            name: { type: 'string', description: 'Track name' },
            artist: { type: 'string', description: 'Artist name' },
            album: { type: 'string', description: 'Album name' },
            uri: { type: 'string', description: 'Spotify URI' },
          },
        },
        device: {
          type: 'object',
          description: 'Information about the device where playback was paused',
          properties: {
            id: { type: 'string', description: 'Device ID' },
            name: { type: 'string', description: 'Device name' },
            type: { type: 'string', description: 'Device type' },
          },
        },
        timestamp: {
          type: 'string',
          description: 'ISO timestamp when playback was paused',
        },
      },
      required: ['track', 'timestamp'],
    },
    metadata: {
      category: 'Music',
      tags: ['spotify', 'music', 'playback', 'pause'],
      requiresAuth: true,
    },
  },
  {
    id: 'spotify.liked_song_added',
    name: 'Liked Song Added',
    description:
      "Triggered when a new song is added to the user's Liked Songs library",
    configSchema: spotifyLikedSongAddedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        track: {
          type: 'object',
          description: 'Information about the newly liked track',
          properties: {
            id: { type: 'string', description: 'Spotify track ID' },
            name: { type: 'string', description: 'Track name' },
            artist: { type: 'string', description: 'Artist name' },
            album: { type: 'string', description: 'Album name' },
            uri: { type: 'string', description: 'Spotify URI' },
            duration_ms: {
              type: 'number',
              description: 'Track duration in milliseconds',
            },
          },
        },
        added_at: {
          type: 'string',
          description: 'ISO timestamp when the track was added to liked songs',
        },
        timestamp: {
          type: 'string',
          description: 'ISO timestamp when the change was detected',
        },
      },
      required: ['track', 'added_at', 'timestamp'],
    },
    metadata: {
      category: 'Music',
      tags: ['spotify', 'music', 'liked', 'library'],
      requiresAuth: true,
    },
  },
];
