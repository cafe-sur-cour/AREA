// Spotify service schemas
import type { ActionReactionSchema } from '../../../types/mapping';

export const spotifySkipTrackSchema: ActionReactionSchema = {
  name: 'Skip Current Track',
  description: "Skips to the next track in the user's current playback",
  fields: [],
};

export const spotifyPauseResumePlaybackSchema: ActionReactionSchema = {
  name: 'Pause / Resume Playback',
  description: 'Toggles playback pause or resume depending on current state',
  fields: [],
};

export const spotifyAddSongToPlaylistSchema: ActionReactionSchema = {
  name: 'Add Song to Playlist',
  description:
    'Adds the current or specified track to a chosen playlist (or to Liked Songs if no playlist specified)',
  fields: [
    {
      name: 'playlist_id',
      type: 'text',
      label: 'Playlist ID (optional, adds to Liked Songs if empty)',
      required: false,
      placeholder: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
    },
    {
      name: 'track_uri',
      type: 'text',
      label: 'Track URI (optional, uses currently playing track if empty)',
      required: false,
      placeholder: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
    },
  ],
};

export const spotifyPlaySpecificTrackSchema: ActionReactionSchema = {
  name: 'Play Specific Track',
  description: 'Starts playback of a given track or playlist URI',
  fields: [
    {
      name: 'uri',
      type: 'text',
      label: 'Spotify URI (track, album, playlist, or artist)',
      required: true,
      placeholder: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
    },
    {
      name: 'device_id',
      type: 'text',
      label: 'Device ID (optional, uses active device if empty)',
      required: false,
      placeholder: 'device_id_here',
    },
  ],
};

export const spotifySetVolumeSchema: ActionReactionSchema = {
  name: 'Set Volume',
  description: 'Adjusts the playback volume to a specified level',
  fields: [
    {
      name: 'volume_percent',
      type: 'number',
      label: 'Volume Level (0-100)',
      required: true,
      placeholder: '50',
    },
    {
      name: 'device_id',
      type: 'text',
      label: 'Device ID (optional, uses active device if empty)',
      required: false,
      placeholder: 'device_id_here',
    },
  ],
};
