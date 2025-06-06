// GitHub Content Script for Context Detection
import { PrivacyManager } from '../privacy/privacy-manager.js';

interface GitHubContext {
  type: 'repository' | 'issue' | 'pull_request' | 'code' | 'actions' | 'error';
  repository?: string;
  branch?: string;
  file?: string;
  language?: string;
  content?: string;
  metadata?: any;
}

class GitHubDetector {
  private privacyManager: PrivacyManager;
  private currentContext: GitHubContext | null = null;

  constructor() {
    this.privacyManager = new PrivacyManager();
    this.initialize();
  }

  private initialize() {
    this.detectPageType();
    this.setupObservers();
    this.injectHelpButton();
  }

  private detectPageType() {
    const url = window.location.href;
    const pathname = window.location.pathname;

    // Extract repository information
    const repoMatch = pathname.match(/\/([^\/]+)\/([^\/]+)/);
    const repository = repoMatch ? `${repoMatch[1]}/${repoMatch[2]}` : undefined;

    if (pathname.includes('/issues/')) {
      this.handleIssuePage(repository!);
    } else if (pathname.includes('/pull/')) {
      this.handlePullRequestPage(repository!);
    } else if (pathname.includes('/blob/') || pathname.includes('/tree/')) {
      this.handleCodePage(repository!);
    } else if (pathname.includes('/actions')) {
      this.handleActionsPage(repository!);
    } else if (repository) {
      this.handleRepositoryPage(repository);
    }
  }

  private handleRepositoryPage(repository: string) {
    this.currentContext = {
      type: 'repository',
      repository,
      metadata: this.extractRepositoryMetadata(),
    };

    this.sendContextToBackground();
  }

  private handleIssuePage(repository: string) {
    const issueNumber = this.extractIssueNumber();
    const issueContent = this.extractIssueContent();

    this.currentContext = {
      type: 'issue',
      repository,
      content: issueContent,
      metadata: {
        issueNumber,
        title: this.getPageTitle(),
        labels: this.extractLabels(),
        assignees: this.extractAssignees(),
      },
    };

    this.sendContextToBackground();
  }

  private handlePullRequestPage(repository: string) {
    const prNumber = this.extractPRNumber();
    const prContent = this.extractPRContent();

    this.currentContext = {
      type: 'pull_request',
      repository,
      content: prContent,
      metadata: {
        prNumber,
        title: this.getPageTitle(),
        changedFiles: this.extractChangedFiles(),
        reviewers: this.extractReviewers(),
      },
    };

    this.sendContextToBackground();
  }

  private handleCodePage(repository: string) {
    const codeContent = this.extractCodeContent();
    const language = this.detectLanguage();
    const file = this.extractFilePath();
    const branch = this.extractBranch();

    this.currentContext = {
      type: 'code',
      repository,
      branch,
      file,
      language,
      content: codeContent,
      metadata: {
        lineCount: this.getLineCount(),
        fileSize: this.getFileSize(),
      },
    };

    this.sendContextToBackground();
  }

  private handleActionsPage(repository: string) {
    const workflowData = this.extractWorkflowData();

    this.currentContext = {
      type: 'actions',
      repository,
      content: workflowData,
      metadata: {
        workflow: this.extractWorkflowName(),
        status: this.extractWorkflowStatus(),
        logs: this.extractErrorLogs(),
      },
    };

    this.sendContextToBackground();
  }

  private setupObservers() {
    // Watch for page changes (GitHub is a SPA)
    const observer = new MutationObserver((mutations) => {
      let shouldRedetect = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if URL changed or significant content added
          shouldRedetect = true;
        }
      });

