const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt'); // use for hash password
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'user',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get a connection from the pool and execute a query to create the table if it doesn't exist
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      username VARCHAR(15) PRIMARY KEY,
      password VARCHAR(255) NOT NULL
    )
  `;

  connection.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }

    console.log('Table "users" created or already exists');
  });

  // Added user admin if not exists and password is hashed (password)
    const createAdminQuery = `
        INSERT IGNORE INTO users (username, password) VALUES ('admin', ?)
    `;
    const hashedPassword = bcrypt.hashSync('password', 10);
    connection.query(createAdminQuery, [hashedPassword], (err, results) => {
        if (err) {
            console.error('Error creating admin user:', err);
            return;
        }

        console.log('Admin user created or already exists');
    });

  // Release the connection back to the pool
  connection.release();
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session
app.use(session({
    secret: 'abc', // Replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Routes
app.get('/', (req, res) => {
    // Check if user is already logged in
    if (req.session.user) {
        return res.redirect('/about');
    } else {
        res.render('home', { title: 'Home' });
    }
});

app.get('/login', (req, res) => {
    // Check if user is already logged in
    if (req.session.user) {
        return res.redirect('/about');
    } else {
        res.render('login', { title: 'Login' });
    }
});

// make login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Get a connection from the pool
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return;
        }

        const selectUserQuery = `
            SELECT * FROM users WHERE username = ?
        `;

        connection.query(selectUserQuery, [username], (err, results) => {
            if (err) {
                console.error('Error selecting user:', err);
                return;
            }

            if (results.length === 0) {
                res.render('login', { title: 'Login', error: 'Invalid username or password' });
                return;
            }

            const user = results[0];

            if (!bcrypt.compareSync(password, user.password)) {
                res.render('login', { title: 'Login', error: 'Invalid username or password' });
                return;
            }

            req.session.user = user;
            res.redirect('/about');

            // Release the connection back to the pool
            connection.release();
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/about', (req, res) => {
    if (req.session.user) {
        res.render('about', { title: 'About', user: req.session.user });
    } else {
        res.redirect('/login');
    }
});

app.listen(port);