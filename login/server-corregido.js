// server-corregido.js  —  VERSIÓN BUENA (CORREGIDA)
// Login con consulta parametrizada (prepared statement): los valores del
// usuario viajan por un canal de datos separado del texto SQL, por lo que
// el motor nunca los reinterpreta como código.
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
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(html);
  }

  if (req.method === 'POST' && req.url === '/login-vulnerable') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      const { username, password } = JSON.parse(body || '{}');

      // ✅ 1) Validación de entrada
      if (typeof username !== 'string' || typeof password !== 'string') {
        return send(res, 400, { ok: false, message: 'Datos inválidos' });
      }
      if (username.trim() === '' || password.trim() === '') {
        return send(res, 400, { ok: false, message: 'Datos inválidos' });
      }
      if (username.length > 100 || password.length > 100) {
        return send(res, 400, { ok: false, message: 'Datos inválidos' });
      }

      // ✅ 2) Consulta parametrizada: placeholders (?) en vez de concatenar
      const query = 'SELECT * FROM users WHERE username = ? AND password = ?';

      try {
        const row = db.prepare(query).get(username, password);
        if (row) return send(res, 200, { ok: true, user: row.username });
        return send(res, 401, { ok: false, message: 'Credenciales inválidas' });
      } catch (err) {
        // ✅ 3) Sin exposición de errores internos al cliente
        console.error('Error de base de datos:', err.message); // solo en el log del servidor
        return send(res, 500, { ok: false, message: 'Error interno' });
      }
    });
    return;
  }

  send(res, 404, { error: 'No encontrado' });
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
