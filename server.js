const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 

const app = express();
const port = process.env.PORT || 3000;  
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

const pool = new Pool({
  user: 'admin',                  
  host: '188.22.61.203',             
  database: 'bestell_db',      
  password: 'workwork!',         
  port: 5432                     

});


const corsOptions = {
  origin: '*',
  methods: 'GET,POST,DELETE,PATCH',
};


app.use(cors(corsOptions));  // CORS für bestimmte Ursprünge aktivieren

// Middleware, um JSON-Daten zu verarbeiten
app.use(express.json());

app.get('/get-orders', async (req, res) => {
  try {
    const query = `
      SELECT id, firstname, lastname, food_choice, meat_choice, quantity, drink, 
             ohne_soße, ohne_tomate, mit_scharf, mit_schafskäse,
             ohne_zwiebel, extra_soße, nur_salat,
             total_price, created_at, paid
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    const result = await pool.query(query);

    const orders = result.rows.map(order => {
      const createdAt = new Date(order.created_at);
      const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${createdAt.getFullYear().toString().slice(2)}`;

      return {
        ...order,
        ohne_soße: order.ohne_soße ? "X" : "",
        ohne_tomate: order.ohne_tomate ? "X" : "",
        mit_scharf: order.mit_scharf ? "X" : "",
        mit_schafskäse: order.mit_schafskäse ? "X" : "",
        ohne_zwiebel: order.ohne_zwiebel ? "X" : "",
        extra_soße: order.extra_soße ? "X" : "",
        nur_salat: order.nur_salat ? "X" : "",
        created_at: formattedDate,
        paid: order.paid ? "Bezahlt" : "Nicht Bezahlt"
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
        'INSERT INTO orders (firstname, lastname, food_choice, meat_choice, quantity, drink, ohne_soße, ohne_tomate, mit_scharf, mit_schafskäse, ohne_zwiebel, nur_salat, extra_soße, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
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
          order.extra_no_onion,
          order.extra_only_salad,
          order.extra_extra_soße,
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

// Route zum Aktualisieren des "paid"-Status einer Bestellung
app.patch('/mark-paid/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('UPDATE orders SET paid = true WHERE id = $1', [id]);
    res.status(200).send(`Bestellung mit ID ${id} als bezahlt markiert`);
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Paid-Status:', err);
    res.status(500).send('Fehler beim Aktualisieren des Paid-Status');
  }
});
// Route zum Abrufen aller Bestellungen (ohne Datumseinschränkung)
app.get('/get-all-orders', async (req, res) => {
  try {
    const query = `
      SELECT id, firstname, lastname, food_choice, meat_choice, quantity, drink, 
             ohne_soße, ohne_tomate, mit_scharf, mit_schafskäse,
             ohne_zwiebel, extra_soße, nur_salat,
             total_price, created_at, paid
      FROM orders
    `;
    const result = await pool.query(query);

    const orders = result.rows.map(order => {
      const createdAt = new Date(order.created_at);
      const formattedDate = `${String(createdAt.getDate()).padStart(2, '0')}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${createdAt.getFullYear().toString().slice(2)}`;

      return {
        ...order,
        ohne_soße: order.ohne_soße ? "X" : "",
        ohne_tomate: order.ohne_tomate ? "X" : "",
        mit_scharf: order.mit_scharf ? "X" : "",
        mit_schafskäse: order.mit_schafskäse ? "X" : "",
        ohne_zwiebel: order.ohne_zwiebel ? "X" : "",
        extra_soße: order.extra_soße ? "X" : "",
        nur_salat: order.nur_salat ? "X" : "",
        created_at: formattedDate,
        paid: order.paid ? "Bezahlt" : "Nicht Bezahlt"
      };
    });

    res.json({ orders });
  } catch (err) {
    console.error('Fehler beim Abrufen aller Bestellungen:', err);
    res.status(500).json({ error: err.message });
  }
});


// Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
