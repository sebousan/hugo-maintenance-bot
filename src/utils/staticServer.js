// utils/staticServer.js
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

export function createStaticServer(basePath) {
  const contentTypeMap = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf'
  };

  const server = createServer((req, res) => {
    let filePath = path.join(basePath, req.url === '/' ? 'index.html' : req.url);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).substring(1);
      const contentType = contentTypeMap[ext] || 'text/plain';
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading file');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return {
    start: (port) => {
      return new Promise((resolve) => {
        server.listen(port, '127.0.0.1', () => {
          logger.info(`🌐 Serving static files at http://localhost:${port}`);
          resolve(server);
        });
      });
    },
    stop: (serverInstance) => {
      return new Promise((resolve) => {
        serverInstance.close(() => {
          logger.info('🛑 Server stopped');
          resolve();
        });
      });
    }
  };
}
