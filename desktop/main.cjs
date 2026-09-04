"use strict";

const { app, BrowserWindow, shell } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".map": "application/json",
};

function wwwRoot() {
  if (app.isPackaged) return path.join(process.resourcesPath, "www");
  return path.join(__dirname, "www");
}

function startServer(root) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const raw = decodeURIComponent((req.url || "/").split("?")[0] || "/");
      const rel = raw === "/" ? "/index.html" : raw;
      const file = path.normalize(path.join(root, rel));
      if (!file.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(file, (err, data) => {
        if (err) {
          fs.readFile(path.join(root, "index.html"), (fallbackErr, html) => {
            if (fallbackErr) {
              res.writeHead(404);
              res.end("Genesis Engine: file not found");
              return;
            }
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(html);
          });
          return;
        }
        const ext = path.extname(file).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function createWindow() {
  const root = wwwRoot();
  const server = await startServer(root);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const url = `http://127.0.0.1:${port}/`;

  const icon = path.join(root, "icon-512.png");
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 390,
    minHeight: 640,
    backgroundColor: "#08090b",
    title: "Genesis Engine",
    autoHideMenuBar: true,
    show: false,
    icon: fs.existsSync(icon) ? icon : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    void shell.openExternal(target);
    return { action: "deny" };
  });
  await win.loadURL(url);
  win.on("closed", () => {
    server.close();
  });
}

app.whenReady().then(() => {
  void createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
