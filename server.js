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
app.get('/get-orders', async (req, res) => {
    try {
      const query = `
        SELECT id, firstname, lastname, food_choice, meat_choice, quantity, drink, 
               ohne_soße, ohne_tomate, mit_scharf, mit_schafskäse, total_price, created_at
        FROM orders
        WHERE DATE(created_at) = CURRENT_DATE
      `;
      const result = await pool.query(query);
  
      // Bestellungen um das "Extra Wunsch"-Feld erweitern und Datum im gewünschten Format umwandeln
      const orders = result.rows.map(order => {
        // Datum im Format DD.MM.YY umwandeln
        const createdAt = new Date(order.created_at);
        const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${createdAt.getFullYear().toString().slice(2)}`;
  
        // Für die extra Wünsche: X, wenn `true`, sonst leer
        const ohneSoße = order.ohne_soße ? "X" : "";
        const ohneTomate = order.ohne_tomate ? "X" : "";
        const mitScharf = order.mit_scharf ? "X" : "";
        const mitSchafskäse = order.mit_schafskäse ? "X" : "";
  
        return {
          ...order,
          ohne_soße: ohneSoße,   // Extra Wunsch: ohne Soße
          ohne_tomate: ohneTomate, // Extra Wunsch: ohne Tomate
          mit_scharf: mitScharf,  // Extra Wunsch: mit Scharf
          mit_schafskäse: mitSchafskäse,  // Extra Wunsch: mit Schafskäse
          created_at: formattedDate
        };
      });
  
      res.json({ orders });  // Bestellungen mit Extra Wünschen zurückgeben
    } catch (err) {
      console.error('Fehler beim Abrufen der Bestellungen:', err); // Fehler im Server loggen
      res.status(500).json({ error: err.message });  // Den Fehler in der Antwort zurückgeben
    }
  });
  
  
// Endpunkt zum Speichern einer neuen Bestellung (POST)
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

// Endpunkt zum Löschen einer Bestellung (DELETE)
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

// Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
