# Production End-to-End Testing Guide

This document provides a comprehensive testing checklist for validating Careerate's functionality in the production environment.

## Pre-Testing Setup

### 1. Verify Deployment
- [ ] GitHub Actions workflow completed successfully
- [ ] Azure Container Apps shows "Running" status
- [ ] Application is accessible at: https://careerate-web.politetree-6f564ad5.westus2.azurecontainerapps.io
- [ ] Health check endpoint responds: `/api/health`

### 2. Environment Validation
- [ ] All KeyVault secrets are configured
- [ ] Database connectivity is working
- [ ] Azure B2C authentication is configured
- [ ] GitHub/GitLab OAuth apps are set up

## Core Authentication Tests

### Azure B2C Authentication
- [ ] Visit the application homepage
- [ ] Click "Sign In" button
- [ ] Verify redirect to Azure B2C login page
- [ ] Test sign-up flow with new account
- [ ] Test sign-in flow with existing account
- [ ] Verify successful redirect back to dashboard
- [ ] Test logout functionality

### Owner Whitelist Verification
Test with owner email addresses:
- [ ] `garvseth@outlook.com`
- [ ] `garv.seth@gmail.com`
- [ ] `garvseth@uw.edu`
- [ ] `thesm2018@gmail.com`
- [ ] `garvytp@gmail.com`

Verify these accounts:
- [ ] Bypass all usage limits
- [ ] Have unlimited project creation
- [ ] Can access all features regardless of plan

## Dashboard Functionality

### Project Management
- [ ] Dashboard loads with projects list
- [ ] Create new project works
- [ ] Project cards display correctly
- [ ] Edit project functionality
- [ ] Delete project functionality
- [ ] Project metadata is saved properly

### Navigation
- [ ] All navigation links work
- [ ] Breadcrumbs function correctly
- [ ] Responsive design on mobile/tablet
- [ ] No broken UI elements

## Vibe Coding Tests

### Project Access
- [ ] Click "Vibe Coding" on project card
- [ ] File tree loads from API (not mock data)
- [ ] Select file and content displays
- [ ] File editor is functional

### Real API Integration
- [ ] Save file operation works
- [ ] Terminal commands execute via API
- [ ] AI chat uses real API endpoints
- [ ] File operations persist correctly

### Git Integration
- [ ] Git status indicator shows correctly
- [ ] If GitHub not connected, shows "Git Not Connected"
- [ ] Click "Connect GitHub" initiates OAuth flow
- [ ] After connecting, shows "GitHub Connected"
- [ ] Commit functionality works with connected GitHub
- [ ] Create PR button functions (or prompts for GitHub)

### Terminal Functionality
- [ ] Run `npm start` command
- [ ] Verify preview URL is generated
- [ ] Terminal output displays correctly
- [ ] Command history works

### AI Assistant
- [ ] Send message to AI chat
- [ ] Verify real API response (not mock)
- [ ] Test file creation via AI suggestions
- [ ] Apply AI-generated actions

## Vibe Hosting Tests

### Deployment Interface
- [ ] Click "Vibe Hosting" on project card
- [ ] Natural language deployment field works
- [ ] Provider selection functions
- [ ] Cost estimation displays

### Real Deployment API
- [ ] Enter deployment intent (e.g., "Deploy to Azure")
- [ ] Verify API call to `/api/hosting/intent`
- [ ] Check deployment status API
- [ ] Validate deployment listing

### Provider Integration
- [ ] Test Azure deployment option
- [ ] Test AWS deployment option (if configured)
- [ ] Test GCP deployment option (if configured)
- [ ] Verify proper error handling

## Enterprise Migration Tests

### Unified Dashboard
- [ ] Click "Migration" on project card
- [ ] Verify single unified dashboard loads
- [ ] All tabs are accessible:
  - [ ] Overview
  - [ ] Legacy Analysis
  - [ ] Planning
  - [ ] Modernization
  - [ ] Execution
  - [ ] AI Recommendations

### Legacy Routes Redirect
Test that old routes redirect to unified dashboard:
- [ ] `/migration/analysis` → Enterprise Migration
- [ ] `/migration/planning` → Enterprise Migration
- [ ] `/migration/modernization` → Enterprise Migration
- [ ] `/migration/execution` → Enterprise Migration

### AI Recommendations
- [ ] Generate AI recommendations
- [ ] Apply recommended fixes
- [ ] Download migration reports

## Integration Tests

### GitHub Integration
- [ ] Initiate GitHub OAuth: `/api/integrations/github/oauth/initiate`
- [ ] Complete OAuth callback
- [ ] List user repositories
- [ ] Connect repository to project
- [ ] Create pull request via API

### GitLab Integration (if configured)
- [ ] Initiate GitLab OAuth: `/api/integrations/gitlab/oauth/initiate`
- [ ] Complete OAuth callback
- [ ] List user projects
- [ ] Connect project repository

