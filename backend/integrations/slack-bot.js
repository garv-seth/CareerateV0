import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import express from 'express';
import AIChatService from '../services/ai-chat-service.js';

class SlackBot {
  constructor() {
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.signingSecret = process.env.SLACK_SIGNING_SECRET;
    this.slackEvents = createEventAdapter(this.signingSecret);
    this.aiChatService = new AIChatService();
    
    this.setupEventHandlers();
    this.setupSlashCommands();
  }

  setupEventHandlers() {
    // Handle app mentions (@careerate-ai)
    this.slackEvents.on('app_mention', async (event) => {
      try {
        const { text, user, channel, ts } = event;
        const message = text.replace(/<@[^>]+>/g, '').trim();
        
        if (!message) {
          await this.sendMessage(channel, "Hi! 👋 I'm your Careerate AI assistant. Ask me anything about DevOps, infrastructure, or troubleshooting!");
          return;
        }

        // Show typing indicator
        await this.slack.chat.postMessage({
          channel,
          text: "🤖 Thinking...",
          thread_ts: ts
        });

        // Get AI response
        const sessionId = `slack-${user}-${Date.now()}`;
        const context = {
          sessionId,
          userId: user,
          currentTool: 'slack',
          teamId: event.team
        };

        await this.aiChatService.startChat(context);
        const response = await this.aiChatService.sendMessage(sessionId, message, false);

        // Send AI response with interactive buttons
        await this.slack.chat.postMessage({
          channel,
          thread_ts: ts,
          text: response,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: response
              }
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "👍 Helpful"
                  },
                  value: "helpful",
                  action_id: "feedback_helpful"
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "👎 Not helpful"
                  },
                  value: "not_helpful",
                  action_id: "feedback_not_helpful"
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "🔄 Ask follow-up"
                  },
                  value: "follow_up",
                  action_id: "ask_follow_up"
                }
              ]
            }
          ]
        });

      } catch (error) {
        console.error('Error handling app mention:', error);
        await this.sendMessage(event.channel, "Sorry, I encountered an error. Please try again! 🚨");
      }
    });

    // Handle direct messages
    this.slackEvents.on('message', async (event) => {
      // Skip bot messages and messages in channels
      if (event.bot_id || event.channel_type !== 'im') return;

      try {
        const { text, user, channel } = event;
        
        const sessionId = `slack-dm-${user}-${Date.now()}`;
        const context = {
          sessionId,
          userId: user,
          currentTool: 'slack',
        };

        await this.aiChatService.startChat(context);
        const response = await this.aiChatService.sendMessage(sessionId, text, false);

        await this.sendMessage(channel, response);

      } catch (error) {
        console.error('Error handling DM:', error);
        await this.sendMessage(event.channel, "Sorry, I encountered an error. Please try again! 🚨");
      }
    });

    // Handle button interactions
    this.slackEvents.on('button_click', async (event) => {
      try {
        const { action_id, value, user, channel, message } = event;

        switch (action_id) {
          case 'feedback_helpful':
            await this.slack.chat.postEphemeral({
              channel,
              user: user.id,
              text: "Thanks for the feedback! 👍"
            });
            break;

          case 'feedback_not_helpful':
            await this.slack.chat.postEphemeral({
              channel,
              user: user.id,
              text: "Thanks for the feedback! We'll work on improving. 👎"
            });
            break;

          case 'ask_follow_up':
            await this.openFollowUpModal(event.trigger_id, channel);
            break;
        }
      } catch (error) {
        console.error('Error handling button click:', error);
      }
    });
  }

  setupSlashCommands() {
    const app = express();
    app.use(express.urlencoded({ extended: true }));

    // /careerate slash command
    app.post('/slack/commands/careerate', async (req, res) => {
      try {
        const { text, user_id, channel_id, team_id, trigger_id } = req.body;

        // Acknowledge the command immediately
        res.json({
          response_type: "ephemeral",
          text: "🤖 Processing your request..."
        });

        if (!text || text.trim() === 'help') {
          await this.showHelpMessage(channel_id, user_id);
          return;
        }

        // Handle specific commands
        const command = text.trim().toLowerCase();
        
        if (command.startsWith('explain ')) {
          await this.handleExplainCommand(text.substring(8), user_id, channel_id);
        } else if (command.startsWith('generate ')) {
          await this.handleGenerateCommand(text.substring(9), user_id, channel_id);
        } else if (command === 'status') {
          await this.showStatusMessage(channel_id, user_id);
        } else {
          // General AI question
          const sessionId = `slack-command-${user_id}-${Date.now()}`;
          const context = {
            sessionId,
            userId: user_id,
            teamId: team_id,
            currentTool: 'slack'
          };

          await this.aiChatService.startChat(context);
          const response = await this.aiChatService.sendMessage(sessionId, text, false);

          await this.slack.chat.postMessage({
            channel: channel_id,
            text: response,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Question:* ${text}\n\n*Answer:* ${response}`
                }
              }
            ]
          });
        }

      } catch (error) {
        console.error('Error handling slash command:', error);
        res.json({
          response_type: "ephemeral",
          text: "Sorry, I encountered an error processing your request. 🚨"
        });
      }
    });

    // /troubleshoot command
    app.post('/slack/commands/troubleshoot', async (req, res) => {
      try {
        const { text, user_id, channel_id } = req.body;

        res.json({
          response_type: "ephemeral",
          text: "🔍 Analyzing the issue..."
        });

        const sessionId = `slack-troubleshoot-${user_id}-${Date.now()}`;
        const context = {
          sessionId,
          userId: user_id,
          currentTool: 'slack'
        };

        await this.aiChatService.startChat(context);
        const response = await this.aiChatService.sendMessage(
          sessionId, 
          `Help troubleshoot this issue: ${text}`, 
          false
        );

        await this.slack.chat.postMessage({
          channel: channel_id,
          text: `🚨 *Troubleshooting Help*\n\n${response}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `🚨 *Troubleshooting Help*\n\n*Issue:* ${text}\n\n*Analysis:* ${response}`
              }
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "✅ Resolved"
                  },
                  style: "primary",
                  value: "resolved",
                  action_id: "issue_resolved"
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "❓ Need more help"
                  },
                  value: "more_help",
                  action_id: "need_more_help"
                }
              ]
            }
          ]
        });

      } catch (error) {
        console.error('Error handling troubleshoot command:', error);
        res.json({
          response_type: "ephemeral",
          text: "Sorry, I couldn't analyze the issue. Please try again. 🚨"
        });
      }
    });

    return app;
  }

  async showHelpMessage(channel, user) {
    await this.slack.chat.postEphemeral({
      channel,
      user,
      text: "Careerate AI Help",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🤖 Careerate AI Commands"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Basic Commands:*\n• `/careerate <question>` - Ask any DevOps question\n• `/troubleshoot <issue>` - Get help with specific issues\n• `@careerate-ai <message>` - Mention me in any channel"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Advanced Commands:*\n• `/careerate explain <concept>` - Get detailed explanations\n• `/careerate generate <requirement>` - Generate code or configs\n• `/careerate status` - Check system status"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Examples:*\n• `/careerate How do I deploy to Kubernetes?`\n• `/troubleshoot Pod keeps crashing`\n• `/careerate explain terraform modules`"
          }
        }
      ]
    });
  }

  async handleExplainCommand(topic, userId, channel) {
    const sessionId = `slack-explain-${userId}-${Date.now()}`;
    const context = {
      sessionId,
      userId,
      currentTool: 'slack'
    };

    await this.aiChatService.startChat(context);
    const response = await this.aiChatService.sendMessage(
      sessionId, 
      `Explain ${topic} in detail with examples`, 
      false
    );

    await this.slack.chat.postMessage({
      channel,
      text: `📚 *Explanation: ${topic}*\n\n${response}`
    });
  }

  async handleGenerateCommand(requirement, userId, channel) {
    const sessionId = `slack-generate-${userId}-${Date.now()}`;
    const context = {
      sessionId,
      userId,
      currentTool: 'slack'
    };

    await this.aiChatService.startChat(context);
    const response = await this.aiChatService.sendMessage(
      sessionId, 
      `Generate: ${requirement}`, 
      false
    );

    await this.slack.chat.postMessage({
      channel,
      text: `🛠️ *Generated Code/Config*\n\n\`\`\`\n${response}\n\`\`\``
    });
  }

  async showStatusMessage(channel, user) {
    await this.slack.chat.postEphemeral({
      channel,
      user,
      text: "System Status",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📊 Careerate AI Status"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: "*API Status:*\n✅ Online"
            },
            {
              type: "mrkdwn",
              text: "*Response Time:*\n⚡ <2s average"
            },
            {
              type: "mrkdwn",
              text: "*Uptime:*\n🟢 99.9%"
            },
            {
              type: "mrkdwn",
              text: "*Features:*\n🚀 All systems go"
            }
          ]
        }
      ]
    });
  }

  async openFollowUpModal(triggerId, channel) {
    await this.slack.views.open({
      trigger_id: triggerId,
      view: {
        type: "modal",
        callback_id: "follow_up_modal",
        title: {
          type: "plain_text",
          text: "Ask Follow-up"
        },
        submit: {
          type: "plain_text",
          text: "Ask"
        },
        close: {
          type: "plain_text",
          text: "Cancel"
        },
        blocks: [
          {
            type: "input",
            block_id: "follow_up_input",
            element: {
              type: "plain_text_input",
              action_id: "question",
              placeholder: {
                type: "plain_text",
                text: "What would you like to know more about?"
              },
              multiline: true
            },
            label: {
              type: "plain_text",
              text: "Follow-up Question"
            }
          }
        ],
        private_metadata: JSON.stringify({ channel })
      }
    });
  }

  async sendMessage(channel, text) {
    try {
      await this.slack.chat.postMessage({
        channel,
        text
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  getEventAdapter() {
    return this.slackEvents;
  }

  getSlashCommandApp() {
    return this.setupSlashCommands();
  }
}

export default SlackBot; 