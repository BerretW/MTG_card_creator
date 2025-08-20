require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// --- VÝCHOZÍ ŠABLONY (používají se při registraci nového uživatele) ---
const DEFAULT_TEMPLATES = [
    {
        name: 'Modern',
        frameImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXcAAAKtCAIAAACVz9xeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABWSURBVHja7cExAQAAAMKg9U/tbwagAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4N2kMAAE2lADsAAAAAElFTSuQmCC',
        elements: { title: { x: 5.5, y: 5, width: 55, height: 6 }, manaCost: { x: 62, y: 5, width: 32, height: 6 }, art: { x: 4.5, y: 12, width: 91, height: 46 }, typeLine: { x: 5.5, y: 59, width: 75, height: 6 }, setSymbol: { x: 84.5, y: 59.5, width: 10, height: 5 }, textBox: { x: 5.5, y: 66, width: 89, height: 26 }, ptBox: { x: 78, y: 88.5, width: 16, height: 6 }, collectorNumber: { x: 5, y: 94, width: 40, height: 3 }, artist: { x: 50, y: 94, width: 45, height: 3 }, },
        fonts: { title: { fontFamily: 'Beleren, sans-serif', fontSize: 18, color: '#000000', textAlign: 'left', fontWeight: 'bold' }, typeLine: { fontFamily: 'Beleren, sans-serif', fontSize: 16, color: '#000000', textAlign: 'left', fontWeight: 'bold' }, rulesText: { fontFamily: 'MPlantin, serif', fontSize: 15, color: '#000000', textAlign: 'left', fontWeight: 'normal' }, flavorText: { fontFamily: 'MPlantin, serif', fontSize: 14, color: '#000000', textAlign: 'left', fontStyle: 'italic', fontWeight: 'normal' }, pt: { fontFamily: 'Beleren, sans-serif', fontSize: 19, color: '#000000', textAlign: 'center', fontWeight: 'bold' }, collectorNumber: { fontFamily: 'MPlantin, serif', fontSize: 10, color: '#000000', textAlign: 'left', fontWeight: 'normal' }, artist: { fontFamily: 'Beleren, sans-serif', fontSize: 10, color: '#000000', textAlign: 'right', fontWeight: 'normal' }, }
    },
    {
        name: 'Showcase',
        frameImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXcAAAKtCAIAAACVz9xeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAB/SURBVHja7dJBAYAwEMDAwL9+aQ8eIIkd2bOzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4os+a+pt0+AZ+fvgEAAAAAAAAAAAAAAAAA+GU9cW89gP8d/30A+G09aAB4mAAA+GgBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAb2y4AAZ1LPAkAAAAASUVORK5CYII=',
        elements: { title: { x: 5.5, y: 5, width: 55, height: 6 }, manaCost: { x: 62, y: 5, width: 32, height: 6 }, art: { x: 0, y: 0, width: 100, height: 65 }, typeLine: { x: 5.5, y: 59, width: 75, height: 6 }, setSymbol: { x: 84.5, y: 59.5, width: 10, height: 5 }, textBox: { x: 5.5, y: 66, width: 89, height: 26 }, ptBox: { x: 78, y: 88.5, width: 16, height: 6 }, collectorNumber: { x: 5, y: 94, width: 40, height: 3 }, artist: { x: 50, y: 94, width: 45, height: 3 }, },
        fonts: { title: { fontFamily: 'Beleren, sans-serif', fontSize: 18, color: '#FFFFFF', textAlign: 'left', fontWeight: 'bold' }, typeLine: { fontFamily: 'Beleren, sans-serif', fontSize: 16, color: '#FFFFFF', textAlign: 'left', fontWeight: 'bold' }, rulesText: { fontFamily: 'MPlantin, serif', fontSize: 15, color: '#FFFFFF', textAlign: 'left', fontWeight: 'normal' }, flavorText: { fontFamily: 'MPlantin, serif', fontSize: 14, color: '#FFFFFF', textAlign: 'left', fontStyle: 'italic', fontWeight: 'normal' }, pt: { fontFamily: 'Beleren, sans-serif', fontSize: 19, color: '#FFFFFF', textAlign: 'center', fontWeight: 'bold' }, collectorNumber: { fontFamily: 'MPlantin, serif', fontSize: 10, color: '#FFFFFF', textAlign: 'left', fontWeight: 'normal' }, artist: { fontFamily: 'Beleren, sans-serif', fontSize: 10, color: '#FFFFFF', textAlign: 'right', fontWeight: 'normal' }, }
    }
];

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Multer pro nahrávání souborů ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// --- Middleware pro ověření tokenu ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- API Routes ---

