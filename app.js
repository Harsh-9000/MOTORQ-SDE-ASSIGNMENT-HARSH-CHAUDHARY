const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv/config');

// Routes
const documentsRouter = require('./routers/documents');
const usersRouter = require('./routers/users');


// Database Connection
mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log("Connected to Database");
    })
    .catch((err) => {
        console.log(err);
    });


const app = express();
const api = process.env.API_URL;

// Middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));

app.use(`${api}/document`, documentsRouter);
app.use(`${api}/users`, usersRouter);

// Server 
app.listen(3000, () => {
    console.log('Server Started');
});