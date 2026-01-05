const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../chaindrop.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Transfers table
    db.run(`
      CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY,
        sender_address TEXT NOT NULL,
        recipient_identifier TEXT NOT NULL,
        recipient_identifier_type TEXT NOT NULL,
        recipient_address TEXT NOT NULL,
        token_address TEXT NOT NULL,
        amount TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        claim_id TEXT UNIQUE,
        claim_token TEXT UNIQUE,
        claim_link TEXT,
        tx_hash TEXT,
        created_at INTEGER NOT NULL,
        claimed_at INTEGER,
        expires_at INTEGER NOT NULL
      )
    `);

    // Claims table
    db.run(`
      CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        transfer_id TEXT NOT NULL,
        claim_token TEXT NOT NULL,
        recipient_address TEXT NOT NULL,
        claimed BOOLEAN DEFAULT 0,
        claim_tx_hash TEXT,
        claimed_at INTEGER,
        FOREIGN KEY (transfer_id) REFERENCES transfers(id)
      )
    `);

    // Wallets table (track created wallets)
    db.run(`
      CREATE TABLE IF NOT EXISTS wallets (
        address TEXT PRIMARY KEY,
        owner_address TEXT NOT NULL,
        identifier TEXT NOT NULL,
        identifier_type TEXT NOT NULL,
        deployed BOOLEAN DEFAULT 0,
        deployed_at INTEGER,
        deployment_tx_hash TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    // Identifiers table (hash mapping for privacy)
    db.run(`
      CREATE TABLE IF NOT EXISTS identifiers (
        id TEXT PRIMARY KEY,
        identifier_hash TEXT UNIQUE NOT NULL,
        identifier_type TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    console.log('✅ Database initialized');
  });
}

// Database helper functions
const dbHelpers = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = {
  db,
  initializeDatabase,
  ...dbHelpers
};