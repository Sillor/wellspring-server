// #region Configs
// Local File Imports
const verifyToken = require('./components/verifyToken');
// ExpressJS Requirements
const express = require('express'); // ExpressJS Framework
const app = express(); // Application
const cors = require('cors'); // Cross-origin resource sharing
var http = require('http'), https = require('https'), fs = require('fs');
// Authentication Requirements and Configs
const jwt = require('jsonwebtoken'); // JWT for authentication
const saltRounds = 10 // Salt config for BCrypt
// MSSQL and its config
const sql = require('mssql');
const data = require("./sqluser.json");
const e = require('express');
const { verify } = require('crypto');
const nodemon = require('nodemon');
const mailer = require('./mailer/Mailer.cjs');
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
var allowedDoctorCodes = ["id", "activecode", "invitedby"] // Doctor Codes
var allowedPrescriptionColumns = ["id", "Patientid", "PrescriptionName", "OrderDate", "Dosage", "Active", "OrderedBy"] // PRESCRIPTION
var allowedLabColumns = ["id", "Patientid", "Lab", "OrderDate", "Status", "Results"] // LAB
var allowedMessageColumns = ["id", "Patientid", "MessageHeader", "MessageContents", "Status"] // MESSAGE
var allowedAppointmentColumns = ["id", "Patientid", "ScheduledDate", "Status", "Username", "Notes", "Time", "Care"] // APPOINTMENT
var allowedUserColumns = ["Username", "Password", "Email", "FirstName", "LastName", "Role", "PatientList"] // USER
var allowedPatientColumns = ["FirstName", "LastName", "id", "DOB", "Phone", "Sex", "Address", "EmergencyContact", "EmergencyContactPhone", "Prescriptions",
  "PrescriptionHistory", "HealthHistory", "FamilyHistory", "Diagnoses", "BloodType", "RHFactor", "PreviousDiagnosis", "Allergies"] // PATIENT
// #endregion

// #region Functions
async function createQuery(input, req) {
  var stmts = [];

  for (let c of input) {
    if (c in req.body) {
      if (c === 'Password') {
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
    if (password === dboPassword.recordset[0].Password) {
      valid = true
    } else valid = false
    var email = dboPassword.recordset[0].Email;

    if (valid === false) {
      console.log(`denied ${username} from ${req.socket.remoteAddress} at\t ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      res.status(401).json({ message: 'Bad Credentials' })
    } else {
      var data = {
        signInTime: Date.now(),
        username,
        email
      }

      const token = jwt.sign(data, 'secretkey', { expiresIn: '60m' }); // JWT that expires in 60 minutes
      console.log(username, '\tlogging in from\t', req.socket.remoteAddress, '\tat\t', date.toLocaleDateString(), ' ', date.toLocaleTimeString());
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
app.use('/verify', verifyToken.verifyToken, async (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    console.log(`verifying `)
    if (err) {
      console.log(`bad token?`)
      res.status(403).json({ message: 'failure' }); // 403 'Forbidden' (invalid token)
    } else {
      try {
        console.log('good')
        res.status(200).json({ message: 'success' });
      } catch (error) {
        res.status(500).json({ message: 'failure' });
      }
    }
  });
})
// #endregion







// #region Gets
// Get list of doctor codes
app.use('/doctorcodes', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      console.log(err);
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`SELECT * FROM dbo.DoctorCodes`;
        res.json(result.recordset);
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});

// Get list of all patients
app.use('/patients', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`SELECT * FROM dbo.Patients`;
        res.status(200).json({ message: 'success', patients: result.recordset });
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Get unique patient
app.use('/patient', verifyToken.verifyToken, (req, res) => {

  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`SELECT * FROM dbo.Patients WHERE id = ${req.body.id}`;
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
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const user = jwt.decode(req.token);
        console.log(user.username);
        const result = await sql.query`SELECT * FROM dbo.Appointments WHERE Username = ${user.username}`;
        res.json(result.recordset);
      } catch (err) {
        console.log(err);
        res.status(500).send(err);
      }
    }
  });
});
// Get list of messages
app.use('/messages', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden' (invalid token)
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
      res.status(403); // 403 'Forbidden' (invalid token)
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
      res.status(403); // 403 'Forbidden' (invalid token)
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

// Get list of all users
app.use('/users', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`SELECT * FROM dbo.Users`;
        res.json(result.recordset);
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});

// Get unique user
app.use('/user', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`SELECT * FROM dbo.Users WHERE Username = ${req.body.Username}`;
        res.json(result.recordset);
      } catch (err) {
        res.send(500, err);
      }
    }
  }
  );
});
// #endregion





// #region Creates
// Create a new doctor code
app.use('/createdoctorcode', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      console.log(err);
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into dbo.DoctorCodes VALUES(NewID(), ${req.body.activecode}, ${req.body.invitedby})`;
        res.send({ message: "Success!" });
      } catch (err) {
        console.log('Error in create doctor code\n', err);
        res.send(500, err);
      }
    }
  });
});

