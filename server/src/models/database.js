import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create credentials table
    db.run(`
      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        website TEXT NOT NULL,
        username TEXT NOT NULL,
        encrypted_password TEXT NOT NULL,
        iv TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('Database tables initialized');
  });
}

// User operations
export function createUser(username, salt, passwordHash) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO users (username, salt, password_hash) VALUES (?, ?, ?)');
    stmt.run(username, salt, passwordHash, function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
    stmt.finalize();
  });
}

export function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Credential operations
export function createCredential(userId, website, username, encryptedPassword, iv) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO credentials (user_id, website, username, encrypted_password, iv) VALUES (?, ?, ?, ?, ?)');
    stmt.run(userId, website, username, encryptedPassword, iv, function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
    stmt.finalize();
  });
}

export function getCredentialsByUserId(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM credentials WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function getCredentialById(id, userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM credentials WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function updateCredential(id, userId, website, username, encryptedPassword, iv) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('UPDATE credentials SET website = ?, username = ?, encrypted_password = ?, iv = ? WHERE id = ? AND user_id = ?');
    stmt.run(website, username, encryptedPassword, iv, id, userId, function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
    stmt.finalize();
  });
}

export function deleteCredential(id, userId) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('DELETE FROM credentials WHERE id = ? AND user_id = ?');
    stmt.run(id, userId, function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
    stmt.finalize();
  });
}

export default db;
