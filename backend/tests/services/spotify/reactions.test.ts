import { spotifyReactions } from '../../../src/services/services/spotify/reactions';

describe('Spotify Reactions', () => {
  it('should export an array of reactions', () => {
    expect(Array.isArray(spotifyReactions)).toBe(true);
    expect(spotifyReactions.length).toBeGreaterThan(0);
  });

  it('should have 5 reactions', () => {
    expect(spotifyReactions).toHaveLength(5);
  });

  describe('spotify.skip_track', () => {
    const reaction = spotifyReactions.find(r => r.id === 'spotify.skip_track');

    it('should be defined', () => {
      expect(reaction).toBeDefined();
    });

    it('should have correct basic properties', () => {
      expect(reaction?.id).toBe('spotify.skip_track');
      expect(reaction?.name).toBe('Skip Current Track');
      expect(reaction?.description).toBe(
        "Skips to the next track in the user's current playback"
      );
    });

    it('should have correct metadata', () => {
      expect(reaction?.metadata?.category).toBe('Spotify');
      expect(reaction?.metadata?.requiresAuth).toBe(true);
      expect(reaction?.metadata?.tags).toContain('music');
      expect(reaction?.metadata?.tags).toContain('playback');
      expect(reaction?.metadata?.tags).toContain('skip');
      expect(reaction?.metadata?.estimatedDuration).toBe(1000);
    });

    it('should have outputSchema with success property', () => {
      expect(reaction?.outputSchema).toBeDefined();
      expect(reaction?.outputSchema.type).toBe('object');
      expect(reaction?.outputSchema.properties).toHaveProperty('success');
      expect(reaction?.outputSchema.required).toContain('success');
    });
  });

  describe('spotify.pause_resume_playback', () => {
    const reaction = spotifyReactions.find(
      r => r.id === 'spotify.pause_resume_playback'
    );

    it('should be defined', () => {
      expect(reaction).toBeDefined();
    });

    it('should have correct basic properties', () => {
      expect(reaction?.id).toBe('spotify.pause_resume_playback');
      expect(reaction?.name).toBe('Pause / Resume Playback');
      expect(reaction?.description).toBe(
        'Toggles playback pause or resume depending on current state'
      );
    });

    it('should have correct metadata', () => {
      expect(reaction?.metadata?.category).toBe('Spotify');
      expect(reaction?.metadata?.requiresAuth).toBe(true);
      expect(reaction?.metadata?.tags).toContain('music');
      expect(reaction?.metadata?.tags).toContain('playback');
      expect(reaction?.metadata?.tags).toContain('pause');
      expect(reaction?.metadata?.tags).toContain('resume');
      expect(reaction?.metadata?.estimatedDuration).toBe(1000);
    });

    it('should have outputSchema with action and success properties', () => {
      expect(reaction?.outputSchema).toBeDefined();
      expect(reaction?.outputSchema.type).toBe('object');
      expect(reaction?.outputSchema.properties).toHaveProperty('action');
      expect(reaction?.outputSchema.properties).toHaveProperty('success');
      expect(reaction?.outputSchema.required).toContain('action');
      expect(reaction?.outputSchema.required).toContain('success');
    });
  });

  describe('spotify.add_song_to_playlist', () => {
    const reaction = spotifyReactions.find(
      r => r.id === 'spotify.add_song_to_playlist'
    );

    it('should be defined', () => {
      expect(reaction).toBeDefined();
    });

    it('should have correct basic properties', () => {
      expect(reaction?.id).toBe('spotify.add_song_to_playlist');
      expect(reaction?.name).toBe('Add Song to Playlist');
      expect(reaction?.description).toBe(
        'Adds the current or specified track to a chosen playlist (or to Liked Songs if no playlist specified)'
      );
    });

    it('should have correct metadata', () => {
      expect(reaction?.metadata?.category).toBe('Spotify');
      expect(reaction?.metadata?.requiresAuth).toBe(true);
      expect(reaction?.metadata?.tags).toContain('music');
      expect(reaction?.metadata?.tags).toContain('playlist');
      expect(reaction?.metadata?.tags).toContain('add');
      expect(reaction?.metadata?.estimatedDuration).toBe(1500);
    });

    it('should have outputSchema with playlist and track properties', () => {
      expect(reaction?.outputSchema).toBeDefined();
      expect(reaction?.outputSchema.type).toBe('object');
      expect(reaction?.outputSchema.properties).toHaveProperty('playlist_id');
      expect(reaction?.outputSchema.properties).toHaveProperty(
        'added_to_liked'
      );
      expect(reaction?.outputSchema.properties).toHaveProperty('track_uri');
      expect(reaction?.outputSchema.properties).toHaveProperty('success');
      expect(reaction?.outputSchema.required).toContain('added_to_liked');
      expect(reaction?.outputSchema.required).toContain('track_uri');
      expect(reaction?.outputSchema.required).toContain('success');
    });
  });

  describe('spotify.play_specific_track', () => {
    const reaction = spotifyReactions.find(
      r => r.id === 'spotify.play_specific_track'
    );

    it('should be defined', () => {
      expect(reaction).toBeDefined();
    });

    it('should have correct basic properties', () => {
      expect(reaction?.id).toBe('spotify.play_specific_track');
      expect(reaction?.name).toBe('Play Specific Track');
      expect(reaction?.description).toBe(
        'Starts playback of a given track or playlist URI'
      );
    });

    it('should have correct metadata', () => {
      expect(reaction?.metadata?.category).toBe('Spotify');
      expect(reaction?.metadata?.requiresAuth).toBe(true);
      expect(reaction?.metadata?.tags).toContain('music');
      expect(reaction?.metadata?.tags).toContain('playback');
      expect(reaction?.metadata?.tags).toContain('play');
      expect(reaction?.metadata?.estimatedDuration).toBe(1500);
    });

    it('should have outputSchema with uri and device properties', () => {
      expect(reaction?.outputSchema).toBeDefined();
      expect(reaction?.outputSchema.type).toBe('object');
      expect(reaction?.outputSchema.properties).toHaveProperty('uri');
      expect(reaction?.outputSchema.properties).toHaveProperty('device_id');
      expect(reaction?.outputSchema.properties).toHaveProperty('success');
      expect(reaction?.outputSchema.required).toContain('uri');
      expect(reaction?.outputSchema.required).toContain('success');
    });
  });

  describe('spotify.set_volume', () => {
    const reaction = spotifyReactions.find(r => r.id === 'spotify.set_volume');

    it('should be defined', () => {
      expect(reaction).toBeDefined();
    });

    it('should have correct basic properties', () => {
      expect(reaction?.id).toBe('spotify.set_volume');
      expect(reaction?.name).toBe('Set Volume');
      expect(reaction?.description).toBe(
        'Adjusts the playback volume to a specified level'
      );
    });

    it('should have correct metadata', () => {
      expect(reaction?.metadata?.category).toBe('Spotify');
      expect(reaction?.metadata?.requiresAuth).toBe(true);
      expect(reaction?.metadata?.tags).toContain('music');
      expect(reaction?.metadata?.tags).toContain('playback');
      expect(reaction?.metadata?.tags).toContain('volume');
      expect(reaction?.metadata?.estimatedDuration).toBe(1000);
    });

    it('should have outputSchema with volume properties', () => {
      expect(reaction?.outputSchema).toBeDefined();
      expect(reaction?.outputSchema.type).toBe('object');
      expect(reaction?.outputSchema.properties).toHaveProperty(
        'volume_percent'
      );
      expect(reaction?.outputSchema.properties).toHaveProperty('device_id');
      expect(reaction?.outputSchema.properties).toHaveProperty('success');
      expect(reaction?.outputSchema.required).toContain('volume_percent');
      expect(reaction?.outputSchema.required).toContain('success');
    });
  });

  describe('Reaction validation', () => {
    it('should have all reactions with unique IDs', () => {
      const ids = spotifyReactions.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all reactions with non-empty names', () => {
      spotifyReactions.forEach(reaction => {
        expect(reaction.name).toBeTruthy();
        expect(reaction.name.length).toBeGreaterThan(0);
      });
    });

    it('should have all reactions with non-empty descriptions', () => {
      spotifyReactions.forEach(reaction => {
        expect(reaction.description).toBeTruthy();
        expect(reaction.description.length).toBeGreaterThan(0);
      });
    });

    it('should have all reactions with configSchema', () => {
      spotifyReactions.forEach(reaction => {
        expect(reaction.configSchema).toBeDefined();
      });
    });

    it('should have all reactions with outputSchema', () => {
      spotifyReactions.forEach(reaction => {
        expect(reaction.outputSchema).toBeDefined();
        expect(reaction.outputSchema.type).toBe('object');
      });
    });

    it('should have all reactions with metadata', () => {
      spotifyReactions.forEach(reaction => {
        expect(reaction.metadata).toBeDefined();
        expect(reaction.metadata.category).toBeDefined();
        expect(reaction.metadata.requiresAuth).toBe(true);
        expect(Array.isArray(reaction.metadata.tags)).toBe(true);
        expect(typeof reaction.metadata.estimatedDuration).toBe('number');
      });
    });
  });
});
