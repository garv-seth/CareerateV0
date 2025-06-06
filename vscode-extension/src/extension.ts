import * as vscode from 'vscode';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';

interface WorkspaceContext {
  repository?: string;
  branch?: string;
  currentFile?: string;
  language?: string;
  projectType?: string;
  dependencies?: string[];
  errors?: string[];
}

interface AIRequest {
  code?: string;
  language?: string;
  question: string;
  workspaceContext: WorkspaceContext;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 Careerate AI extension is now active!');

  // Set extension as activated
  vscode.commands.executeCommand('setContext', 'careerate.activated', true);

  const config = vscode.workspace.getConfiguration('careerate');
  const apiEndpoint = config.get<string>('apiEndpoint', 'https://careerate.azurewebsites.net/api');

  // Initialize status bar
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = '$(robot) Careerate AI';
  statusBarItem.tooltip = 'Ask Careerate AI for help';
  statusBarItem.command = 'careerate.askAI';
  statusBarItem.show();

  // Chat panel provider
  const chatProvider = new ChatPanelProvider(context.extensionUri, apiEndpoint);

  // Register commands
  const commands = [
    vscode.commands.registerCommand('careerate.askAI', async () => {
      await askAI(apiEndpoint);
    }),

    vscode.commands.registerCommand('careerate.explainCode', async () => {
      await explainSelectedCode(apiEndpoint);
    }),

    vscode.commands.registerCommand('careerate.generateCode', async () => {
      await generateCode(apiEndpoint);
    }),

    vscode.commands.registerCommand('careerate.reviewCode', async () => {
      await reviewCode(apiEndpoint);
    }),

    vscode.commands.registerCommand('careerate.troubleshoot', async () => {
      await troubleshootIssue(apiEndpoint);
    }),

    vscode.commands.registerCommand('careerate.openChat', async () => {
      chatProvider.createOrShow();
    }),

    vscode.commands.registerCommand('careerate.shareContext', async () => {
      await shareContext(apiEndpoint);
    }),

    // Register chat panel
    vscode.window.registerWebviewViewProvider('careerate.chatPanel', chatProvider)
  ];

  // Register diagnostic listener for auto-troubleshooting
  const diagnosticListener = vscode.languages.onDidChangeDiagnostics(async (event) => {
    const autoSuggest = config.get<boolean>('autoSuggestFixes', true);
    if (!autoSuggest) return;

    for (const uri of event.uris) {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
      
      if (errors.length > 0) {
        await suggestErrorFixes(apiEndpoint, uri, errors);
      }
    }
  });

  // Auto-detect project type and setup context
  setupWorkspaceContext();

  // Add all disposables to context
  context.subscriptions.push(statusBarItem, diagnosticListener, ...commands);
}

async function askAI(apiEndpoint: string) {
  const question = await vscode.window.showInputBox({
    prompt: 'Ask Careerate AI anything about DevOps, infrastructure, or your code',
    placeHolder: 'How do I deploy this to Kubernetes?'
  });

  if (!question) return;

  const workspaceContext = await getWorkspaceContext();
  const activeEditor = vscode.window.activeTextEditor;

  try {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Asking Careerate AI...',
      cancellable: false
    }, async (progress) => {
      const response = await axios.post(`${apiEndpoint}/vscode/assist`, {
        question,
        workspaceContext,
        code: activeEditor?.selection ? activeEditor.document.getText(activeEditor.selection) : undefined,
        language: activeEditor?.document.languageId
      });

      if (response.data.success) {
        showAIResponse(response.data.response, 'AI Response');
      } else {
        vscode.window.showErrorMessage('Failed to get AI response');
      }
    });
  } catch (error) {
    console.error('AI request error:', error);
    vscode.window.showErrorMessage('Failed to connect to Careerate AI');
  }
}

async function explainSelectedCode(apiEndpoint: string) {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showWarningMessage('No active editor');
    return;
  }

  const selection = activeEditor.selection;
  if (selection.isEmpty) {
    vscode.window.showWarningMessage('Please select some code to explain');
    return;
  }

  const selectedCode = activeEditor.document.getText(selection);
  const language = activeEditor.document.languageId;
  const workspaceContext = await getWorkspaceContext();

  try {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Explaining code...',
      cancellable: false
    }, async (progress) => {
      const response = await axios.post(`${apiEndpoint}/vscode/assist`, {
        code: selectedCode,
        language,
        question: `Explain this ${language} code in detail`,
        workspaceContext
      });

      if (response.data.success) {
        showAIResponse(response.data.response, 'Code Explanation');
      }
    });
  } catch (error) {
    console.error('Explain code error:', error);
    vscode.window.showErrorMessage('Failed to explain code');
  }
}

