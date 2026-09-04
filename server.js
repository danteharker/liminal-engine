const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff'
};

const server = http.createServer((req, res) => {
    // Strip query string, decode URI to handle spaces in filenames
    const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(PUBLIC_DIR, decodedUrl === '/' ? 'index.html' : decodedUrl);
    
    // Safety check to prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.statusCode = 404;
                res.end('Not Found');
            } else {
                res.statusCode = 500;
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`  Liminal Engine v2 Server running at:`);
    console.log(`  http://localhost:${PORT}/`);
    console.log(`===================================================`);
    console.log(`Press Ctrl+C in this terminal window to stop the server.`);
    
    // Automatically open browser on Windows
    const { exec } = require('child_process');
    exec(`start http://localhost:${PORT}/`);
});
