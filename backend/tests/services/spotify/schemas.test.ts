import {
  spotifyTrackChangedSchema,
  spotifyPlaybackStartedSchema,
  spotifyPlaybackPausedSchema,
  spotifyLikedSongAddedSchema,
  spotifySkipTrackSchema,
  spotifyPauseResumePlaybackSchema,
  spotifyAddSongToPlaylistSchema,
  spotifyPlaySpecificTrackSchema,
  spotifySetVolumeSchema,
} from '../../../src/services/services/spotify/schemas';

describe('Spotify Schemas', () => {
  describe('Action Schemas', () => {
    describe('spotifyTrackChangedSchema', () => {
      it('should have correct structure', () => {
        expect(spotifyTrackChangedSchema).toBeDefined();
        expect(spotifyTrackChangedSchema.name).toBe('Track Changed');
        expect(spotifyTrackChangedSchema.description).toBe(
          'Triggered when the currently playing track changes'
        );
        expect(spotifyTrackChangedSchema.fields).toEqual([]);
      });
    });

    describe('spotifyPlaybackStartedSchema', () => {
      it('should have correct structure', () => {
        expect(spotifyPlaybackStartedSchema).toBeDefined();
        expect(spotifyPlaybackStartedSchema.name).toBe('Playback Started');
        expect(spotifyPlaybackStartedSchema.description).toBe(
          'Triggered when playback transitions from paused to playing'
        );
        expect(spotifyPlaybackStartedSchema.fields).toEqual([]);
      });
    });

    describe('spotifyPlaybackPausedSchema', () => {
      it('should have correct structure', () => {
        expect(spotifyPlaybackPausedSchema).toBeDefined();
        expect(spotifyPlaybackPausedSchema.name).toBe('Playback Paused');
        expect(spotifyPlaybackPausedSchema.description).toBe(
          'Triggered when playback transitions from playing to paused'
        );
        expect(spotifyPlaybackPausedSchema.fields).toEqual([]);
      });
    });

    describe('spotifyLikedSongAddedSchema', () => {
      it('should have correct structure', () => {
        expect(spotifyLikedSongAddedSchema).toBeDefined();
        expect(spotifyLikedSongAddedSchema.name).toBe('Liked Song Added');
        expect(spotifyLikedSongAddedSchema.description).toBe(
          "Triggered when a new song is added to the user's Liked Songs library"
        );
        expect(spotifyLikedSongAddedSchema.fields).toEqual([]);
      });
    });
  });

  describe('Reaction Schemas', () => {
    describe('spotifySkipTrackSchema', () => {
      it('should have correct structure', () => {
        expect(spotifySkipTrackSchema).toBeDefined();
        expect(spotifySkipTrackSchema.name).toBe('Skip Current Track');
        expect(spotifySkipTrackSchema.description).toBe(
          "Skips to the next track in the user's current playback"
        );
        expect(spotifySkipTrackSchema.fields).toEqual([]);
      });
    });

    describe('spotifyPauseResumePlaybackSchema', () => {
      it('should have correct structure', () => {
        expect(spotifyPauseResumePlaybackSchema).toBeDefined();
        expect(spotifyPauseResumePlaybackSchema.name).toBe(
          'Pause / Resume Playback'
        );
        expect(spotifyPauseResumePlaybackSchema.description).toBe(
          'Toggles playback pause or resume depending on current state'
        );
        expect(spotifyPauseResumePlaybackSchema.fields).toEqual([]);
      });
    });

    describe('spotifyAddSongToPlaylistSchema', () => {
      it('should have correct structure', () => {
        expect(spotifyAddSongToPlaylistSchema).toBeDefined();
        expect(spotifyAddSongToPlaylistSchema.name).toBe(
          'Add Song to Playlist'
        );
        expect(spotifyAddSongToPlaylistSchema.description).toBe(
          'Adds the current or specified track to a chosen playlist (or to Liked Songs if no playlist specified)'
        );
        expect(spotifyAddSongToPlaylistSchema.fields).toHaveLength(2);
      });

      it('should have correct playlist_id field', () => {
        const playlistIdField = spotifyAddSongToPlaylistSchema.fields.find(
          f => f.name === 'playlist_id'
        );
        expect(playlistIdField).toBeDefined();
        expect(playlistIdField?.type).toBe('text');
        expect(playlistIdField?.required).toBe(false);
        expect(playlistIdField?.label).toBe(
          'Playlist ID (optional, adds to Liked Songs if empty)'
        );
        expect(playlistIdField?.placeholder).toBe(
          'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M'
        );
      });

      it('should have correct track_uri field', () => {
        const trackUriField = spotifyAddSongToPlaylistSchema.fields.find(
          f => f.name === 'track_uri'
        );
        expect(trackUriField).toBeDefined();
        expect(trackUriField?.type).toBe('text');
        expect(trackUriField?.required).toBe(false);
        expect(trackUriField?.label).toBe(
          'Track URI (optional, uses currently playing track if empty)'
        );
        expect(trackUriField?.placeholder).toBe(
          'spotify:track:4iV5W9uYEdYUVa79Axb7Rh'
        );
        expect(trackUriField?.dynamic).toBe(true);
        expect(trackUriField?.dynamicPlaceholder).toBe(
          '{{action.payload.current_track.uri}}'
        );
      });
    });

    describe('spotifyPlaySpecificTrackSchema', () => {
      it('should have correct structure', () => {
        expect(spotifyPlaySpecificTrackSchema).toBeDefined();
        expect(spotifyPlaySpecificTrackSchema.name).toBe('Play Specific Track');
        expect(spotifyPlaySpecificTrackSchema.description).toBe(
          'Starts playback of a given track or playlist URI'
        );
        expect(spotifyPlaySpecificTrackSchema.fields).toHaveLength(2);
      });

      it('should have correct uri field', () => {
        const uriField = spotifyPlaySpecificTrackSchema.fields.find(
          f => f.name === 'uri'
        );
        expect(uriField).toBeDefined();
        expect(uriField?.type).toBe('text');
        expect(uriField?.required).toBe(true);
        expect(uriField?.label).toBe(
          'Spotify URI (track, album, playlist, or artist)'
        );
        expect(uriField?.placeholder).toBe(
          'spotify:track:4iV5W9uYEdYUVa79Axb7Rh'
        );
        expect(uriField?.dynamic).toBe(true);
        expect(uriField?.dynamicPlaceholder).toBe(
          '{{action.payload.track.uri}}'
        );
      });

      it('should have correct device_id field', () => {
        const deviceIdField = spotifyPlaySpecificTrackSchema.fields.find(
          f => f.name === 'device_id'
        );
        expect(deviceIdField).toBeDefined();
        expect(deviceIdField?.type).toBe('text');
        expect(deviceIdField?.required).toBe(false);
        expect(deviceIdField?.label).toBe(
          'Device ID (optional, uses active device if empty)'
        );
        expect(deviceIdField?.placeholder).toBe('device_id_here');
        expect(deviceIdField?.dynamic).toBe(true);
        expect(deviceIdField?.dynamicPlaceholder).toBe(
          '{{action.payload.device.id}}'
        );
      });
    });

    describe('spotifySetVolumeSchema', () => {
      it('should have correct structure', () => {
        expect(spotifySetVolumeSchema).toBeDefined();
        expect(spotifySetVolumeSchema.name).toBe('Set Volume');
        expect(spotifySetVolumeSchema.description).toBe(
          'Adjusts the playback volume to a specified level'
        );
        expect(spotifySetVolumeSchema.fields).toHaveLength(2);
      });

      it('should have correct volume_percent field', () => {
        const volumeField = spotifySetVolumeSchema.fields.find(
          f => f.name === 'volume_percent'
        );
        expect(volumeField).toBeDefined();
        expect(volumeField?.type).toBe('number');
        expect(volumeField?.required).toBe(true);
        expect(volumeField?.label).toBe('Volume Level (0-100)');
        expect(volumeField?.placeholder).toBe('50');
      });

      it('should have correct device_id field', () => {
        const deviceIdField = spotifySetVolumeSchema.fields.find(
          f => f.name === 'device_id'
        );
        expect(deviceIdField).toBeDefined();
        expect(deviceIdField?.type).toBe('text');
        expect(deviceIdField?.required).toBe(false);
        expect(deviceIdField?.label).toBe(
          'Device ID (optional, uses active device if empty)'
        );
        expect(deviceIdField?.placeholder).toBe('device_id_here');
      });
    });
  });
});
