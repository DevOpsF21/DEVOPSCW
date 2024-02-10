const express = require('express');
const mongoose = require('mongoose');
const Patient = require('./models/patient');

const app = express();
const port = 3000;

app.use(express.json());

const password = '10vVkcArvkRhFqGe';
const dbName = 'DevOps'; // Name of the database

const mongoDB = `mongodb+srv://svetlis2000:${password}@initialpatientregistrat.kw4yj15.mongodb.net/${dbName}`;

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
};

mongoose.connect(mongoDB, options);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
    console.log(`Connected to the ${dbName} database`);
});

app.get('/', (req, res) => {
    res.send('Hello World! Connected to MongoDB.');
});

app.post('/register-patient', async (req, res) => {
    try {
        // Directly passing req.body to the Patient constructor
        const patient = new Patient(req.body);
        await patient.save();
        res.status(201).send(patient);
    } catch (error) {
        console.error(error);
        // Check if the error is a Mongoose ValidationError
        if (error.name === 'ValidationError') {
            // Map the errors to extract messages
            const messages = Object.values(error.errors).map(val => val.message);
            // Send back a 400 status with the validation error messages
            res.status(400).send({ errors: messages });
        } else {
            // For any other type of error, send a 500 status
            res.status(500).send('An unexpected error occurred');
        }
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

// Previous version of app.js
// const express = require('express');
// const mongoose = require('mongoose');
// const Patient = require('./models/patient');

// const app = express();
// const port = 3000;

// app.use(express.json());

// const password = '10vVkcArvkRhFqGe';
// const mongoDB = `mongodb+srv://svetlis2000:${password}@initialpatientregistrat.kw4yj15.mongodb.net/?retryWrites=true&w=majority`;

// mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// app.get('/', (req, res) => {
//     res.send('Hello World! Connected to MongoDB.');
// });

// app.post('/register-patient', async (req, res) => {
//     try {
//         // Directly passing req.body to the Patient constructor
//         const patient = new Patient(req.body);
//         await patient.save();
//         res.status(201).send(patient);
//     } catch (error) {
//         console.error(error);
//         // Check if the error is a Mongoose ValidationError
//         if (error.name === 'ValidationError') {
//             // Map the errors to extract messages
//             const messages = Object.values(error.errors).map(val => val.message);
//             // Send back a 400 status with the validation error messages
//             res.status(400).send({ errors: messages });
//         } else {
//             // For any other type of error, send a 500 status
//             res.status(500).send('An unexpected error occurred');
//         }
//     }
// });


// app.listen(port, () => {
//     console.log(`Server listening at http://localhost:${port}`);
// });