const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const dbFolder = path.join(__dirname, 'database');
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder);
}

const DB_SOURCE = path.join(dbFolder, "db.sqlite");

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    } else {
        console.log('Připojeno k SQLite databázi.');
        
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

        db.run(`CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            frame_image_url TEXT,
            elements TEXT,
            fonts TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // --- NOVÁ TABULKA PRO BALÍČKY ---
        db.run(`CREATE TABLE IF NOT EXISTS decks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`);

        // --- NOVÁ TABULKA PRO KARTY V BALÍČCÍCH ---
        db.run(`CREATE TABLE IF NOT EXISTS deck_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deck_id INTEGER NOT NULL,
            card_data TEXT NOT NULL, -- Uložíme celá data karty jako JSON
            template_data TEXT NOT NULL, -- Uložíme i šablonu použitou pro kartu
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
        )`);
    }
});

module.exports = db;