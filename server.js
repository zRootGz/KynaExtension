const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'test_bbb_chat.html' : req.url);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1>');
    } else {
      let ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.css') contentType = 'text/css';
      if (ext === '.js') contentType = 'text/javascript';

      res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server test BBB đang chạy tại địa chỉ: http://localhost:${PORT}/test_bbb_chat.html`);
});
