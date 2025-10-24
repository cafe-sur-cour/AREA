import { jest } from '@jest/globals';

describe('GitLab Schemas', () => {
  describe('gitlabPushSchema', () => {
    it('should have correct structure', () => {
      const {
        gitlabPushSchema,
      } = require('../../../src/services/services/gitlab/schemas');

      expect(gitlabPushSchema).toEqual({
        name: 'GitLab Push',
        description:
          'Triggers when a push event occurs on a selected repository',
        fields: [
          {
            name: 'project',
            type: 'text',
            label: 'Project Path (group/project)',
            required: true,
            placeholder: 'my-group/my-project',
          },
          {
            name: 'branch',
            type: 'text',
            label: 'Branch (optional, defaults to all branches)',
            required: false,
            placeholder: 'main',
          },
        ],
      });
    });
  });

  describe('gitlabMergeRequestOpenedSchema', () => {
    it('should have correct structure', () => {
      const {
        gitlabMergeRequestOpenedSchema,
      } = require('../../../src/services/services/gitlab/schemas');

      expect(gitlabMergeRequestOpenedSchema).toEqual({
        name: 'GitLab Merge Request Opened',
        description: 'Triggers when a new merge request is opened',
        fields: [
          {
            name: 'project',
            type: 'text',
            label: 'Project Path (group/project)',
            required: true,
            placeholder: 'my-group/my-project',
          },
        ],
      });
    });
  });

  describe('gitlabMergeRequestMergedSchema', () => {
    it('should have correct structure', () => {
      const {
        gitlabMergeRequestMergedSchema,
      } = require('../../../src/services/services/gitlab/schemas');

      expect(gitlabMergeRequestMergedSchema).toEqual({
        name: 'GitLab Merge Request Merged',
        description: 'Triggers when a merge request is merged',
        fields: [
          {
            name: 'project',
            type: 'text',
            label: 'Project Path (group/project)',
            required: true,
            placeholder: 'my-group/my-project',
          },
        ],
      });
    });
  });

  describe('gitlabIssueOpenedSchema', () => {
    it('should have correct structure', () => {
      const {
        gitlabIssueOpenedSchema,
      } = require('../../../src/services/services/gitlab/schemas');

      expect(gitlabIssueOpenedSchema).toEqual({
        name: 'GitLab Issue Opened',
        description: 'Triggers when a new issue is opened',
        fields: [
          {
            name: 'project',
            type: 'text',
            label: 'Project Path (group/project)',
            required: true,
            placeholder: 'my-group/my-project',
          },
        ],
      });
    });
  });

  describe('gitlabCreateIssueSchema', () => {
    it('should have correct structure', () => {
      const {
        gitlabCreateIssueSchema,
      } = require('../../../src/services/services/gitlab/schemas');

      expect(gitlabCreateIssueSchema).toEqual({
        name: 'Create GitLab Issue',
        description: 'Creates a new issue in the specified project',
        fields: [
          {
            name: 'project',
            type: 'text',
            label: 'Project Path (group/project)',
            required: true,
            placeholder: 'my-group/my-project',
          },
          {
            name: 'title',
            type: 'text',
            label: 'Issue Title',
            required: true,
            placeholder: 'Enter issue title...',
            dynamic: true,
            dynamicPlaceholder:
              'New Issue: {{action.payload.object_attributes.title}}',
          },
          {
            name: 'description',
            type: 'textarea',
            label: 'Issue Description',
            required: false,
            placeholder: 'Describe the issue in detail...',
            dynamic: true,
            dynamicPlaceholder:
              'Issue created from MR: {{action.payload.object_attributes.description}}\n\nAuthor: {{action.payload.user.name}}',
          },
          {
            name: 'labels',
            type: 'text',
            label: 'Labels (comma-separated)',
            required: false,
            placeholder: 'bug,urgent',
          },
          {
            name: 'assignee_ids',
            type: 'text',
            label: 'Assignee IDs (comma-separated)',
            required: false,
            placeholder: '1,2,3',
            dynamic: true,
            dynamicPlaceholder: '{{action.payload.user.id}}',
          },
        ],
      });
    });
  });

  describe('gitlabAddCommentSchema', () => {
    it('should have correct structure', () => {
      const {
        gitlabAddCommentSchema,
      } = require('../../../src/services/services/gitlab/schemas');

      expect(gitlabAddCommentSchema).toEqual({
        name: 'Add GitLab Comment',
        description: 'Adds a comment to an issue or merge request',
        fields: [
          {
            name: 'project',
            type: 'text',
            label: 'Project Path (group/project)',
            required: true,
            placeholder: 'my-group/my-project',
          },
          {
            name: 'issue_iid',
            type: 'text',
            label: 'Issue/MR Internal ID',
            required: true,
            placeholder: '1',
            dynamic: true,
            dynamicPlaceholder: '{{action.payload.object_attributes.iid}}',
          },
          {
            name: 'note_type',
            type: 'select',
            label: 'Note Type',
            required: true,
            options: [
              { value: 'issue', label: 'Issue' },
              { value: 'merge_request', label: 'Merge Request' },
            ],
            default: 'issue',
          },
          {
            name: 'body',
            type: 'textarea',
            label: 'Comment Body',
            required: true,
            placeholder: 'Enter your comment...',
            dynamic: true,
            dynamicPlaceholder:
              'Automated comment from AREA: {{action.payload.object_attributes.title}}',
          },
        ],
      });
    });
  });

  describe('gitlabCreateMergeRequestSchema', () => {
    it('should have correct structure', () => {
      const {
        gitlabCreateMergeRequestSchema,
      } = require('../../../src/services/services/gitlab/schemas');

      expect(gitlabCreateMergeRequestSchema).toEqual({
        name: 'Create GitLab Merge Request',
        description: 'Creates a new merge request in the specified project',
        fields: [
          {
            name: 'project',
            type: 'text',
            label: 'Project Path (group/project)',
            required: true,
            placeholder: 'my-group/my-project',
          },
          {
            name: 'source_branch',
            type: 'text',
            label: 'Source Branch',
            required: true,
            placeholder: 'feature-branch',
            dynamic: true,
            dynamicPlaceholder: '{{action.payload.ref}}',
          },
          {
            name: 'target_branch',
            type: 'text',
            label: 'Target Branch',
            required: true,
            placeholder: 'main',
            default: 'main',
          },
          {
            name: 'title',
            type: 'text',
            label: 'Merge Request Title',
            required: true,
            placeholder: 'Enter MR title...',
            dynamic: true,
            dynamicPlaceholder:
              'MR: {{action.payload.object_attributes.title}}',
          },
          {
            name: 'description',
            type: 'textarea',
            label: 'Merge Request Description',
            required: false,
            placeholder: 'Describe the changes...',
            dynamic: true,
            dynamicPlaceholder:
              'Automated MR from push to {{action.payload.ref}}\n\nCommits:\n{{action.payload.commits}}',
          },
          {
            name: 'assignee_ids',
            type: 'text',
            label: 'Assignee IDs (comma-separated)',
            required: false,
            placeholder: '1,2,3',
            dynamic: true,
            dynamicPlaceholder: '{{action.payload.user.id}}',
          },
        ],
      });
    });
  });

  describe('gitlabSetProjectVisibilitySchema', () => {
    it('should have correct structure', () => {
      const {
        gitlabSetProjectVisibilitySchema,
      } = require('../../../src/services/services/gitlab/schemas');

      expect(gitlabSetProjectVisibilitySchema).toEqual({
        name: 'Set GitLab Project Visibility',
        description: 'Changes the visibility level of a project',
        fields: [
          {
            name: 'project',
            type: 'text',
            label: 'Project Path (group/project)',
            required: true,
            placeholder: 'my-group/my-project',
          },
          {
            name: 'visibility',
            type: 'select',
            label: 'Visibility Level',
            required: true,
            options: [
              { value: 'private', label: 'Private' },
              { value: 'internal', label: 'Internal' },
              { value: 'public', label: 'Public' },
            ],
            default: 'private',
          },
        ],
      });
    });
  });
});