// AUTH
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Uživatelské jméno a heslo jsou povinné." });

    const hashedPassword = bcrypt.hashSync(password, 8);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
        if (err) return res.status(500).json({ message: "Nelze zaregistrovat uživatele. Jméno je již obsazené." });

        const userId = this.lastID;
        const stmt = db.prepare("INSERT INTO templates (user_id, name, frame_image_url, elements, fonts) VALUES (?, ?, ?, ?, ?)");
        DEFAULT_TEMPLATES.forEach(t => {
            stmt.run(userId, t.name, t.frameImageUrl, JSON.stringify(t.elements), JSON.stringify(t.fonts));
        });
        stmt.finalize((err) => {
            if (err) console.error("Chyba při vkládání výchozích šablon pro uživatele " + userId, err);
        });

        res.status(201).json({ message: "Uživatel úspěšně zaregistrován.", userId });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) return res.status(404).json({ message: "Uživatel nenalezen." });

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ accessToken: null, message: "Neplatné heslo!" });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: 86400 });
        res.status(200).json({ accessToken: token });
    });
});

// ASSETS
app.get('/api/assets', authenticateToken, (req, res) => {
    db.all('SELECT * FROM assets WHERE user_id = ? ORDER BY id DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "Chyba při načítání obrázků." });
        const assets = rows.map(row => ({
            id: row.id,
            url: `${req.protocol}://${req.get('host')}/uploads/${row.filename}`
        }));
        res.json(assets);
    });
});

app.post('/api/assets', authenticateToken, upload.single('art'), (req, res) => {
    if (!req.file) return res.status(400).send('Nebyl nahrán žádný soubor.');
    const { filename, path: filePath } = req.file;
    db.run('INSERT INTO assets (user_id, filename, path) VALUES (?, ?, ?)', [req.user.id, filename, filePath], function(err) {
        if (err) return res.status(500).json({ message: "Nepodařilo se uložit obrázek do databáze." });
        const assetUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
        res.status(201).json({ id: this.lastID, url: assetUrl });
    });
});


// TEMPLATES (CRUD)

// GET all templates for a user
app.get('/api/templates', authenticateToken, (req, res) => {
    db.all('SELECT * FROM templates WHERE user_id = ?', [req.user.id], (err, rows) => {
        if (err) {
            console.error("Database error fetching templates:", err);
            return res.status(500).json({ message: "Chyba při načítání šablon." });
        }
        try {
            const templates = rows.map(row => ({
                id: row.id,
                name: row.name,
                frameImageUrl: row.frame_image_url,
                elements: JSON.parse(row.elements || '{}'),
                fonts: JSON.parse(row.fonts || '{}')
            }));
            res.json(templates);
        } catch (parseError) {
            console.error("Error parsing template data from DB:", parseError);
            res.status(500).json({ message: "Chyba ve formátu dat šablon v databázi." });
        }
    });
});

