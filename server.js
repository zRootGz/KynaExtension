const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, urlPath === '/' ? 'test-environment/kyna_schedule_simulator.html' : urlPath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family:sans-serif; padding:40px; text-align:center;">
          <h2>404 - Không tìm thấy trang</h2>
          <p>Môi trường giả lập sẵn có:</p>
          <p><a href="/test-environment/kyna_schedule_simulator.html">📅 Giả lập Cổng Đăng ký Lịch Dạy Kyna</a></p>
          <p><a href="/test-environment/kyna_bbb_simulator.html">🎨 Giả lập Lớp học BigBlueButton (BBB)</a></p>
        </div>
      `);
    } else {
      let ext = path.extname(filePath).toLowerCase();
      let contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Kyna Extension Test Server đang chạy tại:`);
  console.log(`👉 Giả lập Lịch Dạy: http://localhost:${PORT}/test-environment/kyna_schedule_simulator.html`);
  console.log(`👉 Giả lập BBB Games: http://localhost:${PORT}/test-environment/kyna_bbb_simulator.html`);
  console.log(`====================================================`);
});
