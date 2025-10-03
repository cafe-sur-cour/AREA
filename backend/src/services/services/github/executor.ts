import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';

interface GitHubIssueData {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
}

interface GitHubCommentData {
  body: string;
}

interface GitHubIssueResponse {
  id: number;
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: string;
  labels: Array<{ name: string }>;
  assignees: Array<{ login: string }>;
}

interface GitHubCommentResponse {
  id: number;
  body: string;
  html_url: string;
  user: {
    login: string;
    id: number;
  };
  created_at: string;
}

export class GitHubReactionExecutor implements ReactionExecutor {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.SERVICE_GITHUB_API_BASE_URL || '';
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
          error: 'GitHub access token not configured',
        };
      }

      switch (reaction.type) {
        case 'github.create_issue':
          return await this.createIssue(reaction.config, accessToken);
        case 'github.add_comment':
          return await this.addComment(reaction.config, accessToken);
        default:
          return {
            success: false,
            error: `Unknown reaction type: ${reaction.type}`,
          };
      }
    } catch (error) {
      console.error('GitHub reaction execution error:', error);
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
    const { repository, title, body, labels, assignees } = config as {
      repository: string;
      title: string;
      body?: string;
      labels?: string;
      assignees?: string;
    };

    if (!repository || !title) {
      return {
        success: false,
        error: 'Repository and title are required for creating an issue',
      };
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return {
        success: false,
        error: 'Invalid repository format. Expected: owner/repo',
      };
    }

    const issueData: GitHubIssueData = {
      title,
      body: body || '',
    };

    if (labels) {
      issueData.labels = labels.split(',').map((label: string) => label.trim());
    }

    if (assignees) {
      issueData.assignees = assignees
        .split(',')
        .map((assignee: string) => assignee.trim());
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/repos/${owner}/${repo}/issues`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AREA-App',
          },
          body: JSON.stringify(issueData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ [GitHub Executor] Failed to create issue in ${repository}: ${response.status} ${response.statusText}`, errorData.message);
        return {
          success: false,
          error: `GitHub API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`,
        };
      }

      const issue: GitHubIssueResponse = await response.json();
      console.log(`✅ [GitHub Executor] Issue created: ${issue.html_url}`);

      return {
        success: true,
        output: {
          issue: {
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            html_url: issue.html_url,
            state: issue.state,
            labels:
              issue.labels?.map((label: { name: string }) => label.name) || [],
            assignees:
              issue.assignees?.map(
                (assignee: { login: string }) => assignee.login
              ) || [],
          },
        },
        metadata: {
          repository,
          issue_number: issue.number,
          issue_url: issue.html_url,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while creating issue: ${(error as Error).message}`,
      };
    }
  }

  private async addComment(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { repository, issue_number, body } = config as {
      repository: string;
      issue_number: number;
      body: string;
    };

    if (!repository || !issue_number || !body) {
      return {
        success: false,
        error:
          'Repository, issue_number, and body are required for adding a comment',
      };
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return {
        success: false,
        error: 'Invalid repository format. Expected: owner/repo',
      };
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/repos/${owner}/${repo}/issues/${issue_number}/comments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AREA-App',
          },
          body: JSON.stringify({ body } as GitHubCommentData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `GitHub API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`,
        };
      }

      const comment: GitHubCommentResponse = await response.json();

      return {
        success: true,
        output: {
          comment: {
            id: comment.id,
            body: comment.body,
            html_url: comment.html_url,
            user: {
              login: comment.user.login,
              id: comment.user.id,
            },
            created_at: comment.created_at,
          },
        },
        metadata: {
          repository,
          issue_number,
          comment_id: comment.id,
          comment_url: comment.html_url,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while adding comment: ${(error as Error).message}`,
      };
    }
  }
}

export const githubReactionExecutor = new GitHubReactionExecutor();
