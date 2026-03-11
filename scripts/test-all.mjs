import { spawn } from 'node:child_process';
import process from 'node:process';

const tasks = [
  { name: 'Frontend Unit Tests', command: 'pnpm', args: ['--filter', 'frontend', 'test'] },
  { name: 'Backend Unit Tests', command: 'pnpm', args: ['--filter', 'backend', 'test'] },
  { name: 'E2E Tests', command: 'node', args: ['scripts/run-e2e.mjs'] }
];

function runTask(task) {
  return new Promise((resolve) => {
    console.log(`\n▶️ Starting: ${task.name}...`);
    
    const command = process.platform === 'win32' && task.command === 'pnpm' ? 'pnpm.cmd' : task.command;
    
    const proc = spawn(command, task.args, { 
      stdio: 'inherit',
      shell: true 
    });
    
    proc.on('close', (code) => {
      resolve({ name: task.name, success: code === 0, code });
    });
    
    proc.on('error', (err) => {
      console.error(`❌ Error starting ${task.name}:`, err);
      resolve({ name: task.name, success: false, code: -1 });
    });
  });
}

async function main() {
  console.log('🚀 Running Frontend tests, Backend tests, and E2E tests concurrently...\n');
  
  const results = await Promise.all(tasks.map(runTask));
  
  console.log('\n==================================================');
  console.log('📊 TEST RESULTS REPORT');
  console.log('--------------------------------------------------');
  
  let allPass = true;
  for (const res of results) {
    const status = res.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status.padEnd(10)} | ${res.name} (Exit code: ${res.code})`);
    if (!res.success) allPass = false;
  }
  
  console.log('==================================================\n');
  
  if (!allPass) {
    console.log('❌ Some test categories failed. See logs above for details.\n');
    process.exit(1);
  } else {
    console.log('✨ All tests passed successfully!\n');
    process.exit(0);
  }
}

main().catch(console.error);