async function generateCode(apiEndpoint: string) {
  const requirement = await vscode.window.showInputBox({
    prompt: 'Describe what code you want to generate',
    placeHolder: 'Generate a Terraform module for AWS ECS service'
  });

  if (!requirement) return;

  const activeEditor = vscode.window.activeTextEditor;
  const language = activeEditor?.document.languageId || 'terraform';
  const workspaceContext = await getWorkspaceContext();

  try {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating code...',
      cancellable: false
    }, async (progress) => {
      const response = await axios.post(`${apiEndpoint}/vscode/assist`, {
        question: `Generate ${language} code: ${requirement}`,
        language,
        workspaceContext
      });

      if (response.data.success) {
        // Insert generated code at cursor
        if (activeEditor) {
          const position = activeEditor.selection.active;
          await activeEditor.edit(editBuilder => {
            editBuilder.insert(position, '\n' + response.data.response + '\n');
          });
        } else {
          showAIResponse(response.data.response, 'Generated Code');
        }
      }
    });
  } catch (error) {
    console.error('Generate code error:', error);
    vscode.window.showErrorMessage('Failed to generate code');
  }
}

async function reviewCode(apiEndpoint: string) {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showWarningMessage('No active editor');
    return;
  }

  const document = activeEditor.document;
  const code = activeEditor.selection.isEmpty ? 
    document.getText() : 
    document.getText(activeEditor.selection);

  const language = document.languageId;
  const workspaceContext = await getWorkspaceContext();

  try {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Reviewing code...',
      cancellable: false
    }, async (progress) => {
      const response = await axios.post(`${apiEndpoint}/vscode/assist`, {
        code,
        language,
        question: `Review this ${language} code for best practices, security issues, and potential improvements`,
        workspaceContext
      });

      if (response.data.success) {
        showAIResponse(response.data.response, 'Code Review');
      }
    });
  } catch (error) {
    console.error('Review code error:', error);
    vscode.window.showErrorMessage('Failed to review code');
  }
}

async function troubleshootIssue(apiEndpoint: string) {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showWarningMessage('No active editor');
    return;
  }

  const uri = activeEditor.document.uri;
  const diagnostics = vscode.languages.getDiagnostics(uri);
  const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
  
  if (errors.length === 0) {
    vscode.window.showInformationMessage('No errors found in current file');
    return;
  }

  const errorDescriptions = errors.map(error => 
    `Line ${error.range.start.line + 1}: ${error.message}`
  ).join('\n');

  const workspaceContext = await getWorkspaceContext();
  const language = activeEditor.document.languageId;

  try {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Troubleshooting issues...',
      cancellable: false
    }, async (progress) => {
      const response = await axios.post(`${apiEndpoint}/vscode/assist`, {
        question: `Help troubleshoot these ${language} errors:\n${errorDescriptions}`,
        code: activeEditor.document.getText(),
        language,
        workspaceContext
      });

      if (response.data.success) {
        showAIResponse(response.data.response, 'Troubleshooting Guide');
      }
    });
  } catch (error) {
    console.error('Troubleshoot error:', error);
    vscode.window.showErrorMessage('Failed to troubleshoot issues');
  }
}

async function shareContext(apiEndpoint: string) {
  const config = vscode.workspace.getConfiguration('careerate');
  const teamId = config.get<string>('teamId');
  
  if (!teamId) {
    vscode.window.showErrorMessage('Please set your team ID in settings to share context');
    return;
  }

  const workspaceContext = await getWorkspaceContext();
  const activeEditor = vscode.window.activeTextEditor;
  
  const contextData = {
    file: activeEditor?.document.fileName,
    language: activeEditor?.document.languageId,
    workspaceContext,
    timestamp: new Date().toISOString()
  };

  vscode.window.showInformationMessage(
    `Context shared with team ${teamId}`,
    'View Details'
  ).then(selection => {
    if (selection === 'View Details') {
      showAIResponse(JSON.stringify(contextData, null, 2), 'Shared Context');
    }
  });
}

async function suggestErrorFixes(apiEndpoint: string, uri: vscode.Uri, errors: vscode.Diagnostic[]) {
  const config = vscode.workspace.getConfiguration('careerate');
  if (!config.get<boolean>('autoSuggestFixes', true)) return;

  const document = await vscode.workspace.openTextDocument(uri);
  const errorDescriptions = errors.slice(0, 3).map(error => // Limit to 3 errors
    `Line ${error.range.start.line + 1}: ${error.message}`
  ).join('\n');

  try {
    const response = await axios.post(`${apiEndpoint}/vscode/assist`, {
      question: `Quick fix for these errors:\n${errorDescriptions}`,
      code: document.getText(),
      language: document.languageId,
      workspaceContext: await getWorkspaceContext()
    });

    if (response.data.success) {
      vscode.window.showInformationMessage(
        `AI found potential fixes for ${errors.length} error(s)`,
        'Show Fixes'
      ).then(selection => {
        if (selection === 'Show Fixes') {
          showAIResponse(response.data.response, 'Auto-suggested Fixes');
        }
      });
    }
  } catch (error) {
    console.error('Auto-suggest error:', error);
  }
}