// Create a new user
app.use('/createuser', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).json({ message: "Invalid User" }); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into dbo.Users values(${req.body.Username},${req.body.Password},${req.body.Email},${req.body.FirstName},${req.body.LastName},${req.body.Role})`;
        res.send({ message: "Success!" });
      } catch (err) {
        console.log('Error in create user\n', err);
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
        const result = await sql.query`insert into Patients values(
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
          ${newPatient.Diagnoses},
          ${newPatient.BloodType},
          ${newPatient.RHFactor},
          ${newPatient.PreviousDiagnosis},
          ${newPatient.Allergies}
        )`;


        const emailQuery = `SELECT Email FROM dbo.Users WHERE Username = '${authData.username}'`;
        const emailResult = await sql.query(emailQuery);
        const email = emailResult.recordset[0].Email;
        console.log(`Attepmt to send email to ${email}`)
        mailer.sendPatientEmail(email, req.body);

        res.status(200).send({ message: "success" });
      } catch (err) {
        console.log('Error in create patient\n', err);
        res.status(500).send({ message: err });
      }
    }
  });
});

// Create a new appointment
app.use('/createappointment', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).send(err); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into dbo.Appointments VALUES(
          NewID(),
          CAST(${req.body.Patientid} AS uniqueidentifier),
          ${req.body.ScheduledDate},
          ${req.body.Status},
          ${req.body.Username},
          ${req.body.Notes},
          ${req.body.Time},
          ${req.body.Care})`;



        const emailQuery = `SELECT Email FROM dbo.Users WHERE Username = '${authData.username}'`;
        const emailResult = await sql.query(emailQuery);
        const email = emailResult.recordset[0].Email;
        mailer.sendAppointmentEmail(email, req.body);

        res.send({ message: "success" });
      } catch (err) {
        console.log('Error in create appointment\n', err);
        res.send(500, err);
      }
    }
  });
});

// Create a new message
app.use('/createmessage', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into Messages(Username,Password,Email,First_Name,Surname,Role) values(${Username},${Password},${Email},${First_Name},${Surname},${Role})`;
        res.send({ message: "success" })
      } catch (err) {
        console.log('Error in create message\n', err);
        res.send(500, err);
      }
    }
  });
});

// Create a new lab
app.use('/createlab', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into Lab VALUES(NewID(),${Patientid},${Lab},${OrderDate},${Status},${Results})`;

        

        const emailQuery = `SELECT Email FROM dbo.Users WHERE Username = '${authData.username}'`;
        const emailResult = await sql.query(emailQuery);
        const email = emailResult.recordset[0].Email;
        mailer.sendLabOrderEmail(email, req.body);


        res.send({ message: "success" });
      } catch (err) {
        console.log('Error in create lab\n', err);
        res.send(500, err);
      }
    }
  });
});

// Create a new prescription
app.use('/createprescription', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`insert into dbo.Prescription VALUES(
          NewID(), 
          ${req.body.Patientid},
          ${req.body.PrescriptionName},
          ${req.body.OrderDate},
          ${req.body.Dosage},
          ${req.body.Active},
          ${req.body.OrderedBy}
        )`;
        console.log("successful create prescription")
        res.send({ message: "success" });
      } catch (err) {
        console.log('Error in createt prescription\n', err);
        res.send(500, err);
      }
    }
  });
});
// #endregion

// #region Updates
// Update existing doctor code
app.use('/updatedoctorcode', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      console.log(err);
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`UPDATE dbo.DoctorCodes SET activecode = ${req.body.activecode}, invitedby = ${req.body.invitedby} WHERE id = ${req.body.id}`;
        res.send({ message: "success" });
      } catch (err) {
        res.status(500).send(err);
      }
    }
  });
});

