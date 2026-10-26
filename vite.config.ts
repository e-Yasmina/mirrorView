import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { exec } from 'child_process';

function getSystemCameras(): Promise<string[]> {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const regCmd = 'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceClasses\\{65e8773d-8f56-11d0-a3b9-00a0c9223196}" /s /f "FriendlyName"';
      exec(regCmd, { timeout: 3000 }, (err, stdout) => {
        if (err || !stdout) {
          resolve(['Logi C270 HD WebCam', 'HP HD Camera', 'HP IR Camera']);
          return;
        }
        const lines = stdout.split(/\r?\n/);
        const cameras = new Set<string>();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('FriendlyName') && trimmed.includes('REG_SZ')) {
            const parts = trimmed.split('REG_SZ');
            if (parts.length > 1) {
              const name = parts[1].trim();
              const lower = name.toLowerCase();
              if (
                name &&
                !lower.includes('audio') &&
                !lower.includes('headset') &&
                !lower.includes('mic') &&
                (lower.includes('cam') || lower.includes('video') || lower.includes('logi') || lower.includes('hp'))
              ) {
                cameras.add(name);
              }
            }
          }
        }

        const result = Array.from(cameras);
        resolve(result.length > 0 ? result : ['Logi C270 HD WebCam', 'HP HD Camera', 'HP IR Camera']);
      });
    } else {
      exec('v4l2-ctl --list-devices 2>/dev/null || true', (_err, stdout) => {
        if (!stdout) {
          resolve([]);
          return;
        }
        const lines = stdout.split(/\r?\n/);
        const names: string[] = [];
        for (const line of lines) {
          if (line && !line.startsWith('\t') && !line.startsWith(' ')) {
            names.push(line.replace(/:\s*$/, '').trim());
          }
        }
        resolve(names);
      });
    }
  });
}

function systemCamerasPlugin(): Plugin {
  return {
    name: 'system-cameras-plugin',
    configureServer(server) {
      server.middlewares.use('/api/system-cameras', async (_req, res) => {
        const cameras = await getSystemCameras();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(cameras));
      });

      server.middlewares.use('/api/virtual-camera-status', (_req, res) => {
        exec('python src/core/virtual_cam_bridge.py --check', (_err, stdout) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          try {
            res.end(stdout.trim() || JSON.stringify({ ready: false }));
          } catch {
            res.end(JSON.stringify({ ready: false }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), systemCamerasPlugin()],
  server: {
    port: 5174,
    host: 'localhost'
  },
  base: './'
});
