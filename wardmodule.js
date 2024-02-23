/*      
This module, Patient Registration Module consists of this code "regmodule.js" and another two MonogoDB schema files "regops.js" & "logops.js" and other libraries
The module is functioning in a way to receive API requests to create, search and delete patient records. 
Patient records are stored through the regops while all activties are logged through the logops.
The module will also validate different inputs received from external APIs to gurantee that the DB is protected.
*/

//Create the necessary libraries, dotenv is used for hiding the DB credentials while express & mangoose are used for API communicaiton
const express = require('express');
const wardapp = express();
wardapp.use(express.json())
const mongoose = require('mongoose');
const { MongoClient,ObjectId } = require("mongodb");
require('dotenv/config');
const bodyParser = require('body-parser');
const { verifyToken, verifyClerkRole } = require('./middleware/authMiddleware');

//Two schemas are used under the Mongo collection for storing and retreiving the records.
const wardops = require('../DEVOPSCW/dbops/wardops');

//Here connection to DB using the variables from the .env
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('DB is connected!'))
    .catch((err) => console.error('Unable to connect to DB.', err));



// Connection URI
const uri = process.env.DATABASE_URL;
const dbName = 'test';
const collectionName = 'Ward Management';

function readCollection(){
    
}

//Post request create a ward with empty list of maintenance, equipments, rooms, and nurses
//and default value for all fields
//capacity=0, number_of_rooms=0,current_patients=0
wardapp.post('/v1/ward/',  async (req, res) => {
    console.log("post function")
    console.log(req.body);
    const newWard = new wardops({
        ward_number:req.body.ward_number,
        ward_name:req.body.ward_name,
        floor_number:req.body.floor_number,
    });      
    try {
        const savedRecord = await newWard.save();  
        res.status(200).json(savedRecord);
        //res.json(savedRecord)
    } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.pnumber) {
            res.status(400).json({ message: 'Duplicate ward number' });
        } else {
            res.status(500).json({ message: err.message });
        }
    }
});

/**
 * adding maintenance history to each ward
 */
wardapp.post('/v1/addmaintenance/:wardnumber/',  async (req, res) => {
    console.log("post function")
    //console.log(req.body);
    const { wardnumber } = req.params;
    /**
     postman test: {"newMaintenance":
        {"last_maintenance_date":"2024-02-28T12:00:00", 
        "next_maintenance_date":"2024-03-01T12:00:00"}}
     */
    const { newMaintenance } = req.body;
    console.log(wardnumber);
    try{
        // Create a new MongoClient
        const client = new MongoClient(uri);

        // Connect to the MongoDB server
        await client.connect();

        // Select the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const result = await collection.updateOne(
            { ward_number: wardnumber }, // Filter based on ward number
            { $addToSet: { maintenance: newMaintenance } } // Update array of maintenance object
        );
        if (result.modifiedCount === 1) {
            res.send('Maintenance added successfully');
        } else {
            res.status(404).send('Ward number not found');
        }
    }
    catch (err) {
        console.error('Error occurred:', err);
        res.status(500).send('Database or variable error');
    }
});

wardapp.listen(8585, () => console.log('Ward Management Server running on port 8585'));