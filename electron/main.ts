import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#080c14',
    title: 'MirrorView — Desktop Webcam Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Handle process listing requests safely
  ipcMain.handle('get-running-processes', async () => {
    return new Promise<string[]>((resolve) => {
      const cmd = process.platform === 'win32' ? 'tasklist' : 'ps -A';
      exec(cmd, (err, stdout) => {
        if (err || !stdout) {
          resolve([]);
          return;
        }
        const lines = stdout.split('\n');
        const processes = lines.map(line => line.trim().split(/\s+/)[0]).filter(Boolean);
        resolve(processes);
      });
    });
  });

  const devUrl = 'http://localhost:5174';
  if (process.env.VITE_DEV_SERVER_URL || process.argv.includes('--dev')) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
