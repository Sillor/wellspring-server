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

// Login of existing users
app.use('/login', async (req, res) => {
  var date = new Date();
  var username = '';
  try {
    var username = req.body.username;
  } catch (error) {
    console.log(error);
  }

  try {
    await sql.connect(sqlConfig);
    let query = `select password from Users WHERE username like '${username}'`;
    const dboPassword = await sql.query(query) //`select password from Users WHERE username like '${req.body.username}'`// where username like "${req.body.username}"`;
    const valid = await bcrypt.compare(req.body.password, dboPassword.recordset[0].password);

    if (valid === false) {
      console.log("denied");
      res.send(401);
    } else {
      let data = {
        signInTime: Date.now(),
        username,
      }

      const token = jwt.sign(data, 'secretkey', { expiresIn: '10m' }); // JWT that expires in 10 minutes
      console.log(username, ' logging in from ', req.socket.remoteAddress, ' at ', date.toLocaleDateString());
      res.status(200).json({ message: 'success', token })
    }
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
})

// Get list of all patients
app.use('/patients', verifyToken.verifyToken, (req, res) => {
  console.log('patients ping');
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`select * from Patient`;
        console.log(result);
        res.status(200).json({ message: 'success', patients: result.recordset });
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});

// Get list of all appointments
app.use('/appointments', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`select * from Appointment`;
        res.json(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});

// Get list of messages
app.use('/messages', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`select * from Message`;
        res.json(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});

// Get list of labs
app.use('/labs', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`select * from Lab`;
        res.json(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});

// Get list of prescriptions
app.use('/prescriptions', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`select * from Prescription`;
        res.json(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});

// Create a new user
app.use('/createuser', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into Users(Username,Password,Email,First_Name,Surname,Role) values(${Username},${Password},${Email},${First_Name},${Surname},${Role})`;
        console.log(result);
        // res.json(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});

// Create a new patient
app.use('/createpatient', verifyToken.verifyToken, (req, res) => {
  var newPatient = req.body.patient;
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).send({ message: "Invalid Login"}); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into Patient values(
          NewID(),
          ${newPatient.FirstName},
          ${newPatient.LastName},
          ${newPatient.DOB},
          ${newPatient.Phone},
          ${newPatient.Sex},
          ${newPatient.Address},
          ${newPatient.EmergencyContact},
          ${newPatient.EmergencyContactPhone},
          ${newPatient.Prescriptions},
          ${newPatient.PrescriptionHistory},
          ${newPatient.HealthHistory},
          ${newPatient.FamilyHistory},
          ${newPatient.Diagnoses})`;
        res.status(200).send({ message: "success"});
      } catch (err) {
        res.status(500).send({ message: err });
      }
    }
  });
});

// Create a new appointment
app.use('/createappointment', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into Users(Username,Password,Email,First_Name,Surname,Role) values(${Username},${Password},${Email},${First_Name},${Surname},${Role})`;
        console.log(result);
        // res.json(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});

// Create a new message
app.use('/createmessage', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into Users(Username,Password,Email,First_Name,Surname,Role) values(${Username},${Password},${Email},${First_Name},${Surname},${Role})`;
        console.log(result);
        // res.json(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});

// Create a new lab
app.use('/createlab', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into Users(Username,Password,Email,First_Name,Surname,Role) values(${Username},${Password},${Email},${First_Name},${Surname},${Role})`;
        console.log(result);
        // res.json(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});

// Create a new prescription
app.use('/createprescription', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into Users(Username,Password,Email,First_Name,Surname,Role) values(${Username},${Password},${Email},${First_Name},${Surname},${Role})`;
        console.log(result);
        // res.json(result.recordset);
      } catch (err) {
        console.log('Error in /post\n', err);
        res.send(500, err);
      }
    }
  });
});




// Start Server
app.listen(5174, () => console.log('API is running on http://localhost:5174'));