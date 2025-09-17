const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Careerate application...');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('Installing dependencies...');
  try {
    execSync('npm install --production', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Check if dist directory exists
if (!fs.existsSync('dist')) {
  console.log('Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to build application:', error.message);
    process.exit(1);
  }
}

// Start the application
console.log('Starting server...');
try {
  require('./dist/index.js');
} catch (error) {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}