// Update existing user
app.use('/updateuser', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).json({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedUserColumns, req);

        if (stmts.length == 0) {
          return res.status(204); //nothing to do
        }

        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Users SET ${stmts.join(", ")} WHERE Username = '${req.body.Username}'`)
        res.send({ message: "Success!" });
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
          return res.status(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Patients SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
        res.send({ message: "success" });
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
      res.status(403); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedAppointmentColumns, req);
        stmts.push(`LastModified = '${new Date().toISOString().replace(/T/, ' ').replace(/Z/, '')}'`)

        if (stmts.length == 0) {
          return res.status(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Appointments SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
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
      res.status(403); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedMessageColumns, req);
        stmts.push(`LastModified = '${new Date().toISOString().replace(/T/, ' ').replace(/Z/, '')}'`)

        if (stmts.length == 0) {
          return res.status(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Messages SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
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
      res.status(403); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedLabColumns, req);
        stmts.push(`LastModified = '${new Date().toISOString().replace(/T/, ' ').replace(/Z/, '')}'`)

        if (stmts.length <= 1) {
          return res.status(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Labs SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
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
      res.status(403); // 403 'Forbidden'
    } else {
      try {
        let stmts = await createQuery(allowedPrescriptionColumns, req);
        stmts.push(`LastModified = '${new Date().toISOString().replace(/T/, ' ').replace(/Z/, '')}'`)

        if (stmts.length <= 1) {
          return res.status(204); //nothing to do
        }
        await sql.connect(sqlConfig);
        await sql.query(`UPDATE dbo.Prescriptions SET ${stmts.join(", ")} WHERE id = '${req.body.id}'`)
        res.status(200).send({ message: "success" });
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// #endregion

// #region Deletes
// Delete existing doctor code
app.use('/deletedoctorcode', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      console.log(err);
      res.status(403); // 403 'Forbidden' (invalid token)
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.DoctorCodes WHERE id = ${req.body.id}`;
        res.json(result.recordset);
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});

// Delete existing user
app.use('/deleteuser/', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).json({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Users WHERE dbo.Users.id = '${req.body.id}'`;
        if (result.rowsAffected = 1) {
          res.send({ message: "Success!" });
        }
      } catch (err) {
        res.status(500).json({ message: err });
      }
    }
  });
});

// Delete existing patient
app.use('/deletepatient/', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403).send({ message: "Access Denied" }); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.PatientsWHERE dbo.Patients.id = '${req.body.id}'`;
        res.send({ message: "success" });
      } catch (err) {
        res.status(500).send({ message: err });
      }
    }
  });
});
// Delete existing appointment
app.use('/deleteappointment', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden'
    } else {
      try {
        console.log(req.body.id);
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE from dbo.Appointments where dbo.Appointments.id = CAST(${req.body.id} AS uniqueidentifier)`;
        res.status(200).send({ message: "success" });
      } catch (err) {
        console.log(err);
        res.send(500, err);
      }
    }
  });
});
// Delete existing message
app.use('/deletemessage/', verifyToken.verifyToken, (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Messages WHERE dbo.Messages.id = '${req.body.id}'`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Delete existing lab
app.use('/deletelab/', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Labs
          WHERE dbo.Labs.id = '${req.body.id}'`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// Delete existing prescription
app.use('/deleteprescription/', (req, res) => {
  jwt.verify(req.token, "secretkey", async (err, authData) => {
    if (err) {
      res.status(403); // 403 'Forbidden'
    } else {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query`DELETE FROM dbo.Prescriptions
          WHERE dbo.Prescriptions.id = ''${req.params}`;
      } catch (err) {
        res.send(500, err);
      }
    }
  });
});
// #endregion

// #region StartServer
http.createServer(app).listen(5174, () => {
  console.log('ding');
});

// https.createServer({
//   key: fs.readFileSync('./ssl/privkey3.pem'),
//   cert: fs.readFileSync('./ssl/cert3.pem'),
//   // ca: certificateAuthority,
//   ciphers: [
//     "ECDHE-RSA-AES128-SHA256",
//     "DHE-RSA-AES128-SHA256",
//     "AES128-GCM-SHA256",
//     "RC4",
//     "HIGH",
//     "!MD5",
//     "!aNULL"
//   ].join(':'),
// }, app).listen(5175);
// #endregion