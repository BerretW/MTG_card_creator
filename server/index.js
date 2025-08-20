// server/index.js
// server/index.js
require('dotenv').config(); // TENTO ŘÁDEK PŘIDEJTE NA ZAČÁTEK

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
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key'; // V produkci nastavte přes proměnnou prostředí!

// Middleware
app.use(cors());
app.use(express.json());

// Statické servírování nahraných souborů
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Konfigurace pro nahrávání souborů pomocí Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Unikátní název souboru
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Middleware pro ověření JWT tokenu
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
    if (!username || !password) return res.status(400).json({ message: "Username and password are required" });

    const hashedPassword = bcrypt.hashSync(password, 8);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
        if (err) return res.status(500).json({ message: "Could not register user. Username might already be taken." });
        res.status(201).json({ message: "User registered successfully", userId: this.lastID });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) return res.status(404).json({ message: "User not found" });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ accessToken: null, message: "Invalid Password!" });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: 86400 }); // 24 hodin
        res.status(200).json({ accessToken: token });
    });
});

// ASSETS
app.get('/api/assets', authenticateToken, (req, res) => {
    db.all('SELECT * FROM assets WHERE user_id = ? ORDER BY id DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "Error fetching assets" });
        // Přidáme plnou URL k obrázkům
        const assets = rows.map(row => ({
            id: row.id,
            url: `${req.protocol}://${req.get('host')}/uploads/${row.filename}`
        }));
        res.json(assets);
    });
});

app.post('/api/assets', authenticateToken, upload.single('art'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const { filename, path: filePath } = req.file;
    db.run('INSERT INTO assets (user_id, filename, path) VALUES (?, ?, ?)', [req.user.id, filename, filePath], function(err) {
        if (err) return res.status(500).json({ message: "Could not save asset to database" });
        
        const assetUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
        res.status(201).json({ id: this.lastID, url: assetUrl });
    });
});

// Statické servírování front-end aplikace (pro produkci)
// app.use(express.static(path.join(__dirname, '../client/dist')));

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../client/dist/index.html'));
// });


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});