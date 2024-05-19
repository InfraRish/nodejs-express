const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt'); // use for hash password
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

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

app.listen(port);