const { execSync } = require('child_process');
const { spawn } = require('child_process');

console.log('');
console.log('═══════════════════════════════════════');
console.log('  CyberPrep — Starting All Services');
console.log('═══════════════════════════════════════');
console.log('');

// Start backend
const backend = spawn('node', ['server-simple.js'], { 
  cwd: './backend', 
  stdio: 'inherit',
  shell: true 
});

// Start frontend
const frontend = spawn('npm', ['run', 'dev'], { 
  cwd: './my-app', 
  stdio: 'inherit',
  shell: true 
});

console.log('  Backend:  http://localhost:4000');
console.log('  Frontend: http://localhost:5173');
console.log('');
console.log('  Press Ctrl+C to stop both');
console.log('');

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});