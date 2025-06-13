#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting CAREERATE AI DevOps Platform...');

// Check if required directories exist
const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

if (!fs.existsSync(backendDir)) {
  console.error('❌ Backend directory not found');
  process.exit(1);
}

if (!fs.existsSync(frontendDir)) {
  console.error('❌ Frontend directory not found');
  process.exit(1);
}

// Start backend server
console.log('📡 Starting backend server...');
const backend = spawn('npx', ['ts-node', 'src/server.ts'], {
  cwd: backendDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    PORT: '8081',
    NODE_ENV: 'development'
  }
});

// Start frontend development server
console.log('🌐 Starting frontend development server...');
const frontend = spawn('npx', ['vite', 'dev', '--host', '0.0.0.0', '--port', '3000'], {
  cwd: frontendDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    VITE_API_URL: 'http://localhost:8081'
  }
});

// Handle backend output
backend.stdout.on('data', (data) => {
  console.log(`[Backend] ${data.toString().trim()}`);
});

backend.stderr.on('data', (data) => {
  console.error(`[Backend Error] ${data.toString().trim()}`);
});

// Handle frontend output
frontend.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`[Frontend] ${output}`);
  }
});

frontend.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output && !output.includes('warnings')) {
    console.error(`[Frontend Error] ${output}`);
  }
});

// Handle process exits
backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  if (code !== 0) {
    console.error('❌ Backend failed to start');
  }
});

frontend.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  if (code !== 0) {
    console.error('❌ Frontend failed to start');
  }
});

// Handle errors
backend.on('error', (err) => {
  console.error('Backend spawn error:', err);
});

frontend.on('error', (err) => {
  console.error('Frontend spawn error:', err);
});

// Wait for services to start
setTimeout(() => {
  console.log('\n✅ CAREERATE Platform is starting...');
  console.log('   Backend API:  http://localhost:8081');
  console.log('   Frontend App: http://localhost:3000');
  console.log('   Health Check: http://localhost:8081/health');
  console.log('\n📝 Logs will appear below...\n');
}, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down CAREERATE platform...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  setTimeout(() => {
    backend.kill('SIGKILL');
    frontend.kill('SIGKILL');
    process.exit(0);
  }, 5000);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
});