      if (shouldRedetect) {
        setTimeout(() => this.detectPageType(), 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Listen for error elements
    this.watchForErrors();
  }

  private watchForErrors() {
    // GitHub error messages
    const errorSelectors = [
      '.flash-error',
      '.flash-warn',
      '.error-message',
      '.octicon-alert',
      '[data-testid="error"]',
    ];

    errorSelectors.forEach(selector => {
      const observer = new MutationObserver(() => {
        const errorElements = document.querySelectorAll(selector);
        errorElements.forEach(element => {
          const errorText = element.textContent?.trim();
          if (errorText && this.privacyManager.isErrorSafeToShare(errorText)) {
            this.sendErrorContext(errorText);
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  private injectHelpButton() {
    // Inject Careerate help button into GitHub interface
    const helpButton = document.createElement('button');
    helpButton.className = 'careerate-help-btn';
    helpButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm.93 9l-1.83.01L7.8 6h1.6L9.93 9zm-1.5-4h-1v1h1V5z"/>
      </svg>
      Ask AI
    `;
    helpButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: #0969da;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    `;

    helpButton.addEventListener('mouseenter', () => {
      helpButton.style.background = '#0860ca';
      helpButton.style.transform = 'translateY(-2px)';
    });

    helpButton.addEventListener('mouseleave', () => {
      helpButton.style.background = '#0969da';
      helpButton.style.transform = 'translateY(0)';
    });

    helpButton.addEventListener('click', () => {
      this.openAIAssistant();
    });

    document.body.appendChild(helpButton);
  }

  private openAIAssistant() {
    // Send message to background script to open AI chat
    chrome.runtime.sendMessage({
      type: 'OPEN_AI_CHAT',
      context: this.currentContext,
      url: window.location.href,
    });
  }

  private sendContextToBackground() {
    if (!this.currentContext) return;

    chrome.runtime.sendMessage({
      type: 'COLLECT_CONTEXT',
      data: {
        ...this.currentContext,
        url: window.location.href,
        timestamp: Date.now(),
      },
    });
  }

  private sendErrorContext(errorText: string) {
    chrome.runtime.sendMessage({
      type: 'COLLECT_CONTEXT',
      data: {
        type: 'error',
        content: errorText,
        repository: this.currentContext?.repository,
        url: window.location.href,
        timestamp: Date.now(),
      },
    });
  }

  // Extraction methods
  private extractRepositoryMetadata() {
    const stats = document.querySelector('.BorderGrid-row .BorderGrid-cell');
    const description = document.querySelector('[data-testid="repo-description"]')?.textContent?.trim();
    const topics = Array.from(document.querySelectorAll('[data-testid="repo-topic"]')).map(
      el => el.textContent?.trim()
    );

    return {
      description,
      topics,
      stats: stats?.textContent?.trim(),
      language: document.querySelector('.BorderGrid .color-fg-default')?.textContent?.trim(),
    };
  }

  private extractIssueNumber(): number | undefined {
    const match = window.location.pathname.match(/\/issues\/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  private extractIssueContent(): string {
    const title = document.querySelector('.js-issue-title')?.textContent?.trim() || '';
    const body = document.querySelector('.comment-body')?.textContent?.trim() || '';
    return `${title}\n\n${body}`.trim();
  }

  private extractLabels(): string[] {
    return Array.from(document.querySelectorAll('.js-issue-labels .IssueLabel')).map(
      el => el.textContent?.trim() || ''
    );
  }

  private extractAssignees(): string[] {
    return Array.from(document.querySelectorAll('.assignee .avatar')).map(
      el => el.getAttribute('alt') || ''
    );
  }

  private extractPRNumber(): number | undefined {
    const match = window.location.pathname.match(/\/pull\/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  private extractPRContent(): string {
    const title = document.querySelector('.js-issue-title')?.textContent?.trim() || '';
    const description = document.querySelector('.comment-body')?.textContent?.trim() || '';
    return `${title}\n\n${description}`.trim();
  }

  private extractChangedFiles(): string[] {
    return Array.from(document.querySelectorAll('.file-header .file-info a')).map(
      el => el.textContent?.trim() || ''
    );
  }

  private extractReviewers(): string[] {
    return Array.from(document.querySelectorAll('.reviewers-status-icon')).map(
      el => el.getAttribute('alt') || ''
    );
  }

  private extractCodeContent(): string {
    const codeElement = document.querySelector('.blob-code-content, .highlight pre');
    return codeElement?.textContent?.trim() || '';
  }

  private detectLanguage(): string | undefined {
    // Try to get language from file extension
    const filepath = this.extractFilePath();
    if (filepath) {
      const extension = filepath.split('.').pop()?.toLowerCase();
      const languageMap: Record<string, string> = {
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'tf': 'terraform',
        'yaml': 'yaml',
        'yml': 'yaml',
        'json': 'json',
        'go': 'go',
        'rs': 'rust',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'sh': 'bash',
      };
      return languageMap[extension || ''] || extension;
    }

    // Try to get from syntax highlighting classes
    const highlightElement = document.querySelector('.highlight');
    if (highlightElement) {
      const classes = highlightElement.className;
      const languageMatch = classes.match(/language-(\w+)/);
      return languageMatch ? languageMatch[1] : undefined;
    }

    return undefined;
  }

  private extractFilePath(): string | undefined {
    const breadcrumb = document.querySelector('.breadcrumb');
    return breadcrumb?.textContent?.trim().replace(/\s+/g, '/');
  }

  private extractBranch(): string | undefined {
    const branchSelector = document.querySelector('.branch-select-menu summary');
    return branchSelector?.textContent?.trim();
  }

  private getLineCount(): number {
    const lines = document.querySelectorAll('.blob-num-js');
    return lines.length;
  }

  private getFileSize(): string | undefined {
    const sizeElement = document.querySelector('.file-info .text-mono');
    return sizeElement?.textContent?.trim();
  }

  private extractWorkflowData(): string {
    const logs = document.querySelector('.js-log-container')?.textContent?.trim() || '';
    const summary = document.querySelector('.job-summary')?.textContent?.trim() || '';
    return `${summary}\n\n${logs}`.trim();
  }

  private extractWorkflowName(): string | undefined {
    const nameElement = document.querySelector('.workflow-name, .js-workflow-name');
    return nameElement?.textContent?.trim();
  }

  private extractWorkflowStatus(): string | undefined {
    const statusElement = document.querySelector('.State, .status-indicator');
    return statusElement?.textContent?.trim();
  }

  private extractErrorLogs(): string[] {
    const errorElements = document.querySelectorAll('.log-line-error, .error-line');
    return Array.from(errorElements).map(el => el.textContent?.trim() || '');
  }

  private getPageTitle(): string {
    return document.title || '';
  }
}

// Initialize the GitHub detector
new GitHubDetector(); 