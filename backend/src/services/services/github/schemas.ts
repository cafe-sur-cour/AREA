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

export const githubCreateIssueSchema: ActionReactionSchema = {
  name: 'Create GitHub Issue',
  description: 'Creates a new issue in the specified repository',
  fields: [
    {
      name: 'repository',
      type: 'text',
      label: 'Repository (owner/repo)',
      required: true,
      placeholder: 'octocat/Hello-World',
      dynamic: true,
      dynamicPlaceholder: '{{action.payload.repository.full_name}}',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Issue Title',
      required: true,
      placeholder: 'Bug report: Something is broken',
      dynamic: true,
      dynamicPlaceholder: '{{action.payload.pull_request.title}} - Issue',
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Issue Description',
      required: false,
      placeholder: 'Describe the issue in detail...',
      dynamic: true,
      dynamicPlaceholder:
        'Issue created from PR: {{action.payload.pull_request.body}}\n\nMerged by: {{action.payload.pull_request.merged_by.login}}',
    },
    {
      name: 'labels',
      type: 'text',
      label: 'Labels (comma-separated)',
      required: false,
      placeholder: 'bug,urgent',
    },
    {
      name: 'assignees',
      type: 'text',
      label: 'Assignees (comma-separated usernames)',
      required: false,
      placeholder: 'octocat,monalisa',
      dynamic: true,
      dynamicPlaceholder: '{{action.payload.pull_request.user.login}}',
    },
  ],
};

export const githubAddCommentSchema: ActionReactionSchema = {
  name: 'Add GitHub Comment',
  description: 'Adds a comment to an issue or pull request',
  fields: [
    {
      name: 'repository',
      type: 'text',
      label: 'Repository (owner/repo)',
      required: true,
      placeholder: 'octocat/Hello-World',
    },
    {
      name: 'issue_number',
      type: 'number',
      label: 'Issue/PR Number',
      required: true,
      placeholder: '123',
      dynamic: true,
      dynamicPlaceholder: '{{action.payload.pull_request.number}}',
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Comment Body',
      required: true,
      placeholder: 'This is an automated comment from AREA',
      dynamic: true,
      dynamicPlaceholder:
        '🎉 PR merged successfully!\n\n**Title:** {{action.payload.pull_request.title}}\n**Merged by:** {{action.payload.pull_request.merged_by.login}}\n**Merge commit:** {{action.payload.pull_request.merge_commit_sha}}',
    },
  ],
};
