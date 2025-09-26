import type { ActionReactionSchema } from '../../../types/mapping';

export const githubPushSchema: ActionReactionSchema = {
  name: 'GitHub Push',
  description: 'Triggers when a push event occurs on a selected repository',
  fields: [
    {
      name: 'repository',
      type: 'text',
      label: 'Repository (owner/repo)',
      required: true,
      placeholder: 'octocat/Hello-World',
    },
    {
      name: 'branch',
      type: 'text',
      label: 'Branch (optional, defaults to all branches)',
      required: false,
      placeholder: 'main',
    },
  ],
};

export const githubPullRequestOpenedSchema: ActionReactionSchema = {
  name: 'GitHub Pull Request Opened',
  description: 'Triggers when a new pull request is opened',
  fields: [
    {
      name: 'repository',
      type: 'text',
      label: 'Repository (owner/repo)',
      required: true,
      placeholder: 'octocat/Hello-World',
    },
  ],
};

export const githubPullRequestMergedSchema: ActionReactionSchema = {
  name: 'GitHub Pull Request Merged',
  description: 'Triggers when a pull request is merged',
  fields: [
    {
      name: 'repository',
      type: 'text',
      label: 'Repository (owner/repo)',
      required: true,
      placeholder: 'octocat/Hello-World',
    },
  ],
};
