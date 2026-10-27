// server-vulnerable.js  —  VERSIÓN DE PRUEBA (VULNERABLE a inyección SQL)
// Práctica escolar demostrativa. Login que arma el SQL concatenando la
// entrada del usuario: todo carácter de control SQL del atacante pasa a
// formar parte de la sentencia ejecutada.
const http = require('node:http');
const fs   = require('node:fs');
const path = require('node:path');
const db   = require('./db');

const PORT = 3000;

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  // Servir el formulario
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(html);
  }

  // Endpoint de login VULNERABLE
  if (req.method === 'POST' && req.url === '/login-vulnerable') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      const { username, password } = JSON.parse(body || '{}');

      // ❌ VULNERABILIDAD: la entrada del usuario se concatena dentro del SQL
      const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

      console.log('Query ejecutada:', query);

      try {
        const row = db.prepare(query).get();      // se interpreta como código SQL
        if (row) return send(res, 200, { ok: true, user: row.username });
        return send(res, 401, { ok: false, message: 'Credenciales inválidas' });
      } catch (err) {
        // ❌ FUGA DE INFORMACIÓN: el error crudo del motor se devuelve al cliente
        return send(res, 500, { error: err.message });
      }
    });
    return;
  }

  send(res, 404, { error: 'No encontrado' });
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
