// #region Configs
// Local File Imports
const verifyToken = require('./components/verifyToken');
// ExpressJS Requirements
const express = require('express'); // ExpressJS Framework
const app = express(); // Application
const cors = require('cors'); // Cross-origin resource sharing
var http = require('http'), https = require('https'), fs = require('fs');
// Authentication Requirements and Configs
const jwt = require('jsonwebtoken'); // JWT for auth
const bcrypt = require("bcrypt") // Hashing library for Auth
const saltRounds = 10 // Salt config for BCrypt
// MSSQL and its config
const sql = require('mssql');
const data = require("./sqluser.json");
const sqlConfig = {
  user: data[0].user,
  // user: "app",
  password: data[0].password,
  // password: "Pfc123!",
  database: data[0].database,
  // database: "testing",
  server: data[0].server,
  // server: "localhost",
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
// #endregion

app.use(express.json());
app.use(cors());

// #region AuthRegion
// Login of existing users
app.use('/login', async (req, res) => {
  var date = new Date();
  var username = req.body.username;
  var password = req.body.password;

  try {
    await sql.connect(sqlConfig);
    let query = `select password, email from Users WHERE username like '${username}'`;
    var dboPassword = await sql.query(query) //`select password from Users WHERE username like '${req.body.username}'`// where username like "${req.body.username}"`;
    if (dboPassword.rowsAffected == 0) {
      res.status(401).json({ message: 'User does not exist' });
      return;
    }
    var valid = await bcrypt.compare(password, dboPassword.recordset[0].password);
    var email = dboPassword.recordset[0].email;

    if (valid === false) {
      console.log("denied");
      res.status(401).json({ message: 'Bad Credentials' })
    } else {
      var data = {
        signInTime: Date.now(),
        username,
        email
      }

      const token = jwt.sign(data, 'secretkey', { expiresIn: '10m' }); // JWT that expires in 10 minutes
      console.log(username, ' logging in from ', req.socket.remoteAddress, ' at ', date.toLocaleDateString());
      var decoded = jwt.decode(token);
      console.log(`token created : ${JSON.stringify(decoded.email)}`);
      res.status(200).json({ message: 'success', token })
    }
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
})
// Login of existing users
app.use('/verify', async (req, res) => {
  console.log('verifying');

  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(200).json({ message: 'failure' }); // 403 'Forbidden' (invalid token)
    } else {
      try {
        res.status(200).json({ message: 'success' });
      } catch (error) {
        res.status(500).json({ message: error });
      }
    }
  });
})
// #endregion

