import { request } from 'node:http';
import { spawn } from 'node:child_process';
import process from 'node:process';

const BACKEND_URL = 'http://127.0.0.1:3001/health';
const FRONTEND_URL = 'http://127.0.0.1:3000/login';
const STARTUP_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 1_000;
const PNPM_BIN = process.platform === 'win32' ? 'pnpm' : 'pnpm';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkUrl(url, timeoutMs = 2_000) {
  return new Promise((resolve) => {
    const req = request(url, { method: 'GET', timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.on('error', () => resolve(false));
    req.end();
  });
}

async function waitForUrl(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await checkUrl(url)) {
      return;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function quoteForShell(arg) {
  if (arg === '') {
    return '""';
  }
  if (/[\s"]/u.test(arg)) {
    return `"${arg.replaceAll('"', '\\"')}"`;
  }
  return arg;
}

function spawnProcess(command, args, options) {
  if (process.platform === 'win32') {
    const cmdline = [command, ...args].map(quoteForShell).join(' ');
    return spawn(cmdline, {
      ...options,
      shell: true,
    });
  }

  return spawn(command, args, options);
}

function spawnCommand(command, args, env = process.env) {
  const child = spawnProcess(command, args, {
    stdio: 'inherit',
    env,
  });
  return child;
}

function runCommand(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, {
      stdio: 'inherit',
      env,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}`));
      }
    });
  });
}

function stopChild(child) {
  if (!child?.pid) {
    return Promise.resolve();
  }

  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
        stdio: 'ignore',
      });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
  }

  return new Promise((resolve) => {
    child.once('exit', () => resolve());
    child.kill('SIGTERM');
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, 5_000);
  });
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const playwrightArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;
  const startedChildren = [];

  try {
    await runCommand(PNPM_BIN, ['--filter', '@subtracker/shared', 'build']);

    const [backendUp, frontendUp] = await Promise.all([
      checkUrl(BACKEND_URL),
      checkUrl(FRONTEND_URL),
    ]);

    if (!backendUp) {
      const backend = spawnCommand(
        PNPM_BIN,
        ['--filter', 'backend', 'dev'],
        { ...process.env, E2E_TESTING: 'true' },
      );
      startedChildren.push(backend);
    }

    if (!frontendUp) {
      const frontend = spawnCommand(PNPM_BIN, ['--filter', 'frontend', 'dev']);
      startedChildren.push(frontend);
    }

    await Promise.all([
      waitForUrl(BACKEND_URL, STARTUP_TIMEOUT_MS),
      waitForUrl(FRONTEND_URL, STARTUP_TIMEOUT_MS),
    ]);

      await runCommand(
      PNPM_BIN,
      ['playwright', 'test', ...playwrightArgs],
      { ...process.env, PLAYWRIGHT_DISABLE_WEBSERVER: 'true', E2E_TESTING: 'true' },
    );
  } finally {
    await Promise.all(startedChildren.map((child) => stopChild(child)));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
