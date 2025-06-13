const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CAREERATE AI DevOps Platform...');

// Start backend
const backend = spawn('npx', ['ts-node', 'src/simple-server.ts'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

// Start frontend after a short delay
setTimeout(() => {
  const frontend = spawn('npx', ['vite', 'dev', '--host', '0.0.0.0', '--port', '3000'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit'
  });

  frontend.on('error', (err) => {
    console.error('Frontend error:', err);
  });
}, 2000);

backend.on('error', (err) => {
  console.error('Backend error:', err);
});

console.log('✅ CAREERATE Platform starting...');
console.log('   Backend:  http://localhost:8081');
console.log('   Frontend: http://localhost:3000');

process.on('SIGINT', () => {
  console.log('Shutting down CAREERATE platform...');
  process.exit(0);
});