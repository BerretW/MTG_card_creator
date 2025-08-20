// server/database.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();



// Zajistíme, aby složka existovala
const dbFolder = path.join(__dirname, 'database');
if (!require('fs').existsSync(dbFolder)) {
    require('fs').mkdirSync(dbFolder);
}
const DB_SOURCE = path.join(dbFolder, "db.sqlite"); // << ZMĚNA ZDE

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    } else {
        console.log('Connected to the SQLite database.');
        // Vytvoření tabulek, pokud neexistují
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            filename TEXT,
            path TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    }
});

module.exports = db;