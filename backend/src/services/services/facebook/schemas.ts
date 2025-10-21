import type { ActionReactionSchema } from '../../../types/mapping';

export const facebookUserFeedPostedSchema: ActionReactionSchema = {
  name: 'Facebook Feed Post',
  description: 'Triggers when a user posts on their timeline/feed',
  fields: [],
};

export const facebookUserPhotoUploadedSchema: ActionReactionSchema = {
  name: 'Facebook Photo Upload',
  description: 'Triggers when a user uploads a photo',
  fields: [],
};

export const facebookUserVideoUploadedSchema: ActionReactionSchema = {
  name: 'Facebook Video Upload',
  description: 'Triggers when a user uploads a video',
  fields: [],
};

export const facebookUserPictureChangedSchema: ActionReactionSchema = {
  name: 'Facebook Profile Picture Change',
  description: 'Triggers when a user changes their profile picture',
  fields: [],
};

export const facebookUserNameChangedSchema: ActionReactionSchema = {
  name: 'Facebook Name Change',
  description: 'Triggers when a user changes their name',
  fields: [],
};

export const facebookUserBirthdayChangedSchema: ActionReactionSchema = {
  name: 'Facebook Birthday Update',
  description: 'Triggers when a user changes their birthday',
  fields: [],
};

export const facebookUserAboutChangedSchema: ActionReactionSchema = {
  name: 'Facebook About Section Update',
  description: 'Triggers when a user updates their "About" bio',
  fields: [],
};

export const facebookPostToFeedSchema: ActionReactionSchema = {
  name: 'Post to Facebook Feed',
  description: 'Posts a message to the user\'s Facebook timeline',
  fields: [
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      required: true,
      placeholder: 'What\'s on your mind?',
    },
    {
      name: 'link',
      type: 'text',
      label: 'Link (optional)',
      required: false,
      placeholder: 'https://example.com',
    },
  ],
};

export const facebookUploadPhotoSchema: ActionReactionSchema = {
  name: 'Upload Photo to Facebook',
  description: 'Uploads a photo to the user\'s Facebook profile',
  fields: [
    {
      name: 'image_url',
      type: 'text',
      label: 'Image URL',
      required: true,
      placeholder: 'https://example.com/image.jpg',
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption (optional)',
      required: false,
      placeholder: 'Photo caption',
    },
  ],
};