// #region Gets
// Get list of all patients
app.use('/patients', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`SELECT * FROM dbo.Patient`;
        res.status(200).json({ message: 'success', patients: result.recordset });
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Get unique patient
app.use('/patient/:id', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`SELECT * FROM dbo.Patient 
          WHERE (dbo.Patient.FirstName = '${req.body.FirstName}'
          AND dbo.Patient.LastName = '${req.body.LastName}'
          AND dbo.Patient.DOB = '${req.body.DOB}')
          OR (dbo.Patient.id = '${req.params}')`;
        res.status(200).json({ message: 'success', patient: result.recordset });
      } catch (err) {
        res.status(500).json({ message: err });
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
        const result = await sql.query`SELECT * FROM dbo.Appointment`;
        res.json(result.recordset);
      } catch (err) {
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
        const result = await sql.query`SELECT * FROM dbo.Message`;
        res.json(result.recordset);
      } catch (err) {
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
        const result = await sql.query`SELECT * FROM dbo.Lab`;
        res.json(result.recordset);
      } catch (err) {
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
        const result = await sql.query`SELECT * FROM dbo.Prescription`;
        res.json(result.recordset);
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// #endregion

// #region Creates
// Create a new user
app.use('/createuser', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).json({ message: "Invalid User" }); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        var password = await bcrypt.hash(req.body.Password, saltRounds);
        const result = await sql.query`insert into dbo.Users values(${req.body.Username},${password},${req.body.Email},${req.body.First_Name},${req.body.Surname},${req.body.Role})`;

        if (result.rowsAffected = 1) {
          res.status(200).json({ message: "Success!" });
        }
      } catch (err) {
        res.status(500).json({ message: err });
      }
    }
  });
});
// Create a new patient
app.use('/createpatient', verifyToken.verifyToken, (req, res) => {
  var newPatient = req.body.patient;
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).send({ message: "Invalid Login" }); // 403 'Forbidden' (invalid token)
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
        res.status(200).send({ message: "success" });
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
// #endregion

// #region Updates
// Update existing user
app.use('/updateuser/', (req, res) => {

  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).json({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        var password = await bcrypt.hash(req.body.Password, saltRounds);
        const result = await sql.query`UPDATE dbo.Users
          VALUES (${req.body.Username},${req.body.Password},${req.body.Email},${req.body.First_Name},${req.body.Surname},${req.body.Role})
          WHERE dbo.Users.Username = '${req.body.username}'`;
        if (result.rowsAffected = 1) {
          res.status(200).json({ message: "Success!" });
        }
      } catch (error) {
        res.status(500).json({ message: error });
      }
    }
  });
});
// Update existing patient
app.use('/updatepatient/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).send({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`UPDATE dbo.Patient
          VALUES (
            ${req.params},
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
            ${newPatient.Diagnoses})
          WHERE dbo.Patient.id = '${req.params}'`;
        res.status(200).send({ message: "success" });
      } catch (err) {
        res.status(500).send({ message: err });
      }
    }
  });
});
// Update existing appointment
app.use('/updateappointment/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`UPDATE dbo.Appointment
          VALUES(
            ${Username},
            ${Password},
            ${Email},
            ${First_Name},
            ${Surname},
            ${Role})
          WHERE dbo.Appointment.id = '${req.params}`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Update existing message
app.use('/updatemessage/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`UPDATE dbo.Message
          VALUES(
            ${Username},
            ${Password},
            ${Email},
            ${First_Name},
            ${Surname},
            ${Role})
          WHERE dbo.Message.id = '${req.params}'`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Update existing lab
app.use('/updatelab/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`UPDATE dbo.Lab
          VALUES(
            ${Username},
            ${Password},
            ${Email},
            ${First_Name},
            ${Surname},
            ${Role})
          WHERE dbo.Lab.id = '${req.params}'`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Update existing prescription
app.use('/updateprescription/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`UPDATE dbo.Prescription
          VALUES(
            ${Username},
            ${Password},
            ${Email},
            ${First_Name},
            ${Surname},
            ${Role})
          WHERE dbo.Prescription.id = ''${req.params}`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// #endregion

// #region Deletes
// Delete existing user
app.use('/deleteuser/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).json({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        var password = await bcrypt.hash(req.body.Password, saltRounds);
        const result = await sql.query`DELETE FROM dbo.Users
          WHERE dbo.Users.id = '${req.params}'`;
        if (result.rowsAffected = 1) {
          res.status(200).json({ message: "Success!" });
        }
      } catch (err) {
        res.status(500).json({ message: err });
      }
    }
  });
});
// Delete existing patient
app.use('/deletepatient/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).send({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Patient
          WHERE dbo.Patient.id = '${req.params}'`;
        res.status(200).send({ message: "success" });
      } catch (err) {
        res.status(500).send({ message: err });
      }
    }
  });
});
// Delete existing appointment
app.use('/deleteappointment/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Appointment
          WHERE dbo.Appointment.id = '${req.params}`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Delete existing message
app.use('/deletemessage/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Message
          WHERE dbo.Message.id = '${req.params}'`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Delete existing lab
app.use('/deletelab/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Lab
          WHERE dbo.Lab.id = '${req.params}'`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Delete existing prescription
app.use('/deleteprescription/:id', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Prescription
          WHERE dbo.Prescription.id = ''${req.params}`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// #endregion








http.createServer(app).listen(5174);

https.createServer({
  key: fs.readFileSync('./ssl/privkey3.pem'),
  cert: fs.readFileSync('./ssl/cert3.pem'),
  // ca: certificateAuthority,
  ciphers: [
    "ECDHE-RSA-AES128-SHA256",
    "DHE-RSA-AES128-SHA256",
    "AES128-GCM-SHA256",
    "RC4",
    "HIGH",
    "!MD5",
    "!aNULL"
  ].join(':'),
}, app).listen(5175);