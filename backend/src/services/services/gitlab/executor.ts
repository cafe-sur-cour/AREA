import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';

interface GitLabIssueData {
  project: string;
  title: string;
  description?: string;
  labels?: string;
  assignee_ids?: string;
}

interface GitLabNoteData {
  body: string;
}

interface GitLabMergeRequestData {
  project: string;
  title: string;
  description?: string;
  source_branch: string;
  target_branch: string;
  assignee_ids?: string;
}

interface GitLabProjectData {
  project: string;
  visibility: string;
}

interface GitLabIssueResponse {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  web_url: string;
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  assignees: Array<{
    id: number;
    name: string;
    username: string;
  }>;
  author: {
    id: number;
    name: string;
    username: string;
  };
  created_at: string;
}

interface GitLabNoteResponse {
  id: number;
  body: string;
  author: {
    id: number;
    name: string;
    username: string;
  };
  created_at: string;
  system: boolean;
  noteable_type: string;
  noteable_id: number;
}

interface GitLabMergeRequestResponse {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  web_url: string;
  source_branch: string;
  target_branch: string;
  author: {
    id: number;
    name: string;
    username: string;
  };
  assignees: Array<{
    id: number;
    name: string;
    username: string;
  }>;
  created_at: string;
}

interface GitLabProjectResponse {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  visibility: string;
  web_url: string;
  description: string;
  updated_at: string;
}

export class GitLabReactionExecutor implements ReactionExecutor {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = 'https://gitlab.com/api/v4';
  }

  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction, serviceConfig } = context;

    try {
      const accessToken = serviceConfig.credentials?.access_token;
      if (!accessToken) {
        return {
          success: false,
          error: 'GitLab access token not configured',
        };
      }

      switch (reaction.type) {
        case 'gitlab.create_issue':
          return await this.createIssue(reaction.config, accessToken);
        case 'gitlab.add_comment':
          return await this.addComment(reaction.config, accessToken);
        case 'gitlab.create_merge_request':
          return await this.createMergeRequest(reaction.config, accessToken);
        case 'gitlab.set_project_visibility':
          return await this.setProjectVisibility(reaction.config, accessToken);
        default:
          return {
            success: false,
            error: `Unknown reaction type: ${reaction.type}`,
          };
      }
    } catch (error) {
      console.error('GitLab reaction execution error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async createIssue(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const project = config.project as string;
    const title = config.title as string;
    const description = config.description as string | undefined;
    const labels = config.labels as string | undefined;
    const assignee_ids = config.assignee_ids as string | undefined;

    if (!project || !title) {
      return {
        success: false,
        error: 'Project path and title are required for creating an issue',
      };
    }

    const projectPath = encodeURIComponent(project);
    const url = `${this.apiBaseUrl}/projects/${projectPath}/issues`;

    const issueData: Record<string, unknown> = {
      title,
    };

    if (description) {
      issueData.description = description;
    }

    if (labels) {
      issueData.labels = labels;
    }

    if (assignee_ids) {
      const assigneeIds = assignee_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (assigneeIds.length > 0) {
        issueData.assignee_ids = assigneeIds;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AREA-App',
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `GitLab API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`,
        };
      }

      const issue: GitLabIssueResponse = await response.json();

      return {
        success: true,
        output: {
          issue: {
            id: issue.id,
            iid: issue.iid,
            title: issue.title,
            description: issue.description,
            state: issue.state,
            web_url: issue.web_url,
            labels: issue.labels,
            assignees: issue.assignees,
            author: issue.author,
            created_at: issue.created_at,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create GitLab issue: ${(error as Error).message}`,
      };
    }
  }

  private async addComment(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const project = config.project as string;
    const issue_iid = config.issue_iid as string;
    const note_type = config.note_type as 'issue' | 'merge_request';
    const body = config.body as string;

    if (!project || !issue_iid || !body || !note_type) {
      return {
        success: false,
        error: 'Project path, issue/MR IID, note type, and body are required for adding a comment',
      };
    }

    const projectPath = encodeURIComponent(project);
    const noteableType = note_type === 'merge_request' ? 'merge_requests' : 'issues';
    const url = `${this.apiBaseUrl}/projects/${projectPath}/${noteableType}/${issue_iid}/notes`;

    const noteData: GitLabNoteData = {
      body,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AREA-App',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `GitLab API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`,
        };
      }

      const note: GitLabNoteResponse = await response.json();

      return {
        success: true,
        output: {
          note: {
            id: note.id,
            body: note.body,
            author: note.author,
            created_at: note.created_at,
            system: note.system,
            noteable_type: note.noteable_type,
            noteable_id: note.noteable_id,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add GitLab comment: ${(error as Error).message}`,
      };
    }
  }

  private async createMergeRequest(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const project = config.project as string;
    const title = config.title as string;
    const description = config.description as string | undefined;
    const source_branch = config.source_branch as string;
    const target_branch = config.target_branch as string;
    const assignee_ids = config.assignee_ids as string | undefined;

    if (!project || !title || !source_branch || !target_branch) {
      return {
        success: false,
        error: 'Project path, title, source branch, and target branch are required for creating a merge request',
      };
    }

    const projectPath = encodeURIComponent(project);
    const url = `${this.apiBaseUrl}/projects/${projectPath}/merge_requests`;

    const mergeRequestData: Record<string, unknown> = {
      title,
      source_branch,
      target_branch,
    };

    if (description) {
      mergeRequestData.description = description;
    }

    if (assignee_ids) {
      const assigneeIds = assignee_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (assigneeIds.length > 0) {
        mergeRequestData.assignee_ids = assigneeIds;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AREA-App',
        },
        body: JSON.stringify(mergeRequestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `GitLab API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`,
        };
      }

      const mergeRequest: GitLabMergeRequestResponse = await response.json();

      return {
        success: true,
        output: {
          merge_request: {
            id: mergeRequest.id,
            iid: mergeRequest.iid,
            title: mergeRequest.title,
            description: mergeRequest.description,
            state: mergeRequest.state,
            web_url: mergeRequest.web_url,
            source_branch: mergeRequest.source_branch,
            target_branch: mergeRequest.target_branch,
            author: mergeRequest.author,
            assignees: mergeRequest.assignees,
            created_at: mergeRequest.created_at,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create GitLab merge request: ${(error as Error).message}`,
      };
    }
  }

  private async setProjectVisibility(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const project = config.project as string;
    const visibility = config.visibility as string;

    if (!project || !visibility) {
      return {
        success: false,
        error: 'Project path and visibility level are required for setting project visibility',
      };
    }

    if (!['private', 'internal', 'public'].includes(visibility)) {
      return {
        success: false,
        error: 'Visibility must be one of: private, internal, public',
      };
    }

    const projectPath = encodeURIComponent(project);
    const url = `${this.apiBaseUrl}/projects/${projectPath}`;

    const projectData: GitLabProjectData = {
        project,
      visibility,
    };

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AREA-App',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `GitLab API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`,
        };
      }

      const projectResponse: GitLabProjectResponse = await response.json();

      return {
        success: true,
        output: {
          project: {
            id: projectResponse.id,
            name: projectResponse.name,
            path: projectResponse.path,
            path_with_namespace: projectResponse.path_with_namespace,
            visibility: projectResponse.visibility,
            web_url: projectResponse.web_url,
            description: projectResponse.description,
            updated_at: projectResponse.updated_at,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update GitLab project visibility: ${(error as Error).message}`,
      };
    }
  }
}

export const gitlabReactionExecutor = new GitLabReactionExecutor();
