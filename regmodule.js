/*      
This module, Patient Registration Module consists of this code "regmodule.js" and another two MonogoDB schema files "regops.js" & "logops.js" and other libraries
The module is functioning in a way to receive API requests to create, search and delete patient records. 
Patient records are stored through the regops while all activties are logged through the logops.
The module will also validate different inputs received from external APIs to gurantee that the DB is protected.
*/

//Create the necessary libraries, dotenv is used for hiding the DB credentials while express & mangoose are used for API communicaiton
const express = require('express');
const regapp = express();
const mongoose = require('mongoose');
require('dotenv/config');
const bodyParser = require('body-parser');
const { verifyToken, verifyClerkRole } = require('./middleware/authMiddleware');

//Two schemas are used under the Mongo collection for storing and retreiving the records.
const regops = require('../DEVOPSCW/dbops/regops');
const logops = require('../DEVOPSCW/dbops/logops');
//note that there is no intention to retreive the logops through the applicaiton. Access to the logops will be only for investaiton and will be directily thoruhg Admin access.\

//Here connection to DB using the variables from the .env
mongoose.connect(process.env.DB_CONNECTION_REG)
    .then(() => console.log('DB is connected!'))
    .catch((err) => console.error('Unable to connect to DB.', err));

regapp.use(bodyParser.json());

// Middleware to validate inputs before creating a new record
function validateInputs(req, res, next) {
    const { pnumber, pname, dob, blood, gender, through, knowndiseases, knownallergies } = req.body;

    // Validation for pnumber (Patient Number), only 8 digits numbers will be accepted. This is assumed to be the national ID and will be a key identifier, cannot be replicated
    if (!/^\d{8}$/.test(pnumber)) {
        return res.status(400).json({ message: 'pnumber should be 8 digits only' });
    }

    // Validation for pname, Patient Name can be only letters.
    if (!/^[a-zA-Z\s]+$/.test(pname)) {
        return res.status(400).json({ message: 'name should only include alphabets' });
    }

    // Validation for dob, date of birth is between 120 yrs and current date only
    const dobDate = new Date(dob);
    const currentDate = new Date();
    const maxAgeDate = new Date(currentDate.getFullYear() - 120, currentDate.getMonth(), currentDate.getDate());
    if (isNaN(dobDate) || dobDate < maxAgeDate || dobDate > currentDate) {
        return res.status(400).json({ message: 'dob should be a valid date and between 120 years and today' });
    }

    // Validation for blood if it's not empty, can be ignored for registration
    if (blood && !/^(A|B|AB|O)[+-]$/.test(blood)) {
        return res.status(400).json({ message: 'blood should be limited to accept blood group letters/combinations with + or -' });
    }

    // Validation for gender, while controling the case of the inputs
    if (!['male', 'female'].includes(gender.toLowerCase())) {
        return res.status(400).json({ message: 'gender should be either "male" or "female"' });
    }

    // Validation for through if it's provided, default is OPD
    if (through && !['opd', 'a&e', 'referred'].includes(through.toLowerCase())) {
        return res.status(400).json({ message: 'through should be either "OPD", "A&E", or "Referred"' });
    }

    // Validation for knowndiseases and knownallergies from injected attacks
    const diseasesValidation = Array.isArray(req.body.knowndiseases) &&
        req.body.knowndiseases.every(d => typeof d === 'string' && /^[a-zA-Z\s,.-]+$/.test(d));
    const allergiesValidation = Array.isArray(req.body.knownallergies) &&
        req.body.knownallergies.every(a => typeof a === 'string' && /^[a-zA-Z\s,.-]+$/.test(a));

    if (!diseasesValidation) {
        return res.status(400).json({ message: 'Invalid known diseases format or content.' });
    }

    if (!allergiesValidation) {
        return res.status(400).json({ message: 'Invalid known allergies format or content.' });
    }

    next(); // Move to the next middleware
}

// the next subsections including the API calls of get, post & delete
//          /v1/list                ->        to get all records 
//          /v1/pnumber/xxxxxxxx    ->        to get a particual recrod
//          /v1/pname/*             ->        to search names          
//          /v1/delete/xxxxxxxx     ->        to delete a particual recrod

regapp.get('/v1/list', verifyToken, async (req, res) => {
    try {
        const readRecord = await regops.find();    //get all records
        res.json(readRecord);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

regapp.get('/v1/pnumber/:pnumber', async (req, res) => {
    try {
        // Fetch the records based on pnumber, one recrod at a time
        const readRecord = await regops.find({ pnumber: req.params.pnumber });

        // Log patient view, logging patient viewed and associated user viewed the record
        const logEntry = new logops({
            reglog: `Patient with pnumber ${req.params.pnumber} viewed!`,
            timestamp: new Date().toISOString(),
            user: "TBD"
        });
        await logEntry.save(); // Save the log entry to the database

        // Send the fetched records as the response
        res.json(readRecord);

        //        console.log(`Patient with pnumber ${req.params.pnumber} viewed!`); // Log to console, test operation 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

regapp.get('/v1/pname/:pname', async (req, res) => {
    try {
        const partialName = req.params.pname;
        const regex = new RegExp(partialName, 'i');
        const readRecord = await regops.find({ pname: { $regex: regex } }); //search for partial match
        res.json(readRecord);

        // Log patient search, user activtites including user details
        const logEntry = new logops({
            reglog: `Patient search with pname ${req.params.pname} performed!`,
            timestamp: new Date().toISOString(),
            user: "TBD"
        });
        await logEntry.save();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Protecting the patient registration route
regapp.post('/v1/reg/', verifyToken, verifyClerkRole, validateInputs, async (req, res) => {
    console.log(req.body);
    const createRecord = new regops(req.body);      //receives the body and reflect it in the DB collection

    try {
        const savedRecord = await createRecord.save();  //save record then log entry
        res.status(200).json(savedRecord);
        // Create a log entry
        const logEntry = new logops({
            reglog: JSON.stringify(req.body) + " patient registered!",  //retrun the registered record along with a confiraiton. 
            timestamp: new Date().toISOString(),
            user: "TBD"
        });
        await logEntry.save();

    } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.pnumber) {
            res.status(400).json({ message: 'Duplicate pnumber found' });
        } else {
            res.status(500).json({ message: err.message });
        }
    }
});

// DELETE route to delete records based on pnumber
regapp.delete('/v1/delete/:pnumber', async (req, res) => {
    try {
        const deletedRecord = await regops.findOneAndDelete({ pnumber: req.params.pnumber });
        if (!deletedRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json({ message: 'Record deleted successfully', deletedRecord });
        // Create a log entry
        const logEntry = new logops({
            reglog: JSON.stringify(req.body) + " patient deleted!", //return deleted record and log it with a timestamp
            timestamp: new Date().toISOString(),
            user: "TBD"
        });
        await logEntry.save();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

regapp.listen(8080, () => console.log('Server running on port 8080'));