// CREATE a new template
app.post('/api/templates', authenticateToken, (req, res) => {
    const { name, frameImageUrl, elements, fonts } = req.body;
    const sql = `INSERT INTO templates (user_id, name, frame_image_url, elements, fonts) VALUES (?, ?, ?, ?, ?)`;
    const params = [req.user.id, name, frameImageUrl, JSON.stringify(elements), JSON.stringify(fonts)];

    db.run(sql, params, function (err) {
        if (err) {
            console.error("Database error creating template:", err);
            return res.status(500).json({ message: "Chyba při vytváření šablony." });
        }
        // Načteme nově vytvořenou šablonu a pošleme ji zpět
        db.get("SELECT * FROM templates WHERE id = ?", [this.lastID], (err, row) => {
             if (err || !row) {
                return res.status(500).json({ message: "Chyba při načítání nově vytvořené šablony." });
            }
            const newTemplate = {
                id: row.id,
                name: row.name,
                frameImageUrl: row.frame_image_url,
                elements: JSON.parse(row.elements || '{}'),
                fonts: JSON.parse(row.fonts || '{}')
            };
            res.status(201).json(newTemplate);
        });
    });
});

// UPDATE an existing template
app.put('/api/templates/:id', authenticateToken, (req, res) => {
    const { name, frameImageUrl, elements, fonts } = req.body;
    const { id } = req.params;
    const sql = `UPDATE templates SET name = ?, frame_image_url = ?, elements = ?, fonts = ? WHERE id = ? AND user_id = ?`;
    const params = [name, frameImageUrl, JSON.stringify(elements), JSON.stringify(fonts), id, req.user.id];

    db.run(sql, params, function (err) {
        if (err) {
            console.error("Database error updating template:", err);
            return res.status(500).json({ message: "Chyba při aktualizaci šablony." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Šablona nenalezena nebo nemáte oprávnění." });
        }
        // Načteme aktualizovanou šablonu a pošleme ji zpět
         db.get("SELECT * FROM templates WHERE id = ?", [id], (err, row) => {
             if (err || !row) {
                return res.status(500).json({ message: "Chyba při načítání aktualizované šablony." });
            }
            const updatedTemplate = {
                id: row.id,
                name: row.name,
                frameImageUrl: row.frame_image_url,
                elements: JSON.parse(row.elements || '{}'),
                fonts: JSON.parse(row.fonts || '{}')
            };
            res.status(200).json(updatedTemplate);
        });
    });
});

// DELETE a template
app.delete('/api/templates/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM templates WHERE id = ? AND user_id = ?`;

    db.run(sql, [id, req.user.id], function (err) {
        if (err) {
            console.error("Database error deleting template:", err);
            return res.status(500).json({ message: "Chyba při mazání šablony." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Šablona nenalezena nebo nemáte oprávnění." });
        }
        res.status(200).json({ message: "Šablona úspěšně smazána." });
    });
});


// GET VŠECHNY BALÍČKY UŽIVATELE
app.get('/api/decks', authenticateToken, (req, res) => {
    const sql = "SELECT * FROM decks WHERE user_id = ? ORDER BY created_at DESC";
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "Chyba při načítání balíčků." });
        res.json(rows);
    });
});

// VYTVOŘENÍ NOVÉHO BALÍČKU
app.post('/api/decks', authenticateToken, (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Název balíčku je povinný." });

    const sql = "INSERT INTO decks (user_id, name, description) VALUES (?, ?, ?)";
    db.run(sql, [req.user.id, name, description || ''], function(err) {
        if (err) return res.status(500).json({ message: "Chyba při vytváření balíčku." });
        res.status(201).json({ id: this.lastID, user_id: req.user.id, name, description });
    });
});

