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
const e = require('express');
const { verify } = require('crypto');
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

// #region Vars for SQL
var allowedPrescriptionColumns = ["id", "Patientid", "PrescriptionName", "OrderDate", "Dosage"] // PRESCRIPTION
var allowedLabColumns = ["id", "Patientid", "Lab", "OrderDate", "Status", "Results"] // LAB
var allowedMessageColumns = ["id", "Patientid", "MessageHeader", "MessageContents", "Status"] // MESSAGE
var allowedAppointmentColumns = ["id", "Patientid", "ScheduledDate", "Status"] // APPOINTMENT
var allowedUserColumns = ["Username", "Password", "Email", "FirstName", "LastName", "Role"] // USER
var allowedPatientColumns = ["id", "FirstName", "LastName", "DOB", "Phone", "Sex", "Address", "EmergencyContact", "EmergencyContactPhone", "Prescriptions",
  "PrescriptionHistory", "HealthHistory", "FamilyHistory", "Diagnoses"] // PATIENT
// #endregion

// #region Functions
async function createQuery(input, req) {
  var stmts = [];

  for (let c of input) {
    if (c in req.body) {
      if (c === 'Password') {
        let pw = await bcrypt.hash(req.body[c], saltRounds)
        stmts.push(`${c} = '${pw}'`)
      } else {
        stmts.push(`${c} = '${req.body[c]}'`)
      }
    }
    console.log(stmts);
  }

  return stmts;
}
// #endregion

// #region AuthRegion
// Login of existing users
app.use('/login', async (req, res) => {
  var date = new Date();
  var username = req.body.username;
  var password = req.body.password;
  
  try {
    await sql.connect(sqlConfig);
    let query = `SELECT Password, Email from Users WHERE Username like '${username}'`;
    var dboPassword = await sql.query(query)
    if (dboPassword.rowsAffected == 0) {
      res.status(401).json({ message: 'User does not exist' });
      return;
    }
    var valid = await bcrypt.compare(password, dboPassword.recordset[0].Password);
    var email = dboPassword.recordset[0].Email;

    if (valid === false) {
      console.log("denied");
      res.status(401).json({ message: 'Bad Credentials' })
    } else {
      var data = {
        signInTime: Date.now(),
        username,
        email
      }

      const token = jwt.sign(data, 'secretkey', { expiresIn: '60m' }); // JWT that expires in 60 minutes
      console.log(username, '\tlogging in from\t', req.socket.remoteAddress, '\tat\t', date.toLocaleDateString());
      // var decoded = jwt.decode(token);
      // console.log(`token created : ${JSON.stringify(decoded.email)}`);
      res.status(200).json({ message: 'success', token })
    }
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
})
// Login of existing users
app.use('/verify', async (req, res) => {
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
app.use('/patient/', verifyToken.verifyToken, (req, res) => {
  
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`SELECT * FROM dbo.Patient WHERE id = ${req.body.id}`;
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
        const result = await sql.query`SELECT * FROM dbo.Patient WHERE id = ${req.body.id}`;
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
app.use('/updateuser', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).json({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedUserColumns, req);

        if (stmts.length == 0) {
          return res.sendStatus(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Users SET ${stmts.join(", ")} WHERE Username = '${req.body.Username}'`)
        res.status(200).json({ message: "Success!" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
      }
    }
  });
});
// Update existing patient
app.use('/updatepatient', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      console.log(err);
      res.status(403).send({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedPatientColumns, req);

        if (stmts.length == 0) {
          return res.sendStatus(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Patient SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
        res.status(200).send({ message: "success" });
      } catch (err) {
        console.log(err);
        res.status(500).send({ message: err });
      }
    }
  });
});
// Update existing appointment
app.use('/updateappointment/', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedAppointmentColumns, req);
        stmts.push(`LastModified = '${new Date().toISOString().replace(/T/, ' ').replace(/Z/, '')}'`)

        if (stmts.length == 0) {
          return res.sendStatus(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Appointment SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
        res.status(200).send({ message: "success" });
      } catch (err) {
        console.log(err);
        res.send(500, err);
      }
    }
  });
});
// Update existing message
app.use('/updatemessage/', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedMessageColumns, req);
        stmts.push(`LastModified = '${new Date().toISOString().replace(/T/, ' ').replace(/Z/, '')}'`)

        if (stmts.length == 0) {
          return res.sendStatus(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Message SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
        res.status(200).send({ message: "success" });
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Update existing lab
app.use('/updatelab/', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedLabColumns, req);
        stmts.push(`LastModified = '${new Date().toISOString().replace(/T/, ' ').replace(/Z/, '')}'`)

        if (stmts.length <= 1) {
          return res.sendStatus(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Lab SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
        res.status(200).send({ message: "success" });
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Update existing prescription
app.use('/updateprescription/', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedPrescriptionColumns, req);
        stmts.push(`LastModified = '${new Date().toISOString().replace(/T/, ' ').replace(/Z/, '')}'`)

        if (stmts.length <= 1) {
          return res.sendStatus(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Prescription SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
        res.status(200).send({ message: "success" });
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// #endregion

// #region Deletes
// Delete existing user
app.use('/deleteuser/', (req, res) => {
app.use('/deleteuser/', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).json({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Users
          WHERE dbo.Users.id = '${req.body.id}'`;
          WHERE dbo.Users.id = '${req.body.id}'`;
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
app.use('/deletepatient/', (req, res) => {
app.use('/deletepatient/', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).send({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Patient
          WHERE dbo.Patient.id = '${req.body.id}'`;
          WHERE dbo.Patient.id = '${req.body.id}'`;
        res.status(200).send({ message: "success" });
      } catch (err) {
        res.status(500).send({ message: err });
      }
    }
  });
});
// Delete existing appointment
app.use('/deleteappointment/', (req, res) => {
app.use('/deleteappointment/', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Appointment
          WHERE dbo.Appointment.id = '${req.body.id}`;
          WHERE dbo.Appointment.id = '${req.body.id}`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Delete existing message
app.use('/deletemessage/', (req, res) => {
app.use('/deletemessage/', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Message
          WHERE dbo.Message.id = '${req.body.id}'`;
          WHERE dbo.Message.id = '${req.body.id}'`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Delete existing lab
app.use('/deletelab/', (req, res) => {
app.use('/deletelab/', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Lab
          WHERE dbo.Lab.id = '${req.body.id}'`;
          WHERE dbo.Lab.id = '${req.body.id}'`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Delete existing prescription
app.use('/deleteprescription/', (req, res) => {
app.use('/deleteprescription/', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.sendStatus(403); // 403 'Forbidden'
    } else {
      try {
        let
          stmts = [],
          values = [];

        for (let c of allowedPrescriptionColumns) {
          if (c in req.body) {  //check if there is a value for that column in the request body
            stmts.push(`${c} = ?`),
              values.push(req.body[c]);
          }
        }

        if (stmts.length == 0) {
          return res.send(204).send({ message: "No Content Submitted" }); // 204 "No Content"
        }

        values.push(cid);
        await sql.query(`UPDATE Company_Master SET ${stmts.join(", ")} WHERE company_id = ?`, values, (err, result) => {

        });



        // await sql.connect(sqlConfig);
        // await sql.query`DELETE FROM dbo.Prescription
        // WHERE dbo.Prescription.id = ''${req.body.id}`;
        res.status(200).send({ message: "Successful" });
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// #endregion

// #region StartServer
// #region StartServer
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
// #endregion
// #endregion