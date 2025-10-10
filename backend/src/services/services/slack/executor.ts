import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';

export class SlackReactionExecutor implements ReactionExecutor {
  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    // TODO: Implement Slack reaction execution
    console.log('Executing Slack reaction:', context.reaction.type);
    return {
      success: false,
      error: 'Slack reactions not implemented yet',
    };
  }
}

export const slackReactionExecutor = new SlackReactionExecutor();
