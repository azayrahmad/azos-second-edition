const { resolveConfig } = require('vite');
const waitOn = require('wait-on');
const { spawn } = require('child_process');

(async () => {
  try {
    const viteConfig = await resolveConfig({}, 'serve');
    const port = viteConfig.server.port || 5173;
    const base = viteConfig.base || '/';
    const url = `http://localhost:${port}${base}`;

    console.log(`Waiting for Vite dev server at ${url}...`);

    await waitOn({
      resources: [url],
      timeout: 30000, // 30 seconds
    });

    console.log('Vite dev server is ready. Starting Electron...');

    const electronProcess = spawn('electron', ['.'], {
      stdio: 'inherit',
      shell: true,
    });

    electronProcess.on('close', (code) => {
      console.log(`Electron process exited with code ${code}`);
      process.exit(code);
    });
  } catch (err) {
    console.error('Error starting Electron:', err);
    process.exit(1);
  }
})();
