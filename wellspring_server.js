// Local File Imports
const verifyToken = require('./components/verifyToken');

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

// App icon TBD
// app.use('/favicon.ico', epxress.static('./favicon.ico'))

// ExpressJS 'use' configs
// app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Inititalization of ExpressJS Application
var hashedup = "$2b$10$CVs8L8LhNNnlz3R4c2gBiunmMD6dV6RdAZfnzN1qa8m4s8ph3/Dmu"; // TESTING ONLY

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
  var username = req.body.username;
  var password = req.body.password;
  console.log(username, ' logging in from ', password);

  try {
    const valid = await bcrypt.compare(password, hashedup);

    if (valid === false) {
      console.log("denied");
      res.send(401);
    } else {
      let data = {
        signInTime: Date.now(),
        username,
      }

      const token = jwt.sign(data, 'secretkey', {expiresIn: '10m'}); // JWT that expires in 10 minutes
      res.status(200).json({ message: 'success', token })
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
})

// TESTING of JWT auth's
app.use('/post', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`select top 1 * from Patient`;
        res.json(result.recordset);
        console.log(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(err);
      }
    }
  });
});

// Verification of JWT's


async function sqlTesting() {
  try {
    await sql.connect(sqlConfig);
    const result = await sql.query`select * from Users`;
    res.send(`<p>${JSON.stringify(result)}</p>`);
  } catch (err) {
    console.log(err);
    res.send(err);
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
app.listen(5174, () => console.log('API is running on http://localhost:5174'));