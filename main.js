const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { db, createUser, verifyAndConsumeAdminKey } = require('./database');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// --- Multer Config (File Upload) ---
// Set storage engine
const storage = multer.diskStorage({
    destination: './public/uploads/avatars/',
    filename: function (req, file, cb) {
        // Name file: avatar-USERID-TIMESTAMP.ext
        cb(null, 'avatar-' + req.session.userId + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('avatar'); // Field name 'avatar'

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Doar imagini!');
    }
}

// ==========================================
// Middleware Configuration
// ==========================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Pentru request-uri JSON
app.use(express.static('public', { extensions: ['html'] })); // Serve static files without extension
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); // Explicitly serve uploads

app.use(session({
    secret: 'secret-key-atestat-proiect', // In productie, foloseste .env
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true daca folosim HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 zi
    }
}));

// ==========================================
// Authentication Middleware
// ==========================================
function requireLogin(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// ==========================================
// API Routes
// ==========================================

// --- REGISTER ---
app.post('/api/register', (req, res) => {
    const { username, email, password, adminKey } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Toate câmpurile sunt obligatorii." });
    }

    // Daca utilizatorul vrea sa fie admin, verificam cheia
    if (adminKey) {
        verifyAndConsumeAdminKey(adminKey, (err, isValid) => {
            if (err) return res.status(500).json({ error: "Eroare server." });
            if (!isValid) return res.status(403).json({ error: "Cheie de administrator invalidă sau deja folosită." });

            // Creare cont Admin
            registerUser(username, email, password, true, res);
        });
    } else {
        // Creare cont Standard
        registerUser(username, email, password, false, res);
    }
});

function registerUser(username, email, password, isAdmin, res) {
    createUser(username, email, password, isAdmin, (err, userId) => {
        if (err) {
            console.error(err);
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(400).json({ error: "Utilizatorul sau email-ul există deja." });
            }
            return res.status(500).json({ error: "Eroare la crearea contului." });
        }
        res.json({ success: true, message: "Cont creat cu succes!" });
    });
}

// --- LOGIN ---
app.post('/api/login', (req, res) => {
    const { identifier, password } = req.body;

    db.get(
        `SELECT * FROM users WHERE email = ? OR username = ?`,
        [identifier, identifier],
        async (err, user) => {
            if (err) return res.status(500).json({ error: "Eroare server." });
            if (!user) return res.status(401).json({ error: "Utilizator/Email sau parolă incorectă." });

            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                // Setare sesiune
                req.session.userId = user.id;
                req.session.username = user.username;
                req.session.isAdmin = !!user.is_admin;

                res.json({ success: true, redirect: '/dashboard' });
            } else {
                res.status(401).json({ error: "Email sau parolă incorectă." });
            }
        }
    );
});

// --- LOGOUT ---
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, redirect: '/login' });
});

// --- GET CURRENT USER ---
app.get('/api/me', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Neautorizat" });

    // Also fetch avatar_url
    db.get("SELECT username, is_admin, avatar_url FROM users WHERE id = ?", [req.session.userId], (err, row) => {
        if (err || !row) return res.status(500).json({ error: "Eroare DB" });
        res.json(row);
    });
});

// --- UPLOAD AVATAR ---
app.post('/api/upload-avatar', requireLogin, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err });
        } else {
            if (req.file == undefined) {
                return res.status(400).json({ error: 'Niciun fișier selectat!' });
            } else {
                // File uploaded successfully, update DB
                const avatarUrl = `/uploads/avatars/${req.file.filename}`;
                const userId = req.session.userId;

                db.run(`UPDATE users SET avatar_url = ? WHERE id = ?`, [avatarUrl, userId], (err) => {
                    if (err) return res.status(500).json({ error: 'Eroare salvare DB' });
                    res.json({
                        success: true,
                        message: 'Avatar actualizat!',
                        filePath: avatarUrl
                    });
                });
            }
        }
    });
});

// ==========================================
// Economic API Routes
// ==========================================

