const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // CORS-Modul importieren

const app = express();
const port = process.env.PORT || 3000;

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// PostgreSQL-Verbindung
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // SSL-Verbindung, da Render dies erfordert
  }
});

// CORS-Konfiguration
const corsOptions = {
  origin: 'https://alnovo21.github.io',
  methods: 'GET,POST,DELETE,PUT', // CORS für PUT-Methode aktivieren
};

app.use(cors(corsOptions));  // CORS für bestimmte Ursprünge aktivieren

// Middleware, um JSON-Daten zu verarbeiten
app.use(express.json());

// Route zum Abrufen der Bestellungen
app.get('/get-orders', async (req, res) => {
  try {
    const query = `
      SELECT id, firstname, lastname, food_choice, meat_choice, quantity, drink, 
             ohne_soße, ohne_tomate, mit_scharf, mit_schafskäse, total_price, paid, created_at
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    const result = await pool.query(query);

    const orders = result.rows.map(order => {
      const createdAt = new Date(order.created_at);
      const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${createdAt.getFullYear().toString().slice(2)}`;

      const ohneSoße = order.ohne_soße ? "X" : "";
      const ohneTomate = order.ohne_tomate ? "X" : "";
      const mitScharf = order.mit_scharf ? "X" : "";
      const mitSchafskäse = order.mit_schafskäse ? "X" : "";

      return {
        ...order,
        ohne_soße: ohneSoße,
        ohne_tomate: ohneTomate,
        mit_scharf: mitScharf,
        mit_schafskäse: mitSchafskäse,
        created_at: formattedDate
      };
    });

    res.json({ orders });
  } catch (err) {
    console.error('Fehler beim Abrufen der Bestellungen:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route zum Markieren einer Bestellung als bezahlt
app.put('/mark-as-paid/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('UPDATE orders SET paid = TRUE WHERE id = $1', [id]);
    res.status(200).send('Bestellung als bezahlt markiert');
  } catch (err) {
    console.error('Fehler beim Markieren der Bestellung als bezahlt:', err);
    res.status(500).send('Fehler beim Markieren der Bestellung als bezahlt');
  }
});

// Route zum Löschen einer Bestellung
app.delete('/delete-order/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.status(200).send('Bestellung erfolgreich gelöscht');
  } catch (err) {
    console.error('Fehler beim Löschen der Bestellung:', err);
    res.status(500).send('Fehler beim Löschen der Bestellung');
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});
