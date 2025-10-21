import type { ActionDefinition } from '../../../types/service';
import {
  facebookUserFeedPostedSchema,
  facebookUserPhotoUploadedSchema,
  facebookUserVideoUploadedSchema,
  facebookUserPictureChangedSchema,
  facebookUserNameChangedSchema,
  facebookUserBirthdayChangedSchema,
  facebookUserAboutChangedSchema,
} from './schemas';

export const facebookActions: ActionDefinition[] = [
  {
    id: 'facebook.user.feed_posted',
    name: 'Facebook Feed Post',
    description: 'Triggers when a user posts on their timeline/feed',
    configSchema: facebookUserFeedPostedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        post_id: {
          type: 'string',
          description: 'The ID of the post',
        },
        message: {
          type: 'string',
          description: 'Text content of the post',
        },
        link: {
          type: 'string',
          description: 'URL if shared a link',
        },
        created_time: {
          type: 'string',
          description: 'When it was posted',
        },
        verb: {
          type: 'string',
          description: '"add" (new post) or "edit" (edited post)',
        },
      },
      required: ['post_id', 'created_time', 'verb'],
    },
    metadata: {
      category: 'Facebook',
      tags: ['user', 'feed', 'post'],
      requiresAuth: true,
      webhookPattern: 'feed',
      sharedEvents: false,
    },
  },
  {
    id: 'facebook.user.photo_uploaded',
    name: 'Facebook Photo Upload',
    description: 'Triggers when a user uploads a photo',
    configSchema: facebookUserPhotoUploadedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        photo_id: {
          type: 'string',
          description: 'ID of the uploaded photo',
        },
        photos: {
          type: 'array',
          description: 'Array of photo objects',
          items: {
            type: 'object',
            description: 'Photo object',
          },
        },
        link: {
          type: 'string',
          description: 'Direct link to photo',
        },
      },
      required: ['photo_id'],
    },
    metadata: {
      category: 'Facebook',
      tags: ['user', 'photo', 'upload'],
      requiresAuth: true,
      webhookPattern: 'photos',
      sharedEvents: false,
    },
  },
  {
    id: 'facebook.user.video_uploaded',
    name: 'Facebook Video Upload',
    description: 'Triggers when a user uploads a video',
    configSchema: facebookUserVideoUploadedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        video_id: {
          type: 'string',
          description: 'ID of the uploaded video',
        },
        title: {
          type: 'string',
          description: 'Video title',
        },
        description: {
          type: 'string',
          description: 'Video description',
        },
      },
      required: ['video_id'],
    },
    metadata: {
      category: 'Facebook',
      tags: ['user', 'video', 'upload'],
      requiresAuth: true,
      webhookPattern: 'videos',
      sharedEvents: false,
    },
  },
  {
    id: 'facebook.user.picture_changed',
    name: 'Facebook Profile Picture Change',
    description: 'Triggers when a user changes their profile picture',
    configSchema: facebookUserPictureChangedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'New profile picture URL',
        },
        is_silhouette: {
          type: 'boolean',
          description: 'Boolean if it\'s the default avatar',
        },
      },
      required: ['url'],
    },
    metadata: {
      category: 'Facebook',
      tags: ['user', 'profile', 'picture'],
      requiresAuth: true,
      webhookPattern: 'picture',
      sharedEvents: false,
    },
  },
  {
    id: 'facebook.user.name_changed',
    name: 'Facebook Name Change',
    description: 'Triggers when a user changes their name',
    configSchema: facebookUserNameChangedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'New full name',
        },
      },
      required: ['name'],
    },
    metadata: {
      category: 'Facebook',
      tags: ['user', 'profile', 'name'],
      requiresAuth: true,
      webhookPattern: 'name',
      sharedEvents: false,
    },
  },
  {
    id: 'facebook.user.birthday_changed',
    name: 'Facebook Birthday Update',
    description: 'Triggers when a user changes their birthday',
    configSchema: facebookUserBirthdayChangedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        birthday: {
          type: 'string',
          description: 'New birthday date',
        },
      },
      required: ['birthday'],
    },
    metadata: {
      category: 'Facebook',
      tags: ['user', 'profile', 'birthday'],
      requiresAuth: true,
      webhookPattern: 'birthday',
      sharedEvents: false,
    },
  },
  {
    id: 'facebook.user.about_changed',
    name: 'Facebook About Section Update',
    description: 'Triggers when a user updates their "About" bio',
    configSchema: facebookUserAboutChangedSchema,
    inputSchema: {
      type: 'object',
      properties: {
        about: {
          type: 'string',
          description: 'New bio text',
        },
      },
      required: ['about'],
    },
    metadata: {
      category: 'Facebook',
      tags: ['user', 'profile', 'about'],
      requiresAuth: true,
      webhookPattern: 'about',
      sharedEvents: false,
    },
  },
];
