#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";

class GitHubMCPServer {
  private server: Server;
  private octokit: Octokit;

  constructor() {
    this.server = new Server(
      {
        name: "careerate-github-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.initializeGitHubClient();
    this.setupToolHandlers();
  }

  private initializeGitHubClient() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "github_analyze_repository",
            description: "Analyze GitHub repository structure and health",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository in format 'owner/repo'",
                },
              },
              required: ["repository"],
            },
          },
          {
            name: "github_review_pull_request",
            description: "Review pull request and provide feedback",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository in format 'owner/repo'",
                },
                pullNumber: {
                  type: "number",
                  description: "Pull request number",
                },
                focusAreas: {
                  type: "array",
                  items: { type: "string" },
                  description: "Areas to focus on (security, performance, etc.)",
                },
              },
              required: ["repository", "pullNumber"],
            },
          },
          {
            name: "github_analyze_issues",
            description: "Analyze repository issues and suggest solutions",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository in format 'owner/repo'",
                },
                state: {
                  type: "string",
                  enum: ["open", "closed", "all"],
                  default: "open",
                },
                labels: {
                  type: "array",
                  items: { type: "string" },
                  description: "Filter by labels",
                },
              },
              required: ["repository"],
            },
          },
          {
            name: "github_get_workflow_status",
            description: "Get GitHub Actions workflow status and analysis",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository in format 'owner/repo'",
                },
                workflowName: {
                  type: "string",
                  description: "Specific workflow name (optional)",
                },
              },
              required: ["repository"],
            },
          },
          {
            name: "github_security_analysis",
            description: "Perform security analysis of repository",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository in format 'owner/repo'",
                },
                includeVulnerabilities: {
                  type: "boolean",
                  default: true,
                },
              },
              required: ["repository"],
            },
          },
          {
            name: "github_code_quality_analysis",
            description: "Analyze code quality and suggest improvements",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository in format 'owner/repo'",
                },
                path: {
                  type: "string",
                  description: "Specific file or directory path (optional)",
                },
                language: {
                  type: "string",
                  description: "Programming language to focus on (optional)",
                },
              },
              required: ["repository"],
            },
          },
          {
            name: "github_create_issue_template",
            description: "Create issue templates for better reporting",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository in format 'owner/repo'",
                },
                templateType: {
                  type: "string",
                  enum: ["bug_report", "feature_request", "security_issue"],
                  description: "Type of issue template",
                },
              },
              required: ["repository", "templateType"],
            },
          },
          {
            name: "github_suggest_branch_protection",
            description: "Suggest branch protection rules",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository in format 'owner/repo'",
                },
                branch: {
                  type: "string",
                  description: "Branch name",
                  default: "main",
                },
              },
              required: ["repository"],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "github_analyze_repository":
            return await this.analyzeRepository(args);
          case "github_review_pull_request":
            return await this.reviewPullRequest(args);
          case "github_analyze_issues":
            return await this.analyzeIssues(args);
          case "github_get_workflow_status":
            return await this.getWorkflowStatus(args);
          case "github_security_analysis":
            return await this.performSecurityAnalysis(args);
          case "github_code_quality_analysis":
            return await this.analyzeCodeQuality(args);
          case "github_create_issue_template":
            return await this.createIssueTemplate(args);
          case "github_suggest_branch_protection":
            return await this.suggestBranchProtection(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async analyzeRepository(args: any) {
    const { repository } = args;
    const [owner, repo] = repository.split('/');

    try {
      // Get repository information
      const repoInfo = await this.octokit.repos.get({ owner, repo });
      
      // Get contributors
      const contributors = await this.octokit.repos.listContributors({ owner, repo });
      
      // Get languages
      const languages = await this.octokit.repos.listLanguages({ owner, repo });
      
      // Get recent commits
      const commits = await this.octokit.repos.listCommits({ 
        owner, 
        repo, 
        per_page: 10 
      });
      
      // Get open issues and PRs
      const issues = await this.octokit.issues.listForRepo({ 
        owner, 
        repo, 
        state: 'open' 
      });
      
      const pullRequests = issues.data.filter(issue => issue.pull_request);
      const regularIssues = issues.data.filter(issue => !issue.pull_request);

      // Analyze repository health
      const analysis = {
        repository: {
          name: repoInfo.data.name,
          description: repoInfo.data.description,
          stars: repoInfo.data.stargazers_count,
          forks: repoInfo.data.forks_count,
          openIssues: repoInfo.data.open_issues_count,
          defaultBranch: repoInfo.data.default_branch,
          createdAt: repoInfo.data.created_at,
          updatedAt: repoInfo.data.updated_at,
          hasWiki: repoInfo.data.has_wiki,
          hasPages: repoInfo.data.has_pages,
          license: repoInfo.data.license?.name,
        },
        activity: {
          contributorCount: contributors.data.length,
          recentCommits: commits.data.length,
          openPullRequests: pullRequests.length,
          openIssues: regularIssues.length,
          lastCommit: commits.data[0]?.commit.author?.date,
        },
        languages: languages.data,
        healthScore: this.calculateHealthScore(repoInfo.data, commits.data, contributors.data),
        recommendations: this.generateRecommendations(repoInfo.data, commits.data, contributors.data),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze repository: ${error.message}`);
    }
  }

  private async reviewPullRequest(args: any) {
    const { repository, pullNumber, focusAreas = [] } = args;
    const [owner, repo] = repository.split('/');

    try {
      // Get PR information
      const pr = await this.octokit.pulls.get({ owner, repo, pull_number: pullNumber });
      
      // Get PR files
      const files = await this.octokit.pulls.listFiles({ owner, repo, pull_number: pullNumber });
      
      // Get PR commits
      const commits = await this.octokit.pulls.listCommits({ owner, repo, pull_number: pullNumber });
      
      // Get existing reviews
      const reviews = await this.octokit.pulls.listReviews({ owner, repo, pull_number: pullNumber });

      const analysis = {
        pullRequest: {
          title: pr.data.title,
          description: pr.data.body,
          author: pr.data.user?.login,
          createdAt: pr.data.created_at,
          state: pr.data.state,
          mergeable: pr.data.mergeable,
          additions: pr.data.additions,
          deletions: pr.data.deletions,
          changedFiles: pr.data.changed_files,
        },
        filesChanged: files.data.map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
        })),
        commits: commits.data.length,
        existingReviews: reviews.data.length,
        codeReview: await this.performCodeReview(files.data, focusAreas),
        recommendations: this.generatePRRecommendations(pr.data, files.data, commits.data),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to review pull request: ${error.message}`);
    }
  }

  private async analyzeIssues(args: any) {
    const { repository, state = 'open', labels = [] } = args;
    const [owner, repo] = repository.split('/');

    try {
      const issues = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state,
        labels: labels.join(','),
        per_page: 100,
      });

      const regularIssues = issues.data.filter(issue => !issue.pull_request);
      
      const analysis = {
        totalIssues: regularIssues.length,
        issuesByLabel: this.groupIssuesByLabel(regularIssues),
        issuesByAge: this.analyzeIssueAge(regularIssues),
        commonPatterns: this.findCommonPatterns(regularIssues),
        suggestedActions: this.suggestIssueActions(regularIssues),
        priorityIssues: regularIssues
          .filter(issue => issue.labels.some(label => 
            typeof label === 'object' && label.name?.toLowerCase().includes('critical')
          ))
          .slice(0, 5),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze issues: ${error.message}`);
    }
  }

  private async getWorkflowStatus(args: any) {
    const { repository, workflowName } = args;
    const [owner, repo] = repository.split('/');

    try {
      // Get workflows
      const workflows = await this.octokit.actions.listRepoWorkflows({ owner, repo });
      
      const targetWorkflows = workflowName 
        ? workflows.data.workflows.filter(w => w.name === workflowName)
        : workflows.data.workflows;

      const workflowAnalysis = await Promise.all(
        targetWorkflows.map(async (workflow) => {
          const runs = await this.octokit.actions.listWorkflowRuns({
            owner,
            repo,
            workflow_id: workflow.id,
            per_page: 10,
          });

          return {
            name: workflow.name,
            state: workflow.state,
            path: workflow.path,
            totalRuns: runs.data.total_count,
            recentRuns: runs.data.workflow_runs.slice(0, 5).map(run => ({
              id: run.id,
              status: run.status,
              conclusion: run.conclusion,
              createdAt: run.created_at,
              headBranch: run.head_branch,
            })),
            successRate: this.calculateSuccessRate(runs.data.workflow_runs.slice(0, 20)),
          };
        })
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              totalWorkflows: targetWorkflows.length,
              workflows: workflowAnalysis,
              summary: `Analyzed ${targetWorkflows.length} workflows`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get workflow status: ${error.message}`);
    }
  }

  private async performSecurityAnalysis(args: any) {
    const { repository, includeVulnerabilities = true } = args;
    const [owner, repo] = repository.split('/');

    try {
      const securityIssues: Array<{severity: string; type: string; message: string; file?: string}> = [];

      // Get repository information for basic security checks
      const repoInfo = await this.octokit.repos.get({ owner, repo });
      
      // Check basic security settings
      if (!repoInfo.data.private && !repoInfo.data.has_pages) {
        securityIssues.push({
          severity: "LOW",
          type: "public_repository",
          message: "Repository is public - ensure no sensitive data is exposed",
        });
      }

      if (!repoInfo.data.security_and_analysis?.secret_scanning?.status) {
        securityIssues.push({
          severity: "MEDIUM",
          type: "secret_scanning_disabled",
          message: "Secret scanning is not enabled",
        });
      }

      // Check for security files
      try {
        await this.octokit.repos.getContent({ owner, repo, path: 'SECURITY.md' });
      } catch {
        securityIssues.push({
          severity: "LOW",
          type: "missing_security_policy",
          message: "No SECURITY.md file found - consider adding a security policy",
        });
      }

      // Get dependabot alerts (if accessible)
      if (includeVulnerabilities) {
        try {
          const alerts = await this.octokit.dependabot.listAlertsForRepo({ owner, repo });
          alerts.data.forEach(alert => {
            securityIssues.push({
              severity: alert.security_advisory.severity.toUpperCase(),
              type: "vulnerability",
              message: `${alert.security_advisory.summary} in ${alert.dependency.package.name}`,
              file: alert.dependency.manifest_path,
            });
          });
        } catch (error) {
          console.log('Unable to fetch vulnerability data:', error.message);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              repository,
              securityScore: this.calculateSecurityScore(securityIssues),
              issues: securityIssues,
              recommendations: this.generateSecurityRecommendations(securityIssues),
              summary: `Found ${securityIssues.length} security considerations`,
            }, null, 2),
          },
        ],
        isError: securityIssues.some(issue => issue.severity === "HIGH"),
      };
    } catch (error) {
      throw new Error(`Failed to perform security analysis: ${error.message}`);
    }
  }

  private async analyzeCodeQuality(args: any) {
    const { repository, path, language } = args;
    const [owner, repo] = repository.split('/');

    try {
      // Get repository contents
      const contents = await this.octokit.repos.getContent({ 
        owner, 
        repo, 
        path: path || '' 
      });

      const analysis = {
        codeMetrics: await this.analyzeCodeMetrics(owner, repo, contents),
        codeSmells: await this.detectCodeSmells(owner, repo, contents, language),
        suggestions: this.generateCodeQualitySuggestions(contents),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze code quality: ${error.message}`);
    }
  }

  private async createIssueTemplate(args: any) {
    const { repository, templateType } = args;

    const templates = {
      bug_report: `---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment:**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.`,

      feature_request: `---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.`,

      security_issue: `---
name: Security Issue
about: Report a security vulnerability
title: '[SECURITY] '
labels: security
assignees: ''
---

**Security Issue Description**
A clear and concise description of the security issue.

**Affected Components**
- [ ] Authentication
- [ ] Authorization
- [ ] Data validation
- [ ] Other: ___

**Steps to Reproduce**
1. 
2. 
3. 

**Expected vs Actual Behavior**
Expected: 
Actual: 

**Security Impact**
Describe the potential impact of this security issue.

**Suggested Fix**
If you have suggestions for how to fix this issue, please describe them here.`
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            templateType,
            template: templates[templateType as keyof typeof templates],
            instructions: `Save this content to .github/ISSUE_TEMPLATE/${templateType}.md`,
            summary: `Generated ${templateType} issue template`,
          }, null, 2),
        },
      ],
    };
  }

  private async suggestBranchProtection(args: any) {
    const { repository, branch = 'main' } = args;

    const recommendations = {
      requiredStatusChecks: {
        strict: true,
        contexts: ['ci/build', 'ci/test', 'security/scan']
      },
      enforceAdmins: false,
      requiredPullRequestReviews: {
        required_approving_review_count: 2,
        dismiss_stale_reviews: true,
        require_code_owner_reviews: true,
        restrict_dismissals: false
      },
      restrictions: null,
      allowForcePushes: false,
      allowDeletions: false,
      blockCreations: false,
      requiredConversationResolution: true
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            repository,
            branch,
            recommendations,
            explanation: "These settings provide strong protection while maintaining developer productivity",
            implementation: "Apply these settings through GitHub repository settings > Branches",
            summary: `Branch protection recommendations for ${branch}`,
          }, null, 2),
        },
      ],
    };
  }

  // Helper methods
  private calculateHealthScore(repo: any, commits: any[], contributors: any[]): number {
    let score = 0;
    
    // Recent activity (30%)
    const daysSinceLastCommit = commits[0] ? 
      (Date.now() - new Date(commits[0].commit.author.date).getTime()) / (1000 * 60 * 60 * 24) : 
      999;
    score += Math.max(0, 30 - daysSinceLastCommit * 2);
    
    // Documentation (20%)
    if (repo.description) score += 10;
    if (repo.has_wiki) score += 5;
    if (repo.license) score += 5;
    
    // Community (20%)
    score += Math.min(20, contributors.length * 2);
    
    // Issues management (15%)
    const issueRatio = repo.open_issues_count / Math.max(1, repo.stargazers_count);
    score += Math.max(0, 15 - issueRatio * 100);
    
    // Security (15%)
    score += 15; // Base security score, would be reduced based on findings
    
    return Math.min(100, Math.max(0, score));
  }

  private generateRecommendations(repo: any, commits: any[], contributors: any[]): string[] {
    const recommendations: string[] = [];
    
    if (!repo.description) {
      recommendations.push("Add a clear repository description");
    }
    
    if (!repo.license) {
      recommendations.push("Add a license to clarify usage rights");
    }
    
    if (contributors.length < 2) {
      recommendations.push("Consider adding more contributors for bus factor");
    }
    
    if (commits.length < 5) {
      recommendations.push("Increase commit frequency for better maintenance");
    }
    
    return recommendations;
  }

  private async performCodeReview(files: any[], focusAreas: string[]): Promise<any> {
    const review = {
      filesReviewed: files.length,
      suggestions: [] as string[],
      concerns: [] as string[],
    };

    files.forEach(file => {
      // Basic file analysis
      if (file.changes > 500) {
        review.concerns.push(`Large changeset in ${file.filename} (${file.changes} changes)`);
      }
      
      if (file.filename.includes('config') && file.status === 'modified') {
        review.suggestions.push(`Review configuration changes in ${file.filename} carefully`);
      }
      
      if (focusAreas.includes('security') && file.filename.includes('auth')) {
        review.suggestions.push(`Security review needed for ${file.filename}`);
      }
    });

    return review;
  }

  private generatePRRecommendations(pr: any, files: any[], commits: any[]): string[] {
    const recommendations: string[] = [];
    
    if (!pr.body || pr.body.length < 50) {
      recommendations.push("Add a more detailed PR description");
    }
    
    if (commits.length > 10) {
      recommendations.push("Consider squashing commits before merge");
    }
    
    if (files.length > 20) {
      recommendations.push("Large PR - consider breaking into smaller changes");
    }
    
    return recommendations;
  }

  private groupIssuesByLabel(issues: any[]): Record<string, number> {
    const labelCounts: Record<string, number> = {};
    
    issues.forEach(issue => {
      issue.labels.forEach((label: any) => {
        const labelName = typeof label === 'string' ? label : label.name;
        labelCounts[labelName] = (labelCounts[labelName] || 0) + 1;
      });
    });
    
    return labelCounts;
  }

  private analyzeIssueAge(issues: any[]): any {
    const now = Date.now();
    const ageGroups = {
      'new': 0,      // < 7 days
      'recent': 0,   // 7-30 days
      'old': 0,      // 30-90 days
      'stale': 0     // > 90 days
    };
    
    issues.forEach(issue => {
      const age = (now - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24);
      
      if (age < 7) ageGroups.new++;
      else if (age < 30) ageGroups.recent++;
      else if (age < 90) ageGroups.old++;
      else ageGroups.stale++;
    });
    
    return ageGroups;
  }

  private findCommonPatterns(issues: any[]): string[] {
    // Simple pattern detection based on titles
    const patterns: string[] = [];
    const titleWords = issues.map(issue => issue.title.toLowerCase().split(' ')).flat();
    const wordCounts = titleWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(wordCounts)
      .filter(([word, count]) => count > 2 && word.length > 3)
      .slice(0, 5)
      .forEach(([word]) => patterns.push(`Multiple issues mention "${word}"`));
    
    return patterns;
  }

  private suggestIssueActions(issues: any[]): string[] {
    const actions: string[] = [];
    
    const staleIssues = issues.filter(issue => {
      const age = (Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return age > 90;
    });
    
    if (staleIssues.length > 0) {
      actions.push(`Review ${staleIssues.length} stale issues for closure or updating`);
    }
    
    const unlabeledIssues = issues.filter(issue => issue.labels.length === 0);
    if (unlabeledIssues.length > 0) {
      actions.push(`Add labels to ${unlabeledIssues.length} unlabeled issues`);
    }
    
    return actions;
  }

  private calculateSuccessRate(runs: any[]): number {
    if (runs.length === 0) return 0;
    
    const successful = runs.filter(run => run.conclusion === 'success').length;
    return (successful / runs.length) * 100;
  }

  private calculateSecurityScore(issues: any[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'HIGH':
          score -= 20;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  private generateSecurityRecommendations(issues: any[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.type === 'secret_scanning_disabled')) {
      recommendations.push("Enable secret scanning in repository settings");
    }
    
    if (issues.some(i => i.type === 'missing_security_policy')) {
      recommendations.push("Add a SECURITY.md file with vulnerability reporting instructions");
    }
    
    if (issues.some(i => i.type === 'vulnerability')) {
      recommendations.push("Update dependencies with known vulnerabilities");
    }
    
    return recommendations;
  }

  private async analyzeCodeMetrics(owner: string, repo: string, contents: any): Promise<any> {
    // This would typically integrate with code analysis tools
    return {
      estimatedLinesOfCode: 'N/A - requires file content analysis',
      estimatedComplexity: 'N/A - requires AST analysis',
      fileCount: Array.isArray(contents) ? contents.length : 1,
    };
  }

  private async detectCodeSmells(owner: string, repo: string, contents: any, language?: string): Promise<string[]> {
    // This would typically use static analysis tools
    return [
      'Consider setting up automated code quality checks',
      'Regular dependency updates recommended',
    ];
  }

  private generateCodeQualitySuggestions(contents: any): string[] {
    return [
      'Set up CI/CD pipeline for automated testing',
      'Add linting configuration for consistent code style',
      'Consider adding code coverage reporting',
    ];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("GitHub MCP Server running on stdio");
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GitHubMCPServer();
  server.run().catch(console.error);
}

export default GitHubMCPServer; 