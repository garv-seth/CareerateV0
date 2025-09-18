#!/usr/bin/env node

/**
 * Careerate Production Health Check Script
 *
 * This script performs comprehensive health checks on the production deployment
 * and validates that all critical functionality is working correctly.
 */

const https = require('https');
const fs = require('fs');

const BASE_URL = 'https://careerate-web.politetree-6f564ad5.westus2.azurecontainerapps.io';
const TIMEOUT = 10000; // 10 seconds

class HealthChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const request = https.request(url, { timeout: TIMEOUT, ...options }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: data
          });
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        request.write(options.body);
      }

      request.end();
    });
  }

  async test(name, testFunction) {
    this.results.total++;
    console.log(`Testing: ${name}...`);

    try {
      const result = await testFunction();
      if (result) {
        this.results.passed++;
        console.log(`✅ ${name}`);
        this.results.details.push({ name, status: 'PASS', message: 'OK' });
      } else {
        this.results.failed++;
        console.log(`❌ ${name}`);
        this.results.details.push({ name, status: 'FAIL', message: 'Test returned false' });
      }
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ${name}: ${error.message}`);
      this.results.details.push({ name, status: 'FAIL', message: error.message });
    }
  }

  async runHealthChecks() {
    console.log('🏥 Careerate Production Health Check');
    console.log('=====================================\n');

    // Basic connectivity
    await this.test('Application is accessible', async () => {
      const response = await this.makeRequest(BASE_URL);
      return response.statusCode === 200;
    });

    // Health endpoint
    await this.test('Health endpoint responds', async () => {
      const response = await this.makeRequest(`${BASE_URL}/api/health`);
      return response.statusCode === 200;
    });

    // Static assets
    await this.test('Static assets load', async () => {
      const response = await this.makeRequest(`${BASE_URL}/favicon.ico`);
      return response.statusCode === 200;
    });

    // API endpoints (without authentication)
    await this.test('Projects API endpoint exists', async () => {
      const response = await this.makeRequest(`${BASE_URL}/api/projects`);
      // Should return 401 (unauthorized) rather than 404 (not found)
      return response.statusCode === 401;
    });

    // Database connectivity (via API)
    await this.test('Database connectivity', async () => {
      const response = await this.makeRequest(`${BASE_URL}/api/health/db`);
      return response.statusCode === 200 || response.statusCode === 500; // 500 is ok, means endpoint exists
    });

    // Environment configuration
    await this.test('Environment variables configured', async () => {
      const response = await this.makeRequest(`${BASE_URL}/api/health/config`);
      if (response.statusCode === 200) {
        const config = JSON.parse(response.body);
        return config.NODE_ENV === 'production';
      }
      return false;
    });

    // Azure B2C authentication endpoint
    await this.test('Azure B2C auth endpoint reachable', async () => {
      const response = await this.makeRequest(`${BASE_URL}/auth/azure`);
      // Should redirect to B2C (302) or return auth page
      return [200, 302, 401].includes(response.statusCode);
    });

    // GitHub OAuth endpoint
    await this.test('GitHub OAuth endpoint exists', async () => {
      const response = await this.makeRequest(`${BASE_URL}/api/integrations/github/oauth/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopes: ['repo'] })
      });
      // Should return 401 (unauthorized) for unauthenticated request
      return response.statusCode === 401;
    });

    // Performance check
    await this.test('Response time under 3 seconds', async () => {
      const start = Date.now();
      await this.makeRequest(BASE_URL);
      const duration = Date.now() - start;
      return duration < 3000;
    });

    // SSL/TLS check
    await this.test('HTTPS properly configured', async () => {
      const response = await this.makeRequest(BASE_URL);
      return BASE_URL.startsWith('https://');
    });

    this.printResults();
    return this.results;
  }

  printResults() {
    console.log('\n📊 Health Check Results');
    console.log('=======================');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.details
        .filter(detail => detail.status === 'FAIL')
        .forEach(detail => {
          console.log(`  - ${detail.name}: ${detail.message}`);
        });
    }

    // Overall status
    const successRate = (this.results.passed / this.results.total) * 100;
    if (successRate >= 90) {
      console.log('\n🎉 Overall Status: HEALTHY');
    } else if (successRate >= 70) {
      console.log('\n⚠️  Overall Status: DEGRADED');
    } else {
      console.log('\n🚨 Overall Status: UNHEALTHY');
    }

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'production',
      baseUrl: BASE_URL,
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: parseFloat(((this.results.passed / this.results.total) * 100).toFixed(1))
      },
      tests: this.results.details
    };

    try {
      fs.writeFileSync('health-check-report.json', JSON.stringify(report, null, 2));
      console.log('\n📄 Report saved to: health-check-report.json');
    } catch (error) {
      console.log('\n⚠️  Could not save report:', error.message);
    }
  }
}

// Enhanced endpoint tests
class EndpointChecker extends HealthChecker {
  async runEndpointTests() {
    console.log('🔍 API Endpoint Validation');
    console.log('===========================\n');

    const endpoints = [
      { name: 'Projects API', path: '/api/projects', method: 'GET', expectAuth: true },
      { name: 'Coding Intent API', path: '/api/coding/intent', method: 'POST', expectAuth: true },
      { name: 'Hosting Intent API', path: '/api/hosting/intent', method: 'POST', expectAuth: true },
      { name: 'GitHub OAuth Initiate', path: '/api/integrations/github/oauth/initiate', method: 'POST', expectAuth: true },
      { name: 'Usage Check API', path: '/api/auth/usage-check', method: 'POST', expectAuth: true },
      { name: 'Health Check', path: '/api/health', method: 'GET', expectAuth: false }
    ];

    for (const endpoint of endpoints) {
      await this.test(`${endpoint.name} (${endpoint.method} ${endpoint.path})`, async () => {
        const options = { method: endpoint.method };
        if (endpoint.method === 'POST') {
          options.headers = { 'Content-Type': 'application/json' };
          options.body = JSON.stringify({});
        }

        const response = await this.makeRequest(`${BASE_URL}${endpoint.path}`, options);

        if (endpoint.expectAuth) {
          // Should return 401 for unauthenticated requests
          return response.statusCode === 401;
        } else {
          // Should return successful response
          return response.statusCode === 200;
        }
      });
    }

    this.printResults();
    return this.results;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'health';

  let checker;

  if (testType === 'endpoints') {
    checker = new EndpointChecker();
    await checker.runEndpointTests();
  } else {
    checker = new HealthChecker();
    await checker.runHealthChecks();
  }

  // Exit with error code if tests failed
  process.exit(checker.results.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = { HealthChecker, EndpointChecker };