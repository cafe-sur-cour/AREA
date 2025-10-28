import type { ActionDefinition } from '../../../types/service';
import { microsoftProfilePictureChangedSchema } from './schemas';

export const microsoftActions: ActionDefinition[] = [
  {
    id: 'microsoft.profile_picture_changed',
    name: 'Profile Picture Changed',
    description:
      'Triggers when your Microsoft profile picture is changed (polls every 5 seconds)',
    configSchema: microsoftProfilePictureChangedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        timestamp: {
          type: 'string',
          description: 'ISO timestamp of when the change was detected',
        },
        old_photo_url: {
          type: 'string',
          description: 'URL of the previous profile picture',
        },
        new_photo_url: {
          type: 'string',
          description: 'URL of the new profile picture',
        },
        user_id: {
          type: 'string',
          description: 'Microsoft user ID',
        },
        user_email: {
          type: 'string',
          description: 'Microsoft user email',
        },
      },
    },
    metadata: {
      category: 'Microsoft',
      tags: ['profile', 'picture', 'change', 'polling'],
      requiresAuth: true,
    },
  },
];