// --- GET BUDGET Overview ---
app.get('/api/budget', requireLogin, (req, res) => {
    const userId = req.session.userId;
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD

    // 1. Get Monthly Budget
    db.get(`SELECT amount FROM budgets WHERE user_id = ? AND month = ?`, [userId, currentMonth], (err, budgetRow) => {
        if (err) return res.status(500).json({ error: "Eroare DB" });

        const budgetTotal = budgetRow ? budgetRow.amount : 0;

        // 2. Get Total Expenses for this month
        db.get(`SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND date LIKE ?`, [userId, `${currentMonth}%`], (err, expenseRow) => {
            if (err) return res.status(500).json({ error: "Eroare DB" });

            const expensesTotal = expenseRow.total || 0;
            const remaining = budgetTotal - expensesTotal;

            // 3. Get Today's Expenses
            db.get(`SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND date = ?`, [userId, today], (err, todayRow) => {
                if (err) return res.status(500).json({ error: "Eroare DB" });

                const expensesToday = todayRow.total || 0;

                // 4. Calculate Daily Budget (Money Left / Days Left)
                const now = new Date();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const daysLeft = daysInMonth - now.getDate() + 1; // Include today
                const dailyBudget = daysLeft > 0 ? (remaining / daysLeft) : 0;

                res.json({
                    totalBudget: budgetTotal,
                    totalExpenses: expensesTotal,
                    remaining: remaining,
                    expensesToday: expensesToday,
                    dailyBudget: dailyBudget.toFixed(2),
                    daysLeft: daysLeft
                });
            });
        });
    });
});

// --- SET BUDGET ---
app.post('/api/budget', requireLogin, (req, res) => {
    const { amount } = req.body;
    const userId = req.session.userId;
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Check if exists
    db.get(`SELECT id FROM budgets WHERE user_id = ? AND month = ?`, [userId, currentMonth], (err, row) => {
        if (row) {
            // Update
            db.run(`UPDATE budgets SET amount = ? WHERE id = ?`, [amount, row.id], (err) => {
                if (err) return res.status(500).json({ error: "Eroare update" });
                res.json({ success: true });
            });
        } else {
            // Insert
            db.run(`INSERT INTO budgets (user_id, month, amount) VALUES (?, ?, ?)`, [userId, currentMonth, amount], (err) => {
                if (err) return res.status(500).json({ error: "Eroare insert" });
                res.json({ success: true });
            });
        }
    });
});

// --- ADD EXPENSE ---
app.post('/api/expenses', requireLogin, (req, res) => {
    const { amount, description, date } = req.body;
    const userId = req.session.userId;
    const expenseDate = date || new Date().toISOString().slice(0, 10);

    db.run(`INSERT INTO expenses (user_id, amount, description, date) VALUES (?, ?, ?, ?)`,
        [userId, amount, description, expenseDate],
        (err) => {
            if (err) return res.status(500).json({ error: "Eroare adaugare cheltuiala" });
            res.json({ success: true });
        }
    );
});

// --- GET RECENT EXPENSES ---
app.get('/api/expenses', requireLogin, (req, res) => {
    const userId = req.session.userId;
    db.all(`SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 5`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Eroare DB" });
        res.json(rows);
    });
});

// --- GET ALL EXPENSES FOR CURRENT MONTH (For Chart) ---
app.get('/api/expenses/month', requireLogin, (req, res) => {
    const userId = req.session.userId;
    const currentMonth = new Date().toISOString().slice(0, 7);
    db.all(`SELECT * FROM expenses WHERE user_id = ? AND date LIKE ? ORDER BY date DESC, id DESC`, [userId, `${currentMonth}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: "Eroare DB" });
        res.json(rows);
    });
});

// ==========================================
// Time Management API Routes
// ==========================================

// --- GET ACTIVITIES ---
app.get('/api/activities', requireLogin, (req, res) => {
    const userId = req.session.userId;
    db.all(`SELECT * FROM activities WHERE user_id = ? ORDER BY start_data ASC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Eroare DB" });
        res.json(rows);
    });
});

