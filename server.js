const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // CORS-Modul importieren

const app = express();
const port = process.env.PORT || 3000;  // Falls PORT nicht gesetzt ist, nutze 3000 für lokale Entwicklung

// PostgreSQL-Verbindung
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // Der Verbindungsstring wird über die Umgebungsvariable gesetzt
  ssl: {
    rejectUnauthorized: false // SSL-Verbindung, da Render dies erfordert
  }
});

// CORS-Konfiguration
const corsOptions = {
  origin: 'https://alnovo21.github.io', // Ersetze dies mit der tatsächlichen Frontend-URL
  methods: 'GET,POST,DELETE', // Erlaube nur bestimmte HTTP-Methoden
};

app.use(cors(corsOptions));  // CORS für bestimmte Ursprünge aktivieren

// Middleware, um JSON-Daten zu verarbeiten
app.use(express.json());

// Route zum Abrufen der Bestellungen
app.get('/get-orders', async (req, res) => {
  try {
    const query = `
      SELECT id, firstname, lastname, food_choice, meat_choice, quantity, drink, 
             ohne_soße, ohne_tomate, mit_scharf, mit_schafskäse, total_price, created_at, paid
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    const result = await pool.query(query);

    // Bestellungen um das "Extra Wunsch"-Feld erweitern und Datum im gewünschten Format umwandeln
    const orders = result.rows.map(order => {
      const createdAt = new Date(order.created_at);
      const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${createdAt.getFullYear().toString().slice(2)}`;

      // Extra Wünsche mit "X" kennzeichnen, wenn der Wert true ist
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

// Route zum Speichern einer neuen Bestellung
app.post('/submit-orders', async (req, res) => {
  try {
    const orders = req.body;

    for (const order of orders) {
      await pool.query(
        'INSERT INTO orders (firstname, lastname, food_choice, meat_choice, quantity, drink, ohne_soße, ohne_tomate, mit_scharf, mit_schafskäse, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [
          order.firstname,
          order.lastname,
          order.foodChoice,
          order.meatChoice,
          order.quantity,
          order.drinkChoice,
          order.extra_no_sauce,
          order.extra_no_tomato,
          order.extra_spicy,
          order.extra_with_cheese,
          (order.price * order.quantity)
        ]
      );
    }

    res.status(200).send('Bestellungen erfolgreich gespeichert');
  } catch (err) {
    console.error('Fehler beim Speichern der Bestellungen:', err);
    res.status(500).send('Fehler beim Speichern der Bestellungen');
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

// Route zum Markieren einer Bestellung als bezahlt
app.post('/mark-as-paid/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('UPDATE orders SET paid = true WHERE id = $1', [id]);
    res.status(200).send('Bestellung als bezahlt markiert');
  } catch (err) {
    console.error('Fehler beim Markieren der Bestellung als bezahlt:', err);
    res.status(500).send('Fehler beim Markieren der Bestellung als bezahlt');
  }
});

// Route zum Abrufen aller Bestellungen
app.get('/get-all-orders', async (req, res) => {
  try {
    const query = 'SELECT id, firstname, lastname, food_choice, meat_choice, quantity, drink, paid, total_price, created_at FROM orders';
    const result = await pool.query(query);

    const orders = result.rows.map(order => {
      const createdAt = new Date(order.created_at);
      const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${createdAt.getFullYear().toString().slice(2)}`;
      return { ...order, created_at: formattedDate };
    });

    res.json({ orders });
  } catch (err) {
    console.error('Fehler beim Abrufen der Bestellungen:', err);
    res.status(500).json({ error: err.message });
  }
});

// Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
