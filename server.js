const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// ✅ HIER DEINE DATENBANK EINTRAGEN
const db = new Pool({
    user: "postgres",
    host: "localhost",
    database: "bestell_db",
    password: "password",
    port: 5432,
});

const JWT_KEY = "SUPERSECRETKEY";


// ✅ AUTH MIDDLEWARE
function auth(req, res, next) {
    const token = req.cookies.auth;

    if (!token) return res.status(401).json({ error: "Not logged in" });

    try {
        req.user = jwt.verify(token, JWT_KEY);
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid token" });
    }
}


// ✅ SIGNUP (Registrieren)
app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ error: "Missing fields" });

    const hashed = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users (name, email, password)
                 VALUES ($1, $2, $3);`;

    try {
        await db.query(sql, [name, email, hashed]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "E-Mail bereits vergeben." });
    }
});


// ✅ SIGNIN (Login)
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = $1";

    try {
        const result = await db.query(sql, [email]);

        if (result.rowCount === 0)
            return res.status(400).json({ error: "Ungültige Email oder Passwort" });

        const user = result.rows[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(400).json({ error: "Ungültige Email oder Passwort" });

        const token = jwt.sign({ id: user.id, name: user.name }, JWT_KEY, { expiresIn: "7d" });

        res.cookie("auth", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Login Fehler" });
    }
});


// ✅ LOGOUT (optional)
app.post("/logout", (req, res) => {
    res.clearCookie("auth");
    res.json({ success: true });
});


// ✅ "MEINE BESTELLUNGEN"
app.get("/myorders", auth, async (req, res) => {
    const sql = "SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC";

    try {
        const result = await db.query(sql, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "DB error" });
    }
});


// ✅ BESTELLUNGEN ABSCHICKEN
app.post("/submit-orders", auth, async (req, res) => {
    const orders = req.body;

    try {
        for (const o of orders) {
            const sql = `
                INSERT INTO orders 
                (firstname, lastname, productname, meat, quantity, price, user_id, time)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `;

            await db.query(sql, [
                o.firstname,
                o.lastname,
                o.foodChoice,
                o.meatChoice,
                o.quantity,
                o.price,
                req.user.id
            ]);
        }

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Fehler beim Speichern" });
    }
});


// ✅ SERVER START
app.listen(3000, () => {
    console.log("Server läuft auf Port 3000");
});
