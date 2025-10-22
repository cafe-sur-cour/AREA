import { spotifyActions } from '../../../src/services/services/spotify/actions';

describe('Spotify Actions', () => {
  it('should export an array of actions', () => {
    expect(Array.isArray(spotifyActions)).toBe(true);
    expect(spotifyActions.length).toBeGreaterThan(0);
  });

  it('should have 4 actions', () => {
    expect(spotifyActions).toHaveLength(4);
  });

  describe('spotify.track_changed', () => {
    const action = spotifyActions.find(a => a.id === 'spotify.track_changed');

    it('should be defined', () => {
      expect(action).toBeDefined();
    });

    it('should have correct basic properties', () => {
      expect(action?.id).toBe('spotify.track_changed');
      expect(action?.name).toBe('Track Changed');
      expect(action?.description).toBe(
        'Triggered when the currently playing track changes'
      );
    });

    it('should have correct metadata', () => {
      expect(action?.metadata?.category).toBe('Music');
      expect(action?.metadata?.requiresAuth).toBe(true);
      expect(action?.metadata?.tags).toContain('spotify');
      expect(action?.metadata?.tags).toContain('music');
      expect(action?.metadata?.tags).toContain('track');
      expect(action?.metadata?.tags).toContain('playback');
    });

    it('should have inputSchema with track properties', () => {
      expect(action?.inputSchema).toBeDefined();
      expect(action?.inputSchema.type).toBe('object');
      expect(action?.inputSchema.properties).toHaveProperty('previous_track');
      expect(action?.inputSchema.properties).toHaveProperty('current_track');
      expect(action?.inputSchema.properties).toHaveProperty('timestamp');
    });

    it('should require current_track and timestamp', () => {
      expect(action?.inputSchema.required).toContain('current_track');
      expect(action?.inputSchema.required).toContain('timestamp');
    });
  });

  describe('spotify.playback_started', () => {
    const action = spotifyActions.find(
      a => a.id === 'spotify.playback_started'
    );

    it('should be defined', () => {
      expect(action).toBeDefined();
    });

    it('should have correct basic properties', () => {
      expect(action?.id).toBe('spotify.playback_started');
      expect(action?.name).toBe('Playback Started');
      expect(action?.description).toBe(
        'Triggered when playback transitions from paused to playing'
      );
    });

    it('should have correct metadata', () => {
      expect(action?.metadata?.category).toBe('Music');
      expect(action?.metadata?.requiresAuth).toBe(true);
      expect(action?.metadata?.tags).toContain('spotify');
      expect(action?.metadata?.tags).toContain('music');
      expect(action?.metadata?.tags).toContain('playback');
      expect(action?.metadata?.tags).toContain('play');
    });

    it('should have inputSchema with track and device properties', () => {
      expect(action?.inputSchema).toBeDefined();
      expect(action?.inputSchema.type).toBe('object');
      expect(action?.inputSchema.properties).toHaveProperty('track');
      expect(action?.inputSchema.properties).toHaveProperty('device');
      expect(action?.inputSchema.properties).toHaveProperty('timestamp');
    });

    it('should require track and timestamp', () => {
      expect(action?.inputSchema.required).toContain('track');
      expect(action?.inputSchema.required).toContain('timestamp');
    });
  });

  describe('spotify.playback_paused', () => {
    const action = spotifyActions.find(a => a.id === 'spotify.playback_paused');

    it('should be defined', () => {
      expect(action).toBeDefined();
    });

    it('should have correct basic properties', () => {
      expect(action?.id).toBe('spotify.playback_paused');
      expect(action?.name).toBe('Playback Paused');
      expect(action?.description).toBe(
        'Triggered when playback transitions from playing to paused'
      );
    });

    it('should have correct metadata', () => {
      expect(action?.metadata?.category).toBe('Music');
      expect(action?.metadata?.requiresAuth).toBe(true);
      expect(action?.metadata?.tags).toContain('spotify');
      expect(action?.metadata?.tags).toContain('music');
      expect(action?.metadata?.tags).toContain('playback');
      expect(action?.metadata?.tags).toContain('pause');
    });

    it('should have inputSchema with track and device properties', () => {
      expect(action?.inputSchema).toBeDefined();
      expect(action?.inputSchema.type).toBe('object');
      expect(action?.inputSchema.properties).toHaveProperty('track');
      expect(action?.inputSchema.properties).toHaveProperty('device');
      expect(action?.inputSchema.properties).toHaveProperty('timestamp');
    });

    it('should require track and timestamp', () => {
      expect(action?.inputSchema.required).toContain('track');
      expect(action?.inputSchema.required).toContain('timestamp');
    });
  });

  describe('spotify.liked_song_added', () => {
    const action = spotifyActions.find(
      a => a.id === 'spotify.liked_song_added'
    );

    it('should be defined', () => {
      expect(action).toBeDefined();
    });

    it('should have correct basic properties', () => {
      expect(action?.id).toBe('spotify.liked_song_added');
      expect(action?.name).toBe('Liked Song Added');
      expect(action?.description).toBe(
        "Triggered when a new song is added to the user's Liked Songs library"
      );
    });

    it('should have correct metadata', () => {
      expect(action?.metadata?.category).toBe('Music');
      expect(action?.metadata?.requiresAuth).toBe(true);
      expect(action?.metadata?.tags).toContain('spotify');
      expect(action?.metadata?.tags).toContain('music');
      expect(action?.metadata?.tags).toContain('liked');
      expect(action?.metadata?.tags).toContain('library');
    });

    it('should have inputSchema with track properties', () => {
      expect(action?.inputSchema).toBeDefined();
      expect(action?.inputSchema.type).toBe('object');
      expect(action?.inputSchema.properties).toHaveProperty('track');
      expect(action?.inputSchema.properties).toHaveProperty('added_at');
      expect(action?.inputSchema.properties).toHaveProperty('timestamp');
    });

    it('should require track, added_at, and timestamp', () => {
      expect(action?.inputSchema.required).toContain('track');
      expect(action?.inputSchema.required).toContain('added_at');
      expect(action?.inputSchema.required).toContain('timestamp');
    });
  });

  describe('Action validation', () => {
    it('should have all actions with unique IDs', () => {
      const ids = spotifyActions.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all actions with non-empty names', () => {
      spotifyActions.forEach(action => {
        expect(action.name).toBeTruthy();
        expect(action.name.length).toBeGreaterThan(0);
      });
    });

    it('should have all actions with non-empty descriptions', () => {
      spotifyActions.forEach(action => {
        expect(action.description).toBeTruthy();
        expect(action.description.length).toBeGreaterThan(0);
      });
    });

    it('should have all actions with configSchema', () => {
      spotifyActions.forEach(action => {
        expect(action.configSchema).toBeDefined();
      });
    });

    it('should have all actions with inputSchema', () => {
      spotifyActions.forEach(action => {
        expect(action.inputSchema).toBeDefined();
        expect(action.inputSchema.type).toBe('object');
      });
    });

    it('should have all actions with metadata', () => {
      spotifyActions.forEach(action => {
        expect(action.metadata).toBeDefined();
        expect(action.metadata.category).toBeDefined();
        expect(action.metadata.requiresAuth).toBe(true);
        expect(Array.isArray(action.metadata.tags)).toBe(true);
      });
    });
  });
});