// --- ADD ACTIVITY ---
app.post('/api/activities', requireLogin, (req, res) => {
    const { title, type, start_data, duration } = req.body;
    const userId = req.session.userId;

    db.run(`INSERT INTO activities (user_id, title, type, start_data, duration) VALUES (?, ?, ?, ?, ?)`,
        [userId, title, type, start_data, duration],
        (err) => {
            if (err) return res.status(500).json({ error: "Eroare adaugare activitate" });
            res.json({ success: true });
        }
    );
});

// --- DELETE ACTIVITY ---
app.delete('/api/activities/:id', requireLogin, (req, res) => {
    const activityId = req.params.id;
    const userId = req.session.userId;

    db.run(`DELETE FROM activities WHERE id = ? AND user_id = ?`, [activityId, userId], (err) => {
        if (err) return res.status(500).json({ error: "Eroare stergere activitate" });
        res.json({ success: true });
    });
});

// --- SUGGEST SLOT (Simple Algorithm) ---
app.post('/api/suggest-slot', requireLogin, (req, res) => {
    const { duration } = req.body; // in minutes
    const userId = req.session.userId;

    // Simplificare: Cautăm în următoarele 3 zile, între orele 08:00 și 20:00
    // O implementare reală ar necesita verificarea complexă a suprapunerilor

    const suggestions = [];
    const now = new Date();

    // Generam cateva sloturi posibile
    for (let i = 1; i <= 3; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        d.setHours(14, 0, 0, 0); // Propune ora 14:00
        suggestions.push({
            date: d.toISOString().slice(0, 10),
            time: "14:00",
            label: `${d.toLocaleDateString('ro-RO', { weekday: 'long' })}, ora 14:00`
        });

        d.setHours(18, 0, 0, 0); // Propune ora 18:00
        suggestions.push({
            date: d.toISOString().slice(0, 10),
            time: "18:00",
            label: `${d.toLocaleDateString('ro-RO', { weekday: 'long' })}, ora 18:00`
        });
    }

    res.json(suggestions);
});

// --- GET NEXT ACTIVITIES (For Dashboard) ---
app.get('/api/next-activity', requireLogin, (req, res) => {
    const userId = req.session.userId;
    db.all(`SELECT * FROM activities WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Eroare DB" });

        const now = new Date();
        const upcoming = [];

        rows.forEach(act => {
            let actDate = null;
            if (act.type === 'fixed') {
                actDate = new Date(act.start_data);
            } else {
                // Parse "Monday 14:00"
                const parts = act.start_data.split(' ');
                if (parts.length === 2) {
                    const days = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
                    const targetDay = days[parts[0]];
                    const [hour, minute] = parts[1].split(':').map(Number);

                    actDate = new Date(now);
                    actDate.setHours(hour, minute, 0, 0);

                    // Adjust day
                    const currentDay = now.getDay();
                    let diff = targetDay - currentDay;
                    if (diff < 0 || (diff === 0 && actDate <= now)) {
                        diff += 7; // Next week
                    }
                    if (diff !== 0) actDate.setDate(now.getDate() + diff);
                }
            }

            if (actDate && actDate > now) {
                const diffTime = actDate - now;
                const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                upcoming.push({
                    title: act.title,
                    timestamp: actDate.getTime(),
                    time: actDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                    dateStr: actDate.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric' }),
                    days_until: daysDiff === 0 ? 'Azi' : (daysDiff === 1 ? 'Mâine' : `În ${daysDiff} zile`)
                });
            }
        });

        // Sort by time and take top 3
        upcoming.sort((a, b) => a.timestamp - b.timestamp);
        res.json({ activities: upcoming.slice(0, 3) });
    });
});

// ==========================================
// Server Start
// ==========================================
app.listen(port, () => {
    console.log(`Serverul rulează la adresa http://localhost:${port}`);
});
