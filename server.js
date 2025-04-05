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

app.post('/submit-orders', async (req, res) => {
    try {
      const orders = req.body;
  
      // Für jede Bestellung
      for (const order of orders) {
        const result = await pool.query(
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
      console.error(err);
      res.status(500).send('Fehler beim Speichern der Bestellung');
    }
  });
  
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
