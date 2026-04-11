import { app, BrowserWindow, ipcMain, protocol, net } from "electron";
import path from "node:path";
import http from "node:http";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import handler from "serve-handler";
import Store from "electron-store";

app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("enable-features", "PlatformHEVCDecoderSupport,CanvasOopRasterization");

const store = new Store();

// Register custom protocol
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-media', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true } }
]);

let staticServer;

function startStaticServer() {
  const outDir = path.join(app.getAppPath(), "out");
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) =>
      handler(request, response, {
        public: outDir,
        cleanUrls: true,
      })
    );

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve(server);
    });
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.join(app.getAppPath(), "electron", "preload.mjs")
    },
  });

  ipcMain.handle('electron-store-get', async (event, key) => {
    return store.get(key);
  });
  
  ipcMain.handle('electron-store-set', async (event, key, val) => {
    store.set(key, val);
  });
  
  ipcMain.handle('electron-store-delete', async (event, key) => {
    store.delete(key);
  });

  ipcMain.handle('download-media', async (event, { id, url }) => {
    try {
      const mediaDir = path.join(app.getPath("userData"), "media_cache");
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      const filePath = path.join(mediaDir, `${id}.mp4`);
      if (fs.existsSync(filePath)) {
        return `local-media://${filePath.replace(/\\/g, "/")}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Fetch failed");
      const fileStream = fs.createWriteStream(filePath);
      await pipeline(res.body, fileStream);
      return `local-media://${filePath.replace(/\\/g, "/")}`;
    } catch (e) {
      console.error("Download media error:", e);
      return null;
    }
  });

  protocol.handle('local-media', (request) => {
    const filePath = decodeURIComponent(request.url.slice('local-media://'.length));
    return net.fetch('file://' + filePath);
  });

  const isDev = process.env.ELECTRON_DEV === "1";
  if (isDev) {
    await win.loadURL("http://localhost:3000");
    return;
  }

  staticServer = await startStaticServer();
  const address = staticServer.address();
  if (address && typeof address === "object") {
    await win.loadURL(`http://127.0.0.1:${address.port}`);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (staticServer) {
    staticServer.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});
