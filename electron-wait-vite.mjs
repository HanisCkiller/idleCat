// Waits for Vite dev server, then launches Electron
import { spawn } from 'child_process';
import { createServer } from 'net';

const PORT = 5173;

function waitForPort(port, retries = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const client = new createServer();
      const socket = new (require('net').Socket)();
      socket.setTimeout(500);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (++attempts >= retries) {
          reject(new Error(`Port ${port} not available after ${retries} attempts`));
        } else {
          setTimeout(check, 500);
        }
      });
      socket.connect(port, '127.0.0.1');
    };
    check();
  });
}

// Use wait-on instead — simpler
import { waitOn } from 'wait-on';

waitOn({ resources: [`http://localhost:${PORT}`], timeout: 30000 })
  .then(() => {
    const electron = spawn(
      'npx',
      ['electron', '--inspect', '.'],
      {
        env: { ...process.env, NODE_ENV: 'development' },
        stdio: 'inherit',
        shell: true,
      }
    );
    electron.on('close', (code) => process.exit(code ?? 0));
  })
  .catch((err) => {
    console.error('Vite server did not start in time:', err);
    process.exit(1);
  });
