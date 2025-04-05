const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // CORS-Modul importieren

const app = express();
const port = 3000;

// PostgreSQL-Verbindung
const pool = new Pool({
  user: 'bestell_db_user',
  host: 'dpg-cvoc153uibrs73bnqj6g-a.frankfurt-postgres.render.com',
  database: 'bestell_db',
  password: 'tBGiQsimADgbJBHdQ3tTeR1bqG6v39lI',
  port: 5432,
  ssl: {
    rejectUnauthorized: false // Dies erlaubt uns, eine SSL-Verbindung ohne Zertifikatsprüfung herzustellen
  }
});

// CORS aktivieren
app.use(cors());  // CORS für alle Ursprünge aktivieren

// Middleware, um JSON-Daten zu verarbeiten
app.use(express.json());

// API-Endpunkt für Bestellungen
app.post('/submit-orders', async (req, res) => {
  try {
    const orders = req.body; // Die Bestellungen aus dem Body der Anfrage

    // Hier fügen wir jede Bestellung in die PostgreSQL-Datenbank ein
    for (const order of orders) {
      const query = 'INSERT INTO orders (firstname, lastname, food_choice, meat_choice, quantity, price) VALUES ($1, $2, $3, $4, $5, $6)';
      await pool.query(query, [
        order.firstname,
        order.lastname,
        order.foodChoice,
        order.meatChoice,
        order.quantity,
        order.price,
      ]);
    }

    // Erfolgreiche Antwort zurückgeben
    res.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Einfügen der Bestellung:', error);
    res.json({ success: false, error: 'Fehler beim Absenden der Bestellung.' });
  }
});
// API-Endpunkt zum Abrufen der Bestellungen
app.get('/get-orders', async (req, res) => {
    try {
      // Abfrage zum Abrufen aller Bestellungen
      const result = await pool.query('SELECT * FROM orders');
      // Sende die Bestellungen als JSON zurück
      res.json(result.rows);
    } catch (error) {
      console.error('Fehler beim Abrufen der Bestellungen:', error);
      res.json({ success: false, error: 'Fehler beim Abrufen der Bestellungen.' });
    }
  });
  
// Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