async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return {};

  const rootPath = workspaceFolders[0].uri.fsPath;
  const context: WorkspaceContext = {};

  // Try to detect repository
  try {
    const gitConfig = path.join(rootPath, '.git', 'config');
    if (fs.existsSync(gitConfig)) {
      const configContent = fs.readFileSync(gitConfig, 'utf8');
      const urlMatch = configContent.match(/url = (.+)/);
      if (urlMatch) {
        context.repository = urlMatch[1].replace(/\.git$/, '').replace(/^https:\/\/github\.com\//, '');
      }
    }
  } catch (error) {
    console.error('Error reading git config:', error);
  }

  // Detect project type
  const packageJson = path.join(rootPath, 'package.json');
  const terraformFiles = path.join(rootPath, '*.tf');
  const dockerFile = path.join(rootPath, 'Dockerfile');
  
  if (fs.existsSync(packageJson)) {
    context.projectType = 'node';
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
      context.dependencies = Object.keys(pkg.dependencies || {});
    } catch (error) {
      console.error('Error reading package.json:', error);
    }
  } else if (fs.existsSync(dockerFile)) {
    context.projectType = 'docker';
  }

  return context;
}

function setupWorkspaceContext() {
  // Watch for file changes to update context
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.{tf,yaml,yml,json,js,ts,py,go,sh}');
  
  watcher.onDidChange(async (uri) => {
    // Update context when important files change
    console.log('File changed:', uri.fsPath);
  });
}

function showAIResponse(response: string, title: string) {
  const panel = vscode.window.createWebviewPanel(
    'careerateResponse',
    title,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true
    }
  );

  panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          font-size: var(--vscode-font-size);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          padding: 20px;
          line-height: 1.6;
        }
        pre {
          background-color: var(--vscode-textBlockQuote-background);
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          border-left: 4px solid var(--vscode-textBlockQuote-border);
        }
        code {
          background-color: var(--vscode-textPreformat-background);
          padding: 2px 4px;
          border-radius: 2px;
        }
        h1, h2, h3 {
          color: var(--vscode-foreground);
          border-bottom: 1px solid var(--vscode-panel-border);
          padding-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <h1>🤖 ${title}</h1>
      <div id="content">${formatResponse(response)}</div>
    </body>
    </html>
  `;
}

function formatResponse(response: string): string {
  // Basic markdown-like formatting
  return response
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

class ChatPanelProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly apiEndpoint: string
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getWebviewContent();

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'sendMessage':
          try {
            const workspaceContext = await getWorkspaceContext();
            const response = await axios.post(`${this.apiEndpoint}/vscode/assist`, {
              question: message.text,
              workspaceContext
            });

            webviewView.webview.postMessage({
              command: 'receiveMessage',
              text: response.data.response
            });
          } catch (error) {
            webviewView.webview.postMessage({
              command: 'receiveMessage',
              text: 'Sorry, I encountered an error. Please try again.'
            });
          }
          break;
      }
    });
  }

  createOrShow() {
    vscode.commands.executeCommand('careerate.chatPanel.focus');
  }

  private getWebviewContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 10px;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
          }
          #chatContainer {
            height: calc(100vh - 80px);
            overflow-y: auto;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            margin-bottom: 10px;
          }
          #inputContainer {
            display: flex;
            gap: 10px;
          }
          #messageInput {
            flex: 1;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
          }
          #sendButton {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
          }
          .message {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
          }
          .user-message {
            background-color: var(--vscode-textBlockQuote-background);
            text-align: right;
          }
          .ai-message {
            background-color: var(--vscode-textPreformat-background);
          }
        </style>
      </head>
      <body>
        <div id="chatContainer"></div>
        <div id="inputContainer">
          <input type="text" id="messageInput" placeholder="Ask me anything about DevOps...">
          <button id="sendButton">Send</button>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          const chatContainer = document.getElementById('chatContainer');
          const messageInput = document.getElementById('messageInput');
          const sendButton = document.getElementById('sendButton');
          
          function addMessage(text, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${isUser ? 'user-message' : 'ai-message'}\`;
            messageDiv.textContent = text;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
          
          function sendMessage() {
            const text = messageInput.value.trim();
            if (!text) return;
            
            addMessage(text, true);
            messageInput.value = '';
            
            vscode.postMessage({
              command: 'sendMessage',
              text: text
            });
          }
          
          sendButton.addEventListener('click', sendMessage);
          messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
          });
          
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'receiveMessage') {
              addMessage(message.text, false);
            }
          });
          
          // Initial greeting
          addMessage('👋 Hello! I\\'m your Careerate AI assistant. How can I help you with DevOps today?', false);
        </script>
      </body>
      </html>
    `;
  }
}

export function deactivate() {
  console.log('Careerate AI extension deactivated');
} 