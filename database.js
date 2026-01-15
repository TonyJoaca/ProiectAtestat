const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'atestat.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Eroare la conectarea la baza de date:', err.message);
    } else {
        console.log('Conectat la baza de date SQLite.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // 1. Tabel Utilizatori
        // Stocăm parola hash-uită, niciodată text simplu!
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // 2. Tabel Chei Admin
        // Chei unice folosite pentru a crea conturi de admin
        db.run(`CREATE TABLE IF NOT EXISTS admin_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_value TEXT UNIQUE NOT NULL,
      is_used INTEGER DEFAULT 0
    )`);

        // 3. Tabel Bugete Lunare
        db.run(`CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month TEXT NOT NULL, /* Format: YYYY-MM */
      amount REAL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // 4. Tabel Cheltuieli
        db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL, /* Format: YYYY-MM-DD */
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // 5. Tabel Consumabile (Ex: apa, cafea) - Optional
        db.run(`CREATE TABLE IF NOT EXISTS consumables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      date TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // 6. Tabel Activități (Time Management)
        db.run(`CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL, /* 'fixed' sau 'recurring' */
      start_data TEXT NOT NULL, /* Format: '2024-01-20T14:00' sau 'Monday 14:00' */
      duration INTEGER NOT NULL, /* Minute */
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // 7. Configurare initiala Chei Admin
        // Doar pentru testare: cheia "ADMIN123"
        db.get("SELECT count(*) as count FROM admin_keys", (err, row) => {
            if (!err && row.count === 0) {
                db.run("INSERT INTO admin_keys (key_value) VALUES ('ADMIN123')");
                console.log("Cheie admin initiala generata: ADMIN123");
            }
        });

        console.log('Tabelele "users", "admin_keys", "budgets", "expenses", "activities" sunt pregătite.');
    });
}

/**
 * Helper pentru a crea un utilizator nou
 */
function createUser(username, email, password, isAdmin = false, callback) {
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return callback(err);

        db.run(
            `INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)`,
            [username, email, hash, isAdmin ? 1 : 0],
            function (err) {
                callback(err, this ? this.lastID : null);
            }
        );
    });
}

/**
 * Helper pentru a verifica cheia admin
 */
function verifyAndConsumeAdminKey(key, callback) {
    db.get(`SELECT id FROM admin_keys WHERE key_value = ? AND is_used = 0`, [key], (err, row) => {
        if (err) return callback(err, false);
        if (!row) return callback(null, false);

        // Marcam cheia ca fiind folosita
        db.run(`UPDATE admin_keys SET is_used = 1 WHERE id = ?`, [row.id], (err) => {
            callback(err, true);
        });
    });
}

module.exports = {
    db,
    createUser,
    verifyAndConsumeAdminKey
};