### API Endpoints Health
Test key API endpoints:
- [ ] `GET /api/projects` - List projects
- [ ] `POST /api/projects` - Create project
- [ ] `GET /api/coding/projects/:id/files` - Get file tree
- [ ] `PUT /api/coding/projects/:id/files` - Save file
- [ ] `POST /api/coding/intent` - AI intent parsing
- [ ] `POST /api/coding/run` - Run command
- [ ] `POST /api/hosting/intent` - Hosting intent
- [ ] `POST /api/hosting/deploy` - Deploy application
- [ ] `POST /api/auth/usage-check` - Usage validation

## Performance Tests

### Page Load Times
- [ ] Dashboard loads in < 3 seconds
- [ ] Vibe Coding loads in < 5 seconds
- [ ] Vibe Hosting loads in < 3 seconds
- [ ] Enterprise Migration loads in < 3 seconds

### API Response Times
- [ ] Project creation < 2 seconds
- [ ] File operations < 1 second
- [ ] AI responses < 10 seconds
- [ ] Deployment initiation < 5 seconds

### Resource Usage
- [ ] Memory usage stable
- [ ] No memory leaks in browser
- [ ] CPU usage reasonable
- [ ] Network requests optimized

## Error Handling Tests

### Network Failures
- [ ] Test with intermittent connectivity
- [ ] Verify graceful error messages
- [ ] Test retry mechanisms
- [ ] Validate fallback behaviors

### API Failures
- [ ] Test with invalid API keys
- [ ] Verify service degradation (OpenAI fallback)
- [ ] Test database connection issues
- [ ] Validate authentication failures

### User Input Validation
- [ ] Test invalid project names
- [ ] Test malformed API requests
- [ ] Test SQL injection attempts
- [ ] Test XSS prevention

## Security Tests

### Authentication Security
- [ ] Session management works correctly
- [ ] Token expiration handled properly
- [ ] CSRF protection active
- [ ] Secure cookie settings

### Authorization
- [ ] Users can only access their projects
- [ ] Admin features restricted appropriately
- [ ] Owner whitelist functions correctly
- [ ] Plan restrictions enforced (except for owners)

### Data Protection
- [ ] No secrets exposed in client code
- [ ] All API calls use HTTPS
- [ ] Sensitive data properly encrypted
- [ ] KeyVault integration secure

## Monitoring and Logging

### Application Insights
- [ ] Custom events tracking correctly
- [ ] Error logging functional
- [ ] Performance metrics collected
- [ ] User behavior tracked

### Health Monitoring
- [ ] Health check endpoint responds
- [ ] Database health monitored
- [ ] External service health tracked
- [ ] Alert mechanisms functional

## Post-Deployment Validation

### Database State
- [ ] All tables created correctly
- [ ] Migrations applied successfully
- [ ] Data integrity maintained
- [ ] Backup systems functional

### External Services
- [ ] Azure B2C working
- [ ] GitHub OAuth functional
- [ ] Database connectivity stable
- [ ] KeyVault access working

## Rollback Testing

### Deployment Rollback
- [ ] Previous version can be restored
- [ ] Database migrations reversible
- [ ] No data loss during rollback
- [ ] Service remains available

## Load Testing (Optional)

### Concurrent Users
- [ ] Test with 10 concurrent users
- [ ] Test with 50 concurrent users
- [ ] Monitor response times
- [ ] Check for race conditions

### Data Volume
- [ ] Test with large file uploads
- [ ] Test with many projects per user
- [ ] Test with long chat histories
- [ ] Monitor database performance

## Issue Reporting

When issues are found:

1. **Record the issue**:
   - URL where issue occurred
   - User account used
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/device information

2. **Check logs**:
   - Azure Container Apps logs
   - Application Insights errors
   - Browser developer console
   - Network tab for failed requests

3. **Priority levels**:
   - **Critical**: Authentication broken, app crashes
   - **High**: Major features non-functional
   - **Medium**: Minor features broken, UI issues
   - **Low**: Cosmetic issues, enhancement requests

## Testing Completion Checklist

- [ ] All core authentication flows tested
- [ ] All major features functional
- [ ] APIs returning real data (not mock)
- [ ] Git integration working
- [ ] Owner whitelist functioning
- [ ] Performance within acceptable limits
- [ ] Error handling working correctly
- [ ] Security measures active
- [ ] Monitoring and logging operational

## Sign-off

- **Tester Name**: _______________
- **Test Date**: _______________
- **Build Version**: _______________
- **Overall Status**: [ ] Pass [ ] Pass with Issues [ ] Fail
- **Notes**: _______________

---

*For technical issues during testing, refer to [AZURE_INTEGRATIONS.md](./AZURE_INTEGRATIONS.md) for troubleshooting guidance.*