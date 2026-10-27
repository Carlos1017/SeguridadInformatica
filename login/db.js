// db.js — Base de datos SQLite en memoria para la práctica (node:sqlite nativo)
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE users (
    id       INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT
  );
  INSERT INTO users (username, password) VALUES
    ('admin', 'admin'),
    ('juan',  'noseloqueseria'),
    ('maria', 'maria123');
`);

module.exports = db;
