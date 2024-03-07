// ExpressJS Requirements
const express = require('express'); // ExpressJS Framework
const app = express(); // Application
const cors = require('cors'); // Cross-origin resource sharing

// Authentication Requirements and Configs
const jwt = require('jsonwebtoken'); // JWT for auth
const bcrypt = require("bcrypt") // Hashing library for Auth
const saltRounds = 10 // Salt config for BCrypt

// MSSQL and its config
const sql = require('mssql');
const sqlConfig = {
  user: 'app',
  password: 'Pfc123!',
  database: 'Testing',
  server: 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 3000
  },
  options: {
    encrypt: false,
    trustServerCertificate: true // change to true for local dev / self-signed certs
  }
}

// ExpressJS 'use' configs
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// App icon TBD
// app.use('/favicon.ico', epxress.static('./favicon.ico'))


// Inititalization of ExpressJS Application
var hashedup = null; // TESTING ONLY

// Testing request
app.use('/test', (req, res) => {
  let username = "admin";
  let pass = "Admin@123";
  let createdDate = new Date(Date.now());

  bcrypt
    .genSalt(saltRounds)
    .then(async salt => {
      return [await bcrypt.hash(pass, salt), salt]
    })
    .then(hash => {
      let user_Obj = { "username": username, "hash": hash[0], "created": createdDate };
      console.log(user_Obj);
      hashedup = hash[0];
      res.send(`<h1>${hash}</h1>`)
      //return true;
    })
    .catch(err => { return err.message })
})

// Registration of new users
app.use('/register', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let createdDate = new Date(Date.now());

  // Check if username already exists

  // Username already exists!

  // Username does not exist

  // Update USER table in SQL
});

// Login of existing users
app.use('/login', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  const valid = await bcrypt.compare(password, hashedup);

  if (valid === false) {
    res.send("Invalid Credentials.");
  } else {
    res.send("Success");
    jwt.sign({ user: username }, "secretkey", (err, token) => {
      res.json({ token });
    });
  }
})

// TESTING of JWT auth's
app.post('/post', verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      res.json({
        message: "POST created...",
        authData
      });
    }
  });
});

// Verification of JWT's
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}

app.use('/sql', async (req, res) => {
  try {
    await sql.connect(sqlConfig);
    const result = await sql.query`select * from Users`;
    res.send(`<p>${JSON.stringify(result)}</p>`);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
})

// Start Server
app.listen(8080, () => console.log('API is running on http://localhost:8080'));