// ZÍSKÁNÍ JEDNOHO BALÍČKU VČETNĚ KARET
app.get('/api/decks/:id', authenticateToken, (req, res) => {
    const deckSql = "SELECT * FROM decks WHERE id = ? AND user_id = ?";
    db.get(deckSql, [req.params.id, req.user.id], (err, deck) => {
        if (err) return res.status(500).json({ message: "Chyba databáze." });
        if (!deck) return res.status(404).json({ message: "Balíček nenalezen." });

        const cardsSql = "SELECT * FROM deck_cards WHERE deck_id = ? ORDER BY added_at ASC";
        db.all(cardsSql, [req.params.id], (err, cards) => {
            if (err) return res.status(500).json({ message: "Chyba při načítání karet." });
            
            // Parsování JSON dat pro každou kartu
            const processedCards = cards.map(c => ({
                ...c,
                card_data: JSON.parse(c.card_data),
                template_data: JSON.parse(c.template_data)
            }));

            res.json({ ...deck, cards: processedCards });
        });
    });
});

// SMAZÁNÍ BALÍČKU
app.delete('/api/decks/:id', authenticateToken, (req, res) => {
    // Díky ON DELETE CASCADE v databázi se smažou i všechny karty v balíčku
    const sql = "DELETE FROM decks WHERE id = ? AND user_id = ?";
    db.run(sql, [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Chyba při mazání balíčku." });
        if (this.changes === 0) return res.status(404).json({ message: "Balíček nenalezen." });
        res.status(200).json({ message: "Balíček úspěšně smazán." });
    });
});

// PŘIDÁNÍ KARTY DO BALÍČKU
app.post('/api/decks/:id/cards', authenticateToken, (req, res) => {
    const { card_data, template_data } = req.body;
    if (!card_data || !template_data) return res.status(400).json({ message: "Chybí data karty nebo šablony." });

    const sql = "INSERT INTO deck_cards (deck_id, card_data, template_data) VALUES (?, ?, ?)";
    db.run(sql, [req.params.id, JSON.stringify(card_data), JSON.stringify(template_data)], function(err) {
        if (err) return res.status(500).json({ message: "Chyba při ukládání karty do balíčku." });
        res.status(201).json({ id: this.lastID, deck_id: req.params.id });
    });
});

// ODSTRANĚNÍ KARTY Z BALÍČKU
app.delete('/api/decks/:deckId/cards/:cardId', authenticateToken, (req, res) => {
    const sql = "DELETE FROM deck_cards WHERE id = ? AND deck_id = ?";
    db.run(sql, [req.params.cardId, req.params.deckId], function(err) {
        if (err) return res.status(500).json({ message: "Chyba při mazání karty." });
        if (this.changes === 0) return res.status(404).json({ message: "Karta v balíčku nenalezena." });
        res.status(200).json({ message: "Karta úspěšně smazána." });
    });
});


// --- NOVÁ CESTA: AKTUALIZACE KONKRÉTNÍ KARTY V BALÍČKU ---
app.put('/api/decks/:deckId/cards/:cardId', authenticateToken, (req, res) => {
    const { card_data, template_data } = req.body;
    if (!card_data || !template_data) return res.status(400).json({ message: "Chybí data karty nebo šablony." });

    // Prvně ověříme, že balíček patří přihlášenému uživateli
    db.get("SELECT user_id FROM decks WHERE id = ?", [req.params.deckId], (err, deck) => {
        if (err) return res.status(500).json({ message: "Chyba databáze při ověřování balíčku." });
        if (!deck || deck.user_id !== req.user.id) {
            return res.status(403).json({ message: "Nemáte oprávnění k tomuto balíčku." });
        }

        // Pokud je oprávnění v pořádku, aktualizujeme kartu
        const sql = "UPDATE deck_cards SET card_data = ?, template_data = ? WHERE id = ? AND deck_id = ?";
        const params = [
            JSON.stringify(card_data),
            JSON.stringify(template_data),
            req.params.cardId,
            req.params.deckId
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ message: "Chyba při aktualizaci karty." });
            if (this.changes === 0) return res.status(404).json({ message: "Karta v balíčku nenalezena." });
            res.status(200).json({ message: "Karta úspěšně aktualizována." });
        });
    });
});


// --- Spuštění serveru ---
app.listen(PORT, () => {
    console.log(`Server běží na portu ${PORT}`);
});