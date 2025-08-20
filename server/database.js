const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Vytvoříme cestu k podsložce 'database' uvnitř složky 'server'
const dbFolder = path.join(__dirname, 'database');

// Pokud složka neexistuje, vytvoříme ji
if (!require('fs').existsSync(dbFolder)) {
    require('fs').mkdirSync(dbFolder);
}

// Definujeme plnou cestu k souboru s databází
const DB_SOURCE = path.join(dbFolder, "db.sqlite");

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    } else {
        console.log('Připojeno k SQLite databázi.');
        
        // Tabulka pro uživatele
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);
        
        // Tabulka pro nahrané obrázky
        db.run(`CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            filename TEXT,
            path TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Tabulka pro šablony karet
        db.run(`CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            frame_image_url TEXT,
            elements TEXT,
            fonts TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    }
});

module.exports = db;