const express = require('express');
const cors = require('cors');
const app = express();

// Inititalization

// App icon TBD
// app.use('/favicon.ico', epxress.static('./favicon.ico'))

app.use(express.json());
app.use(cors);



// Server-App Components

// Login
app.use('/login', (req, res) => {
    let username = `${req.body.username}`;
    let password = `${req.body.password}`;

    // Auth
})



// Start Server
app.listen(8080, () => console.log('API is running on http://localhost:8080'));