import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting CAREERATE Platform...');

// Start backend
const backend = spawn('npx', ['ts-node', 'src/server.ts'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  env: { ...process.env, PORT: '8081' }
});

// Start frontend
const frontend = spawn('npx', ['vite', 'dev', '--host', '0.0.0.0', '--port', '3000'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});